/**
 * WatchPlayer - Video player with sync capabilities
 * @author Senior FE Developer
 * @version 1.0
 */

import React, { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { useVideoSync } from '../hooks/useVideoSync';
import '../css/WatchPlayer.css';

// Debug logging (set to false to disable verbose logs)
const DEBUG_ENABLED = false;

/**
 * @typedef {import('../types/watch').WsEvent} WsEvent
 */

export function WatchPlayer({ videoUrl, isHost, onLocalControl, controlEvent, autoplay = false }) {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [showAutoplayWarning, setShowAutoplayWarning] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  /**
   * Initialize video.js player
   */
  useEffect(() => {
    if (!videoRef.current) return;

    // Create player
    const player = videojs(videoRef.current, {
      controls: true,
      autoplay: 'muted', // Allow autoplay with muted (bypass browser policy)
      preload: 'metadata',
      fluid: true,
      responsive: true,
      playbackRates: [0.5, 1, 1.5, 2],
      html5: {
        vhs: {
          overrideNative: true,
        },
        nativeVideoTracks: false,
        nativeAudioTracks: false,
        nativeTextTracks: false,
      },
    });

    playerRef.current = player;

    // Player ready
    player.ready(() => {
      DEBUG_ENABLED && console.log('[WatchPlayer] Player ready');
      setIsReady(true);
      
      // Log player info
      DEBUG_ENABLED && console.log('[WatchPlayer] Player version:', videojs.VERSION);
      DEBUG_ENABLED && console.log('[WatchPlayer] Player tech:', player.currentTechOrder_);
    });

    // Track play/pause state
    player.on('play', () => {
      DEBUG_ENABLED && console.log('[WatchPlayer] Video playing');
      setIsPlaying(true);
    });

    player.on('pause', () => {
      DEBUG_ENABLED && console.log('[WatchPlayer] Video paused');
      setIsPlaying(false);
    });

    // Track loading
    player.on('loadstart', () => {
      DEBUG_ENABLED && console.log('[WatchPlayer] Load started');
    });

    player.on('loadedmetadata', () => {
      DEBUG_ENABLED && console.log('[WatchPlayer] Metadata loaded');
      DEBUG_ENABLED && console.log('[WatchPlayer] Video duration:', player.duration());
    });

    player.on('loadeddata', () => {
      DEBUG_ENABLED && console.log('[WatchPlayer] Data loaded');
    });

    player.on('canplay', () => {
      DEBUG_ENABLED && console.log('[WatchPlayer] Can play');
    });

    player.on('canplaythrough', () => {
      DEBUG_ENABLED && console.log('[WatchPlayer] Can play through');
    });

    // Track errors
    player.on('error', () => {
      const error = player.error();
      console.error('[WatchPlayer] Player error:', error);
      
      if (error) {
        console.error('[WatchPlayer] Error code:', error.code);
        console.error('[WatchPlayer] Error message:', error.message);
        
        // Show user-friendly error
        if (error.code === 4) {
          console.error('[WatchPlayer] Media not supported or not found');
        } else if (error.code === 2) {
          console.error('[WatchPlayer] Network error');
        }
      }
    });

    // Cleanup
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [autoplay]);

  /**
   * Update video source
   */
  useEffect(() => {
    if (!playerRef.current || !videoUrl) return;

    DEBUG_ENABLED && console.log('[WatchPlayer] Setting video source', videoUrl);

    try {
      // Detect video type from URL
      let videoType = 'video/mp4'; // Default
      
      if (videoUrl.includes('.m3u8')) {
        videoType = 'application/x-mpegURL'; // HLS
      } else if (videoUrl.includes('.mpd')) {
        videoType = 'application/dash+xml'; // DASH
      } else if (videoUrl.includes('.mp4')) {
        videoType = 'video/mp4';
      } else if (videoUrl.includes('.webm')) {
        videoType = 'video/webm';
      }

      DEBUG_ENABLED && console.log('[WatchPlayer] Detected video type:', videoType);

      playerRef.current.src({
        src: videoUrl,
        type: videoType,
      });

      // Try to load the video
      playerRef.current.load();

      // Log any errors
      playerRef.current.on('error', (error) => {
        console.error('[WatchPlayer] Video error:', error);
        console.error('[WatchPlayer] Player error details:', playerRef.current.error());
      });

    } catch (error) {
      console.error('[WatchPlayer] Error setting video source:', error);
    }
  }, [videoUrl]);

  /**
   * Use video sync hook
   */
  useVideoSync({
    player: playerRef.current,
    isHost,
    onLocalControl,
    controlEvent,
    onAutoplayBlocked: () => setShowAutoplayWarning(true),
  });

  /**
   * Configure controls for host vs non-host
   */
  useEffect(() => {
    if (!playerRef.current) return;

    const player = playerRef.current;
    const controlBar = player.controlBar?.el();

    if (!controlBar) return;

    // Get control elements
    const playToggle = controlBar.querySelector('.vjs-play-control');
    const progressControl = controlBar.querySelector('.vjs-progress-control');
    const playbackRateMenu = controlBar.querySelector('.vjs-playback-rate');

    if (isHost) {
      // Enable ALL controls for host
      controlBar.style.pointerEvents = 'auto';
      controlBar.style.opacity = '1';
      
      if (playToggle) playToggle.style.pointerEvents = 'auto';
      if (progressControl) progressControl.style.pointerEvents = 'auto';
      if (playbackRateMenu) playbackRateMenu.style.pointerEvents = 'auto';
    } else {
      // Non-host: Allow play/pause (for local control), disable seek
      controlBar.style.pointerEvents = 'auto';
      controlBar.style.opacity = '1';
      
      if (playToggle) playToggle.style.pointerEvents = 'auto'; // Allow pause/play
      if (progressControl) progressControl.style.pointerEvents = 'none'; // Disable seek
      if (playbackRateMenu) playbackRateMenu.style.pointerEvents = 'none'; // Disable speed
    }
  }, [isHost, isReady]);

  /**
   * Show host indicator
   */
  const renderHostBadge = () => {
    if (!isHost) return null;

    return (
      <div className="watch-player-host-badge">
        👑 Bạn là Host
      </div>
    );
  };

  /**
   * Show non-host warning (DISABLED - no longer needed)
   */
  const renderNonHostWarning = () => {
    // Don't show warning at all - users understand host controls
    return null;
  };

  /**
   * Show autoplay warning
   */
  const renderAutoplayWarning = () => {
    if (!showAutoplayWarning) return null;

    return (
      <div className="watch-player-autoplay-warning">
        🔇 Video đã tự động tắt tiếng để phát. Click để bật tiếng.
        <button
          onClick={() => {
            if (playerRef.current) {
              playerRef.current.muted(false);
              setShowAutoplayWarning(false);
            }
          }}
          className="watch-player-unmute-btn"
        >
          🔊 Bật tiếng
        </button>
      </div>
    );
  };

  return (
    <div className="watch-player-container">
      {renderHostBadge()}
      {renderNonHostWarning()}
      {renderAutoplayWarning()}

      <div data-vjs-player>
        <video
          ref={videoRef}
          className="video-js vjs-big-play-centered"
        />
      </div>
    </div>
  );
}

export default WatchPlayer;
