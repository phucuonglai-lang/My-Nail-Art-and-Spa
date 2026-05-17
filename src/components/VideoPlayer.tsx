import React from 'react';
import YouTube from 'react-youtube';

interface VideoPlayerProps {
  videoUrl: string;
  onEnd?: () => void;
  containerClassName?: string;
  className?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, onEnd, containerClassName, className }) => {
  if (!videoUrl) return null;

  const isMp4 = videoUrl.toLowerCase().endsWith('.mp4');
  
  // Try to get YouTube ID
  const ytRegExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/|live\/)([^#\&\?]*).*/;
  const ytMatch = videoUrl.match(ytRegExp);
  
  // Also check if the URL is literally just an 11-char ID
  let ytId = '';
  if (ytMatch && ytMatch[2].length === 11) {
    ytId = ytMatch[2];
  } else if (videoUrl.trim().length === 11 && !videoUrl.includes('/') && !videoUrl.includes('.')) {
    ytId = videoUrl.trim();
  }

  if (ytId) {
    return (
      <YouTube
        videoId={ytId}
        onEnd={onEnd}
        containerClassName={containerClassName}
        className={className}
        opts={{
          width: '100%',
          height: '100%',
          playerVars: {
            autoplay: 1,
            modestbranding: 1,
            origin: window.location.origin,
            playsinline: 1
          },
        }}
      />
    );
  }

  if (isMp4) {
    return (
      <video 
        src={videoUrl} 
        controls 
        autoPlay 
        playsInline 
        className={className || containerClassName || 'w-full h-full object-cover'} 
        onEnded={onEnd}
      />
    );
  }

  // Fallback to iframe (for bunny.net embeds, vimeo, etc.)
  return (
    <div className={containerClassName || 'w-full h-full'}>
      <iframe
        src={videoUrl}
        className={className || 'w-full h-full'}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        style={{ border: 'none' }}
      />
    </div>
  );
};

export default VideoPlayer;
