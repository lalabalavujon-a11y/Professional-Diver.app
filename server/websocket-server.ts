import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

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

let wss: WebSocketServer | null = null;
const clients = new Map<string, Set<WebSocket>>(); // generationId -> Set of clients

export function initializeWebSocketServer(httpServer: Server) {
  wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws/generation-progress',
    perMessageDeflate: false, // Disable compression for lower latency
  });

  wss.on('connection', (ws: WebSocket, req) => {
    console.log('🔌 WebSocket client connected');
    
    // Handle ping/pong for connection health
    ws.on('pong', () => {
      // Client responded to ping
    });

    // Handle client messages (subscriptions)
    ws.on('message', (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'subscribe' && data.generationId) {
          // Subscribe to a specific generation ID
          const generationId = data.generationId;
          if (!clients.has(generationId)) {
            clients.set(generationId, new Set());
          }
          clients.get(generationId)!.add(ws);
          console.log(`📡 Client subscribed to generation: ${generationId}`);
          
          // Send confirmation
          ws.send(JSON.stringify({
            type: 'subscribed',
            generationId,
          }));
        } else if (data.type === 'unsubscribe' && data.generationId) {
          // Unsubscribe from a generation ID
          const generationId = data.generationId;
          const clientSet = clients.get(generationId);
          if (clientSet) {
            clientSet.delete(ws);
            if (clientSet.size === 0) {
              clients.delete(generationId);
            }
          }
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      console.log('🔌 WebSocket client disconnected');
      // Remove client from all subscriptions
      for (const [generationId, clientSet] of clients.entries()) {
        clientSet.delete(ws);
        if (clientSet.size === 0) {
          clients.delete(generationId);
        }
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Send initial connection confirmation
    ws.send(JSON.stringify({
      type: 'connected',
      message: 'WebSocket connection established',
    }));
  });

  // Ping clients every 30 seconds to keep connection alive
  const pingInterval = setInterval(() => {
    if (wss) {
      wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }
  }, 30000);

  wss.on('close', () => {
    clearInterval(pingInterval);
  });

  console.log('✅ WebSocket server initialized at /ws/generation-progress');
}

export function emitGenerationProgress(progress: GenerationProgress) {
  if (!wss) {
    console.warn('⚠️ WebSocket server not initialized');
    return;
  }

  const { generationId } = progress;
  const clientSet = clients.get(generationId);

  if (clientSet && clientSet.size > 0) {
    const message = JSON.stringify({
      ...progress,
      type: 'generation-progress',
    });

    // Send to all clients subscribed to this generation
    clientSet.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(message);
        } catch (error) {
          console.error('Error sending WebSocket message:', error);
        }
      }
    });

    console.log(`📤 Emitted progress for ${generationId}: ${progress.status} - ${progress.progress}`);
  } else {
    // Broadcast to all clients if no specific subscription (fallback)
    const message = JSON.stringify({
      ...progress,
      type: 'generation-progress',
    });

    wss.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(message);
        } catch (error) {
          console.error('Error broadcasting WebSocket message:', error);
        }
      }
    });
  }
}

export function emitGenerationComplete(progress: GenerationProgress) {
  emitGenerationProgress({
    ...progress,
    status: 'complete',
  });
}

export function emitGenerationError(progress: GenerationProgress & { error: string }) {
  emitGenerationProgress({
    ...progress,
    status: 'error',
  });
}
