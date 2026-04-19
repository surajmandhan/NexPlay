import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, X, Maximize, Loader2, RotateCcw, RotateCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CustomPlayerProps {
  videoKey?: string | null;
  directUrl?: string | null;
  onClose: () => void;
  title?: string;
}

export default function CustomPlayer({ videoKey, directUrl, onClose, title = "Now Playing" }: CustomPlayerProps) {
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true); 
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [buffering, setBuffering] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);
  const [quality, setQuality] = useState<string>('hd1080');

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const durationRef = useRef(0); // Memory to remember total duration
  const userQualityRef = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isYouTube = !!videoKey;
  const mediaSrc = videoKey 
    ? `https://www.youtube.com/embed/${videoKey}?autoplay=1&controls=0&disablekb=1&modestbranding=1&rel=0&iv_load_policy=3&enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}`
    : directUrl;

  // Piche baithe YouTube Iframe ko signals bhejne ka function
  const sendCommand = (func: string, args?: any[]) => {
    if (isYouTube && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func, args: args || [] }),
        '*'
      );
    } else if (videoRef.current) {
      if (func === 'playVideo') videoRef.current.play();
      if (func === 'pauseVideo') videoRef.current.pause();
      if (func === 'seekTo' && args) videoRef.current.currentTime = args[0];
      if (func === 'mute') videoRef.current.muted = true;
      if (func === 'unMute') videoRef.current.muted = false;
    }
  };

  // YouTube Iframe ki state (Play/Pause/Time) ko detect karna
  useEffect(() => {
    if (!isYouTube) return;
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://www.youtube.com') return;
      try {
        const data = JSON.parse(event.data);
        if (data.event === 'onReady') {
          setBuffering(false);
          if (muted) sendCommand('mute');
        }
        if (data.info) {
          if (data.info.duration) {
            durationRef.current = data.info.duration;
            setDuration(data.info.duration);
          }
          if (data.info.currentTime !== undefined) {
            setCurrentTime(data.info.currentTime);
            if (durationRef.current > 0) {
              setPlayed(data.info.currentTime / durationRef.current);
            }
          }
          if (data.info.playerState !== undefined) {
            if (data.info.playerState === 1) { setPlaying(true); setBuffering(false); }
            else if (data.info.playerState === 2) setPlaying(false);
            else if (data.info.playerState === 3) setBuffering(true);
            else if (data.info.playerState === 0) onClose(); // Auto-close when video ends
          }
          if (data.info.availableQualityLevels) {
            const levels = data.info.availableQualityLevels;
            setAvailableQualities(levels);
            
            // Set strict default to 720p or Maximum available
            if (!userQualityRef.current && levels.length > 0) {
              const nonAuto = levels.filter((q: string) => q !== 'auto');
              let defaultQ = 'hd1080'; // Target 1080p
              if (!nonAuto.includes('hd1080')) {
                defaultQ = nonAuto[0] || 'auto'; // Fallback to max available (first item)
              }
              userQualityRef.current = defaultQ;
              setQuality(defaultQ);
              sendCommand('setPlaybackQualityRange', [defaultQ, defaultQ]);
              sendCommand('setPlaybackQuality', [defaultQ]);
            }
          }
          // Track current playback speed
          if (data.info.playbackRate !== undefined) {
            setPlaybackRate(data.info.playbackRate);
          }
        }
      } catch (e) {}
    };

    window.addEventListener('message', handleMessage);
    
    // YouTube iframe se zabardasti Time aur Duration updates mangna har aadhe second me
    const pingInterval = setInterval(() => {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: 1 }), '*');
      }
    }, 500);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(pingInterval);
    };
  }, [muted, isYouTube]);

  useEffect(() => {
    if (!isYouTube && videoRef.current) {
      const video = videoRef.current;
      const updateTime = () => {
        setCurrentTime(video.currentTime);
        if (video.duration) {
          durationRef.current = video.duration;
          setDuration(video.duration);
          setPlayed(video.currentTime / video.duration);
        }
      };
      video.addEventListener('timeupdate', updateTime);
      video.addEventListener('playing', () => { setPlaying(true); setBuffering(false); });
      video.addEventListener('pause', () => setPlaying(false));
      video.addEventListener('waiting', () => setBuffering(true));
      video.addEventListener('loadeddata', () => setBuffering(false));
      video.addEventListener('ended', onClose); // Auto-close for MP4s
      return () => {
        video.removeEventListener('timeupdate', updateTime);
        video.removeEventListener('playing', () => setPlaying(true));
        video.removeEventListener('pause', () => setPlaying(false));
        video.removeEventListener('ended', onClose);
      };
    }
  }, [isYouTube, directUrl]);

  useEffect(() => {
    const timer = setTimeout(() => setBuffering(false), 5000);
    return () => clearTimeout(timer);
  }, [mediaSrc]);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (playing) setShowControls(false);
    }, 3000);
  };

  const handleContainerClick = () => {
    if (showSettings) {
      setShowSettings(false);
      return;
    }
    if (!hasInteracted && muted) {
      setMuted(false);
      sendCommand('unMute');
      setHasInteracted(true);
    } else {
      setPlaying(!playing);
      sendCommand(playing ? 'pauseVideo' : 'playVideo');
    }
  };

  const handleSkip = (amount: number) => {
    if (duration > 0) {
      let newTime = Math.max(0, Math.min(currentTime + amount, duration));
      sendCommand('seekTo', [newTime, true]);
      setCurrentTime(newTime);
      setPlayed(newTime / duration);
    }
  };

  const handleSeek = (fraction: number) => {
    if (duration > 0) {
      const newTime = fraction * duration;
      sendCommand('seekTo', [newTime, true]);
      setCurrentTime(newTime);
      setPlayed(fraction);
    }
  };

  const playbackRates = [
    { label: '0.25x', value: 0.25 },
    { label: '0.5x', value: 0.5 },
    { label: '0.75x', value: 0.75 },
    { label: 'Normal', value: 1 },
    { label: '1.25x', value: 1.25 },
    { label: '1.5x', value: 1.5 },
    { label: '2x', value: 2 },
  ];

  const handleSpeedChange = (rate: number) => {
    setPlaybackRate(rate);
    if (isYouTube) {
      sendCommand('setPlaybackRate', [rate]);
    } else if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    } else {
      // Direct video speed update fallback
    }
    setShowSettings(false);
  };

  const formatTime = (seconds: number) => {
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes();
    const ss = date.getUTCSeconds().toString().padStart(2, '0');
    if (hh) return `${hh}:${mm.toString().padStart(2, '0')}:${ss}`;
    return `${mm}:${ss}`;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => console.error(err));
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-black group overflow-hidden flex items-center justify-center"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { if (playing) { setShowControls(false); setShowSettings(false); } }}
      onClick={handleContainerClick}
    >
      {buffering && (
        <div className="absolute inset-0 flex items-center justify-center z-0">
          <Loader2 className="w-12 h-12 text-electric animate-spin" />
        </div>
      )}

      {/* Big Center Play Icon when Paused */}
      {!playing && hasInteracted && !buffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-24 h-24 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-md border border-white/10 shadow-2xl transition-all scale-100 animate-pulse">
            <Play className="w-10 h-10 text-white fill-current ml-2" />
          </div>
        </div>
      )}
      
      <div className="absolute inset-0 z-0">
        {isYouTube && mediaSrc ? (
          <iframe
            ref={iframeRef}
            src={mediaSrc}
            className="w-full h-full border-0 scale-[1.05]"
            allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : mediaSrc ? (
          <video 
            ref={videoRef}
            src={mediaSrc}
            autoPlay
            muted={muted}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-900">
            <span className="text-white/40 italic">Media unavailable...</span>
          </div>
        )}
      </div>

      {/* YOUTUBE BRANDING BLOCKERS (Black Boxes) */}
      {isYouTube && (
        <>
          {/* Top Full Blocker (Hides Title) */}
          <div className="absolute top-0 left-0 right-0 h-[90px] bg-black z-[5] pointer-events-none" />
          {/* Bottom Full Blocker (Hides YouTube Logo & flashes when paused) */}
          <div className="absolute bottom-0 left-0 right-0 h-[90px] bg-black z-[5] pointer-events-none" />
        </>
      )}

      {/* Top Header */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`absolute top-0 left-0 right-0 p-6 z-20 flex justify-between items-center bg-gradient-to-b from-black/90 via-black/40 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
      >
        <span className="font-bold tracking-widest text-white/90 uppercase text-xs">{title}</span>
        <button onClick={onClose} className="p-3 rounded-full bg-white/10 hover:bg-electric transition-all text-white">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Bottom Control Bar */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`absolute bottom-0 left-0 right-0 p-6 z-20 bg-gradient-to-t from-black/90 via-black/60 to-transparent transition-opacity duration-300 ${showControls || !playing ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
         <div className="flex items-center gap-4 mb-4">
           <input
             type="range" min={0} max={0.999999} step="any"
             value={played || 0}
             onMouseDown={() => sendCommand('pauseVideo')}
             onMouseUp={() => { if (playing) sendCommand('playVideo'); }}
             onTouchStart={() => sendCommand('pauseVideo')}
             onTouchEnd={() => { if (playing) sendCommand('playVideo'); }}
             onChange={(e) => handleSeek(parseFloat(e.target.value))}
             className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer hover:h-2 transition-all"
             style={{ accentColor: '#ff2b6d' }}
           />
         </div>
         <div className="flex justify-between items-center">
           <div className="flex items-center gap-6">
             <button onClick={() => handleSkip(-10)} className="hover:text-electric transition-colors text-white" title="Rewind 10s">
               <RotateCcw className="w-5 h-5"/>
             </button>
               <button onClick={() => { setPlaying(!playing); sendCommand(playing ? 'pauseVideo' : 'playVideo'); }} className="hover:text-electric transition-colors text-white">
               {playing ? <Pause className="w-7 h-7 fill-current"/> : <Play className="w-7 h-7 fill-current"/>}
             </button>
             <button onClick={() => handleSkip(10)} className="hover:text-electric transition-colors text-white" title="Forward 10s">
               <RotateCw className="w-5 h-5"/>
             </button>
             <div className="flex items-center gap-3">
                 <button onClick={() => { 
                   if (muted) { setMuted(false); sendCommand('unMute'); } 
                   else { setMuted(true); sendCommand('mute'); }
                   setHasInteracted(true);
                 }} className="hover:text-electric transition-colors text-white">
                 {muted ? <VolumeX className="w-6 h-6"/> : <Volume2 className="w-6 h-6"/>}
               </button>
               <span className="text-xs font-bold text-white/70 tracking-wider">
                   {formatTime(currentTime)} <span className="text-white/30 mx-1">/</span> {formatTime(duration)}
               </span>
             </div>
           </div>
          <div className="flex items-center gap-2">
            {isYouTube && (
              <div className="relative">
                <AnimatePresence>
                  {showSettings && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute bottom-full right-0 mb-4 bg-[#110e1b]/95 backdrop-blur-xl border border-white/10 rounded-2xl py-2 min-w-[120px] overflow-hidden origin-bottom-right"
                    >
                      <div className="px-4 py-2 text-[10px] font-black uppercase tracking-[2px] text-white/40 border-b border-white/5 mb-1">
                        Speed
                      </div>
                      {playbackRates.map((r) => (
                        <button
                          key={r.value}
                          onClick={(e) => { e.stopPropagation(); handleSpeedChange(r.value); }}
                          className={`w-full text-left px-4 py-2 text-xs font-bold hover:bg-white/10 transition-colors ${playbackRate === r.value ? 'text-electric' : 'text-white'}`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
                <button onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }} className="hover:text-electric transition-colors text-white p-2">
                  {/* Official YouTube Settings SVG Icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" className="w-5 h-5 fill-current"><path d="M12.844 1h-1.687a2 2 0 00-1.962 1.616 3 3 0 01-3.92 2.263 2 2 0 00-2.38.891l-.842 1.46a2 2 0 00.417 2.507 3 3 0 010 4.525 2 2 0 00-.417 2.507l.843 1.46a2 2 0 002.38.892 3.001 3.001 0 013.918 2.263A2 2 0 0011.157 23h1.686a2 2 0 001.963-1.615 3.002 3.002 0 013.92-2.263 2 2 0 002.38-.892l.842-1.46a2 2 0 00-.418-2.507 3 3 0 010-4.526 2 2 0 00.418-2.508l-.843-1.46a2 2 0 00-2.38-.891 3 3 0 01-3.919-2.263A2 2 0 0012.844 1Zm-1.767 2.347a6 6 0 00.08-.347h1.687a4.98 4.98 0 002.407 3.37 4.98 4.98 0 004.122.4l.843 1.46A4.98 4.98 0 0018.5 12a4.98 4.98 0 001.716 3.77l-.843 1.46a4.98 4.98 0 00-4.123.4A4.979 4.979 0 0012.843 21h-1.686a4.98 4.98 0 00-2.408-3.371 4.999 4.999 0 00-4.12-.399l-.844-1.46A4.979 4.979 0 005.5 12a4.98 4.98 0 00-1.715-3.77l.842-1.459a4.98 4.98 0 004.123-.399 4.981 4.981 0 002.327-3.025ZM16 12a4 4 0 11-7.999 0 4 4 0 018 0Zm-4 2a2 2 0 100-4 2 2 0 000 4Z"></path></svg>
                </button>
              </div>
            )}
            <button onClick={toggleFullscreen} className="hover:text-electric transition-colors text-white p-2">
              <Maximize className="w-5 h-5"/>
            </button>
           </div>
         </div>
      </div>
    </div>
  );
}