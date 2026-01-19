import { useState, useEffect, useRef, useCallback } from 'react';

export interface GenerationProgress {
  generationId: string;
  type: 'pdf' | 'podcast';
  status: 'initializing' | 'extracting' | 'generating' | 'polling' | 'downloading' | 'complete' | 'error';
  progress: string;
  lessonId?: string;
  error?: string;
  metadata?: {
    pdfUrl?: string;
    podcastUrl?: string;
    durationSeconds?: number;
    fileSizeBytes?: number;
  };
}

interface UseGenerationProgressReturn {
  progress: GenerationProgress | null;
  status: GenerationProgress['status'] | null;
  error: string | null;
  isConnected: boolean;
}

export function useGenerationProgress(generationId: string | null): UseGenerationProgressReturn {
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000; // 3 seconds

  const connect = useCallback(() => {
    if (!generationId) {
      return;
    }

    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
    }

    // Determine WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/generation-progress`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('🔌 WebSocket connected');
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;

        // Subscribe to the generation ID
        if (generationId) {
          ws.send(JSON.stringify({
            type: 'subscribe',
            generationId,
          }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'connected') {
            console.log('✅ WebSocket connection confirmed');
          } else if (data.type === 'subscribed') {
            console.log(`✅ Subscribed to generation: ${data.generationId}`);
          } else if (data.type === 'generation-progress') {
            const progressData: GenerationProgress = {
              generationId: data.generationId,
              type: data.type,
              status: data.status,
              progress: data.progress,
              lessonId: data.lessonId,
              error: data.error,
              metadata: data.metadata,
            };
            setProgress(progressData);
            setError(data.error || null);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        setError('WebSocket connection error');
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        setIsConnected(false);

        // Attempt to reconnect if we haven't exceeded max attempts
        if (reconnectAttemptsRef.current < maxReconnectAttempts && generationId) {
          reconnectAttemptsRef.current += 1;
          console.log(`🔄 Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectDelay * reconnectAttemptsRef.current); // Exponential backoff
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setError('Failed to connect to WebSocket after multiple attempts. Using fallback polling.');
        }
      };
    } catch (err) {
      console.error('Error creating WebSocket connection:', err);
      setError('Failed to create WebSocket connection');
      setIsConnected(false);
    }
  }, [generationId]);

  useEffect(() => {
    if (generationId) {
      connect();
    } else {
      // Clean up if no generation ID
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setProgress(null);
      setIsConnected(false);
      setError(null);
    }

    // Cleanup on unmount or generationId change
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [generationId, connect]);

  return {
    progress,
    status: progress?.status || null,
    error,
    isConnected,
  };
}
