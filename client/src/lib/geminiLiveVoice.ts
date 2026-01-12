export type LiveVoiceAgentId = "laura-oracle" | "diver-well";

export interface LiveVoiceEventHandlers {
  onJsonMessage?: (msg: unknown) => void;
  onOpen?: () => void;
  onClose?: (evt: CloseEvent) => void;
  onError?: (evt: Event) => void;
}

function normalizeHttpUrl(value: string): string {
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `https://${value}`;
}

function httpOriginToWsBase(origin: string): string {
  const u = new URL(origin);
  u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
  // Only keep origin (strip any path/query)
  u.pathname = "";
  u.search = "";
  u.hash = "";
  // URL.toString() includes trailing slash; normalize away.
  return u.toString().replace(/\/$/, "");
}

function getWsBaseUrl(): string {
  // Allow explicitly setting WS base (useful when frontend and API are on different hosts).
  const wsEnv = (import.meta as any).env?.VITE_WS_URL as string | undefined;
  if (wsEnv) {
    // Accept either ws(s):// or http(s):// values.
    const normalized = wsEnv.startsWith("ws://") || wsEnv.startsWith("wss://")
      ? wsEnv
      : normalizeHttpUrl(wsEnv);
    return normalized.startsWith("ws://") || normalized.startsWith("wss://")
      ? normalized.replace(/\/$/, "")
      : httpOriginToWsBase(normalized);
  }

  // Fall back to API URL if provided (matches queryClient.ts behavior).
  const apiEnv = (import.meta as any).env?.VITE_API_URL as string | undefined;
  if (apiEnv) {
    const normalized = normalizeHttpUrl(apiEnv);
    const origin = new URL(normalized).origin;
    return httpOriginToWsBase(origin);
  }

  // Default: same host as the current page.
  const isHttps = window.location.protocol === "https:";
  const wsProto = isHttps ? "wss" : "ws";
  return `${wsProto}://${window.location.host}`;
}

function getLivePath(agent: LiveVoiceAgentId): string {
  return agent === "laura-oracle" ? "/api/laura-oracle/live" : "/api/diver-well/live";
}

function base64FromBytes(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function downsampleTo16kHz(
  input: Float32Array,
  inputSampleRate: number
): Float32Array {
  const targetRate = 16000;
  if (inputSampleRate === targetRate) return input;

  const ratio = inputSampleRate / targetRate;
  const newLength = Math.round(input.length / ratio);
  const result = new Float32Array(newLength);

  let offsetResult = 0;
  let offsetInput = 0;
  while (offsetResult < result.length) {
    const nextOffsetInput = Math.round((offsetResult + 1) * ratio);
    // simple average downsample (good enough for speech)
    let sum = 0;
    let count = 0;
    for (let i = offsetInput; i < nextOffsetInput && i < input.length; i += 1) {
      sum += input[i];
      count += 1;
    }
    result[offsetResult] = count > 0 ? sum / count : 0;
    offsetResult += 1;
    offsetInput = nextOffsetInput;
  }

  return result;
}

function floatTo16BitPcm(input: Float32Array): Uint8Array {
  const buffer = new ArrayBuffer(input.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < input.length; i += 1) {
    const s = Math.max(-1, Math.min(1, input[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Uint8Array(buffer);
}

export class GeminiLiveVoiceSession {
  private agent: LiveVoiceAgentId;
  private handlers: LiveVoiceEventHandlers;
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  constructor(agent: LiveVoiceAgentId, handlers: LiveVoiceEventHandlers = {}) {
    this.agent = agent;
    this.handlers = handlers;
  }

  isConnected(): boolean {
    return !!this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  async connect(): Promise<void> {
    if (this.isConnected()) return;

    const wsUrl = `${getWsBaseUrl()}${getLivePath(this.agent)}`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.handlers.onOpen?.();
    };

    this.ws.onclose = (evt) => {
      this.handlers.onClose?.(evt);
    };

    this.ws.onerror = (evt) => {
      this.handlers.onError?.(evt);
    };

    this.ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(String(evt.data)) as unknown;
        this.handlers.onJsonMessage?.(msg);
      } catch {
        // Some payloads may be non-JSON; ignore in UI.
      }
    };

    await new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(() => {
        reject(new Error(`Timed out connecting to live voice WebSocket (${wsUrl})`));
      }, 10000);

      const cleanup = () => window.clearTimeout(timer);

      this.ws?.addEventListener("open", () => {
        cleanup();
        resolve();
      });
      this.ws?.addEventListener("error", () => {
        cleanup();
        reject(new Error(`Failed to connect to live voice WebSocket (${wsUrl})`));
      });
    });
  }

  disconnect(): void {
    try {
      this.stopMicrophone();
    } catch {
      // ignore
    }
    try {
      this.ws?.close();
    } catch {
      // ignore
    }
    this.ws = null;
  }

  async sendText(text: string): Promise<void> {
    if (!text.trim()) return;
    if (!this.isConnected()) await this.connect();
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    // v1alpha bidi payloads commonly use snake_case.
    this.ws.send(
      JSON.stringify({
        client_content: {
          turns: [
            {
              role: "user",
              parts: [{ text }],
            },
          ],
        },
      })
    );
  }

  async startMicrophone(): Promise<void> {
    if (!this.isConnected()) await this.connect();
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    if (this.micStream) return; // already running

    this.audioContext = new AudioContext();
    this.micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    this.source = this.audioContext.createMediaStreamSource(this.micStream);
    // ScriptProcessorNode is deprecated but still widely supported and simplest for this use.
    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (event) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

      const input = event.inputBuffer.getChannelData(0);
      const downsampled = downsampleTo16kHz(input, this.audioContext?.sampleRate ?? 48000);
      const pcmBytes = floatTo16BitPcm(downsampled);
      const data = base64FromBytes(pcmBytes);

      this.ws.send(
        JSON.stringify({
          realtime_input: {
            media_chunks: [
              {
                mime_type: "audio/pcm;rate=16000",
                data,
              },
            ],
          },
        })
      );
    };

    this.source.connect(this.processor);
    // Keep the node alive; do not output audible audio.
    this.processor.connect(this.audioContext.destination);
  }

  stopMicrophone(): void {
    try {
      this.processor?.disconnect();
    } catch {
      // ignore
    }
    try {
      this.source?.disconnect();
    } catch {
      // ignore
    }
    this.processor = null;
    this.source = null;

    try {
      this.micStream?.getTracks().forEach((t) => t.stop());
    } catch {
      // ignore
    }
    this.micStream = null;

    try {
      this.audioContext?.close();
    } catch {
      // ignore
    }
    this.audioContext = null;
  }
}

