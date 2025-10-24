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
      console.log('[WatchPlayer] Player ready');
      setIsReady(true);
    });

    // Track play/pause state
    player.on('play', () => {
      setIsPlaying(true);
    });

    player.on('pause', () => {
      setIsPlaying(false);
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

    console.log('[WatchPlayer] Setting video source', videoUrl);

    playerRef.current.src({
      src: videoUrl,
      type: 'application/x-mpegURL', // HLS
    });
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
   * Disable controls for non-host
   */
  useEffect(() => {
    if (!playerRef.current) return;

    const player = playerRef.current;
    const controlBar = player.controlBar?.el();

    if (!controlBar) return;

    if (isHost) {
      // Enable controls
      controlBar.style.pointerEvents = 'auto';
      controlBar.style.opacity = '1';
    } else {
      // Keep controls visible but disable play/pause/seek buttons
      // User can still adjust volume
      const playToggle = controlBar.querySelector('.vjs-play-control');
      const progressControl = controlBar.querySelector('.vjs-progress-control');
      const playbackRateMenu = controlBar.querySelector('.vjs-playback-rate');

      if (playToggle) playToggle.style.pointerEvents = 'none';
      if (progressControl) progressControl.style.pointerEvents = 'none';
      if (playbackRateMenu) playbackRateMenu.style.pointerEvents = 'none';
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
   * Show non-host warning (only when video is paused)
   */
  const renderNonHostWarning = () => {
    if (isHost) return null;
    if (isPlaying) return null; // Hide when video is playing

    return (
      <div className="watch-player-warning">
        ℹ️ Chỉ host mới có thể điều khiển video
      </div>
    );
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
