import { useState } from 'react';
import { Play, ExternalLink } from 'lucide-react';

interface EmbeddedVideoProps {
  provider: 'youtube' | 'vimeo';
  videoId: string;
  title?: string;
  className?: string;
}

export function EmbeddedVideo({
  provider,
  videoId,
  title,
  className = '',
}: EmbeddedVideoProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  const getThumbnailUrl = () => {
    if (provider === 'youtube') {
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    } else if (provider === 'vimeo') {
      // Vimeo requires API call for thumbnail, use placeholder
      return null;
    }
    return null;
  };

  const getEmbedUrl = () => {
    if (provider === 'youtube') {
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    } else if (provider === 'vimeo') {
      return `https://player.vimeo.com/video/${videoId}?autoplay=1`;
    }
    return '';
  };

  const getWatchUrl = () => {
    if (provider === 'youtube') {
      return `https://www.youtube.com/watch?v=${videoId}`;
    } else if (provider === 'vimeo') {
      return `https://vimeo.com/${videoId}`;
    }
    return '';
  };

  const thumbnailUrl = getThumbnailUrl();

  if (isLoaded) {
    return (
      <div className={`relative aspect-video ${className}`}>
        <iframe
          src={getEmbedUrl()}
          title={title || 'Inbäddad video'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full rounded-lg"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative aspect-video bg-gray-900 rounded-lg overflow-hidden cursor-pointer group ${className}`}
      onClick={() => setIsLoaded(true)}
    >
      {/* Thumbnail */}
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt={title || 'Video thumbnail'}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />

      {/* Play button */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-white/90 group-hover:bg-white flex items-center justify-center transition-all group-hover:scale-110">
          <Play className="w-8 h-8 text-gray-900 ml-1" fill="currentColor" />
        </div>
      </div>

      {/* Provider badge */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2">
        <span className="px-2 py-1 text-xs font-medium bg-black/60 text-white rounded">
          {provider === 'youtube' ? 'YouTube' : 'Vimeo'}
        </span>
        {title && (
          <span className="px-2 py-1 text-xs bg-black/60 text-white rounded truncate max-w-[200px]">
            {title}
          </span>
        )}
      </div>

      {/* External link */}
      <a
        href={getWatchUrl()}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 rounded-lg transition-colors"
      >
        <ExternalLink className="w-4 h-4 text-white" />
      </a>
    </div>
  );
}

// Helper function to parse video URLs
export function parseVideoUrl(url: string): { provider: 'youtube' | 'vimeo'; videoId: string } | null {
  // YouTube patterns
  const youtubePatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of youtubePatterns) {
    const match = url.match(pattern);
    if (match) {
      return { provider: 'youtube', videoId: match[1] };
    }
  }

  // Vimeo patterns
  const vimeoPatterns = [
    /vimeo\.com\/(\d+)/,
    /player\.vimeo\.com\/video\/(\d+)/,
  ];

  for (const pattern of vimeoPatterns) {
    const match = url.match(pattern);
    if (match) {
      return { provider: 'vimeo', videoId: match[1] };
    }
  }

  return null;
}
