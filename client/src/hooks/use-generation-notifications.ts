import { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export interface GenerationCompleteEvent {
  generationId: string;
  type: 'pdf' | 'podcast';
  lessonId?: string;
  metadata?: {
    pdfUrl?: string;
    podcastUrl?: string;
    durationSeconds?: number;
  };
}

export function useGenerationNotifications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Determine WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/generation-progress`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('🔔 Generation notifications WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'generation-progress' && data.status === 'complete') {
            const event: GenerationCompleteEvent = {
              generationId: data.generationId,
              type: data.type,
              lessonId: data.lessonId,
              metadata: data.metadata,
            };

            // Show toast notification
            const contentType = event.type === 'pdf' ? 'PDF' : 'Podcast';
            toast({
              title: `${contentType} Generated Successfully!`,
              description: `The ${contentType.toLowerCase()} has been generated and saved.`,
              action: event.metadata?.pdfUrl || event.metadata?.podcastUrl ? (
                <a
                  href={event.metadata?.pdfUrl || event.metadata?.podcastUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  View {contentType}
                </a>
              ) : undefined,
            });

            // Invalidate queries to refresh UI
            if (event.lessonId) {
              queryClient.invalidateQueries({ queryKey: ['/api/lessons', event.lessonId] });
            }
            queryClient.invalidateQueries({ queryKey: ['/api/lessons'] });
          }
        } catch (err) {
          console.error('Error handling generation notification:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('Generation notifications WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('🔔 Generation notifications WebSocket disconnected');
      };
    } catch (err) {
      console.error('Error creating generation notifications WebSocket:', err);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [toast, queryClient]);
}
