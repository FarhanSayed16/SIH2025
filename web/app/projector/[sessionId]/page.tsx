'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import io, { Socket } from 'socket.io-client';

interface ProjectorContent {
  type: string;
  contentId?: string;
  contentName?: string;
  slideIndex?: number;
  data?: any;
}

export default function ProjectorPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const [socket, setSocket] = useState<Socket | null>(null);
  const [content, setContent] = useState<ProjectorContent | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Connect to Socket.io
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3000';
    const newSocket = io(socketUrl, {
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      console.log('Connected to projector session:', sessionId);
      setConnected(true);
      newSocket.emit('JOIN_PROJECTOR_SESSION', sessionId);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from projector session');
      setConnected(false);
    });

    newSocket.on('PROJECTOR_CONTENT_UPDATE', (data: ProjectorContent) => {
      console.log('Content updated:', data);
      setContent(data);
    });

    newSocket.on('error', (err: string) => {
      setError(err);
    });

    setSocket(newSocket);

    // Fetch initial session data
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
    fetch(`${apiUrl}/projector/sessions/${sessionId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setContent(data.data.currentContent);
        }
      })
      .catch(err => {
        setError('Failed to load session');
        console.error(err);
      });

    return () => {
      newSocket.disconnect();
    };
  }, [sessionId]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!connected || !content) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Connecting to projector session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-gray-900 text-white overflow-hidden">
      {/* Projector Display */}
      <div className="h-full flex items-center justify-center p-8">
        {content.type === 'module' && (
          <div className="text-center max-w-4xl">
            <h1 className="text-5xl font-bold mb-8">{content.contentName || 'Module Content'}</h1>
            {content.data?.description && (
              <p className="text-2xl text-gray-300">{content.data.description}</p>
            )}
          </div>
        )}

        {content.type === 'image' && content.data?.imageUrl && (
          <img
            src={content.data.imageUrl}
            alt={content.contentName || 'Projector Image'}
            className="max-w-full max-h-full object-contain"
          />
        )}

        {content.type === 'video' && content.data?.videoUrl && (
          <video
            src={content.data.videoUrl}
            controls
            autoPlay
            className="max-w-full max-h-full"
          />
        )}

        {content.type === 'presentation' && (
          <div className="text-center max-w-6xl">
            <h1 className="text-4xl font-bold mb-4">{content.contentName || 'Presentation'}</h1>
            {content.data?.slides && content.slideIndex !== undefined && (
              <div className="bg-gray-800 rounded-lg p-8 min-h-[400px] flex items-center justify-center">
                <div className="text-2xl">
                  {content.data.slides[content.slideIndex]?.content || 'Slide content'}
                </div>
              </div>
            )}
            {content.data?.slides && (
              <div className="mt-4 text-gray-400">
                Slide {content.slideIndex !== undefined ? content.slideIndex + 1 : 1} of {content.data.slides.length}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Session Info Overlay */}
      <div className="absolute top-4 right-4 bg-black bg-opacity-50 px-4 py-2 rounded">
        <div className="text-sm">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span>Session: {sessionId}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

