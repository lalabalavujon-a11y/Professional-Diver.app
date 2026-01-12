import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, PlugZap, Plug2, Volume2 } from "lucide-react";
import { GeminiLiveVoiceSession, type LiveVoiceAgentId } from "@/lib/geminiLiveVoice";

export interface LiveVoicePanelHandle {
  connect: () => Promise<void>;
  disconnect: () => void;
  speak: (text: string) => Promise<void>;
  startMic: () => Promise<void>;
  stopMic: () => void;
  stopAudio: () => void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function getNested(obj: unknown, path: string[]): unknown {
  let cur: unknown = obj;
  for (const key of path) {
    if (!isRecord(cur)) return undefined;
    cur = cur[key];
  }
  return cur;
}

function parsePcmRate(mimeType: string | undefined): number | null {
  if (!mimeType) return null;
  const m = /rate=(\d+)/i.exec(mimeType);
  if (!m) return null;
  const rate = Number(m[1]);
  return Number.isFinite(rate) ? rate : null;
}

function bytesFromBase64(data: string): Uint8Array {
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function pcm16leToFloat32(bytes: Uint8Array): Float32Array<ArrayBuffer> {
  const samples = Math.floor(bytes.length / 2);
  // Force ArrayBuffer-backed typed array (avoids TS generic ArrayBufferLike mismatch)
  const out = new Float32Array(new ArrayBuffer(samples * 4)) as Float32Array<ArrayBuffer>;
  for (let i = 0; i < samples; i += 1) {
    const lo = bytes[i * 2];
    const hi = bytes[i * 2 + 1];
    // signed int16 little-endian
    let s = (hi << 8) | lo;
    if (s & 0x8000) s = s - 0x10000;
    out[i] = s / 32768;
  }
  return out;
}

export const LiveVoicePanel = forwardRef<
  LiveVoicePanelHandle,
  { agent: LiveVoiceAgentId; className?: string; onTranscript?: (t: string) => void }
>(function LiveVoicePanel({ agent, className, onTranscript }, ref) {
  const [status, setStatus] = useState<
    "disconnected" | "connecting" | "connected" | "error"
  >("disconnected");
  const [isMicOn, setIsMicOn] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [text, setText] = useState("");

  const audioCtxRef = useRef<AudioContext | null>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const scheduledNodesRef = useRef<AudioBufferSourceNode[]>([]);

  const sessionRef = useRef<GeminiLiveVoiceSession | null>(null);

  const badgeLabel = useMemo(() => {
    return agent === "laura-oracle" ? "Laura Live Voice" : "Diver Well Live Voice";
  }, [agent]);

  const stopAudio = () => {
    for (const node of scheduledNodesRef.current) {
      try {
        node.stop();
      } catch {
        // ignore
      }
    }
    scheduledNodesRef.current = [];
    nextPlayTimeRef.current = 0;
  };

  const ensureAudioContext = async (): Promise<AudioContext> => {
    if (audioCtxRef.current) return audioCtxRef.current;
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch {
        // ignore
      }
    }
    return ctx;
  };

  const playPcmChunk = async (
    base64: string,
    mimeType: string | undefined
  ): Promise<void> => {
    const ctx = await ensureAudioContext();
    const rate = parsePcmRate(mimeType) ?? 24000;
    const bytes = bytesFromBase64(base64);
    const floats = pcm16leToFloat32(bytes);

    const buffer = ctx.createBuffer(1, floats.length, rate);
    buffer.copyToChannel(floats as unknown as Float32Array<ArrayBuffer>, 0);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);

    const now = ctx.currentTime;
    const startAt = Math.max(now + 0.02, nextPlayTimeRef.current || now + 0.02);
    source.start(startAt);
    scheduledNodesRef.current.push(source);
    nextPlayTimeRef.current = startAt + buffer.duration;

    source.onended = () => {
      scheduledNodesRef.current = scheduledNodesRef.current.filter((n) => n !== source);
    };
  };

  const handleJsonMessage = async (msg: unknown) => {
    if (!isRecord(msg)) return;

    if (msg.type === "error" && typeof msg.message === "string") {
      setLastError(msg.message);
      setStatus("error");
      return;
    }
    // Gemini / Google APIs often send { error: { message } }
    const nestedError = msg.error;
    if (
      isRecord(nestedError) &&
      typeof nestedError.message === "string" &&
      nestedError.message.trim()
    ) {
      setLastError(nestedError.message);
      setStatus("error");
      return;
    }

    // Extract text + audio from a few possible shapes.
    const parts =
      (getNested(msg, ["serverContent", "modelTurn", "parts"]) as unknown[]) ??
      (getNested(msg, ["server_content", "model_turn", "parts"]) as unknown[]) ??
      [];

    if (Array.isArray(parts)) {
      for (const part of parts) {
        if (!isRecord(part)) continue;

        const textPart = part.text;
        if (typeof textPart === "string" && textPart.trim()) {
          onTranscript?.(textPart);
        }

        const inline =
          (part.inlineData as unknown) ?? (part.inline_data as unknown) ?? null;
        if (!isRecord(inline)) continue;

        const data = inline.data;
        const mimeType =
          (inline.mimeType as unknown) ??
          (inline.mime_type as unknown) ??
          undefined;

        if (typeof data === "string" && data.length > 0) {
          await playPcmChunk(data, typeof mimeType === "string" ? mimeType : undefined);
        }
      }
    }
  };

  const ensureSession = () => {
    if (sessionRef.current) return sessionRef.current;

    sessionRef.current = new GeminiLiveVoiceSession(agent, {
      onOpen: () => {
        setStatus("connected");
        setLastError(null);
      },
      onClose: () => {
        setStatus("disconnected");
        setIsMicOn(false);
      },
      onError: () => {
        setStatus("error");
        setIsMicOn(false);
        setLastError("Live voice connection error");
      },
      onJsonMessage: (m) => {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        handleJsonMessage(m);
      },
    });

    return sessionRef.current;
  };

  const connect = async () => {
    setStatus("connecting");
    setLastError(null);
    try {
      await ensureSession().connect();
      setStatus("connected");
    } catch (e) {
      setStatus("error");
      setLastError(e instanceof Error ? e.message : "Failed to connect");
    }
  };

  const disconnect = () => {
    try {
      ensureSession().disconnect();
    } catch {
      // ignore
    }
    stopAudio();
    setIsMicOn(false);
    setStatus("disconnected");
  };

  const speak = async (t: string) => {
    const trimmed = t.trim();
    if (!trimmed) return;
    try {
      if (status !== "connected") await connect();
      await ensureSession().sendText(trimmed);
    } catch (e) {
      setStatus("error");
      setLastError(e instanceof Error ? e.message : "Speak failed");
    }
  };

  const startMic = async () => {
    try {
      if (status !== "connected") await connect();
      await ensureSession().startMicrophone();
      setIsMicOn(true);
    } catch (e) {
      setIsMicOn(false);
      setStatus("error");
      setLastError(e instanceof Error ? e.message : "Microphone start failed");
    }
  };

  const stopMic = () => {
    try {
      ensureSession().stopMicrophone();
    } catch {
      // ignore
    }
    setIsMicOn(false);
  };

  useImperativeHandle(
    ref,
    () => ({
      connect,
      disconnect,
      speak,
      startMic,
      stopMic,
      stopAudio,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [agent, status]
  );

  useEffect(() => {
    return () => {
      try {
        sessionRef.current?.disconnect();
      } catch {
        // ignore
      }
      try {
        audioCtxRef.current?.close();
      } catch {
        // ignore
      }
      audioCtxRef.current = null;
    };
  }, []);

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-2 p-3 border rounded-lg bg-white">
        <div className="flex items-center gap-2 min-w-0">
          <Badge variant="secondary" className="shrink-0">
            {badgeLabel}
          </Badge>
          <span className="text-xs text-slate-600 truncate">
            {status === "connected"
              ? "Connected"
              : status === "connecting"
                ? "Connecting…"
                : status === "error"
                  ? "Error"
                  : "Disconnected"}
          </span>
          {lastError ? (
            <span className="text-xs text-red-600 truncate">{lastError}</span>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {status !== "connected" ? (
            <Button size="sm" variant="outline" onClick={connect}>
              <PlugZap className="w-4 h-4 mr-1" />
              Connect
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={disconnect}>
              <Plug2 className="w-4 h-4 mr-1" />
              Disconnect
            </Button>
          )}

          {!isMicOn ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                startMic();
              }}
              disabled={status === "connecting"}
            >
              <Mic className="w-4 h-4 mr-1" />
              Talk
            </Button>
          ) : (
            <Button size="sm" variant="destructive" onClick={stopMic}>
              <MicOff className="w-4 h-4 mr-1" />
              Stop
            </Button>
          )}

          <Button size="sm" variant="outline" onClick={stopAudio}>
            <Volume2 className="w-4 h-4 mr-1" />
            Stop audio
          </Button>
        </div>
      </div>

      <div className="mt-2 flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Send text to speak (optional)…"
        />
        <Button
          onClick={() => {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            speak(text);
            setText("");
          }}
          disabled={!text.trim()}
        >
          Speak
        </Button>
      </div>
    </div>
  );
});

