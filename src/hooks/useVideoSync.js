/**
 * useVideoSync - Sync video.js player with WebSocket events
 * @author Senior FE Developer
 * @version 1.0
 */

import { useEffect, useRef } from 'react';
import { WS_TYPES, WATCH_CONFIG } from '../types/watch';

// Debug logging (set to false to disable verbose logs)
const DEBUG_ENABLED = false;

/**
 * @typedef {import('../types/watch').WsEvent} WsEvent
 */

/**
 * Hook to synchronize video.js player with WebSocket control events
 * @param {Object} options
 * @param {Object} options.player - video.js player instance
 * @param {boolean} options.isHost - Whether current user is host
 * @param {Function} options.onLocalControl - Callback for local control (type, positionMs)
 * @param {WsEvent} options.controlEvent - Latest control event from WebSocket
 * @param {Function} [options.onAutoplayBlocked] - Callback when autoplay is blocked
 */
export function useVideoSync({ player, isHost, onLocalControl, controlEvent, onAutoplayBlocked }) {
  const suppressNextRef = useRef(false);
  const suppressTimerRef = useRef(null);
  const isApplyingRemoteRef = useRef(false);

  /**
   * Suppress echo for a short duration
   */
  const suppressEcho = () => {
    suppressNextRef.current = true;

    if (suppressTimerRef.current) {
      clearTimeout(suppressTimerRef.current);
    }

    suppressTimerRef.current = setTimeout(() => {
      suppressNextRef.current = false;
      suppressTimerRef.current = null;
    }, WATCH_CONFIG.SUPPRESS_ECHO_DURATION);
  };

  /**
   * Apply remote control event to player
   * @param {WsEvent} event
   */
  const applyRemoteControl = (event) => {
    if (!player || !event) return;

    // Skip if we just sent this control (echo suppression)
    if (suppressNextRef.current) {
      DEBUG_ENABLED && console.log('[useVideoSync] Suppressing echo for', event.type);
      return;
    }

    isApplyingRemoteRef.current = true;

    try {
      const { type, payload } = event;
      const { positionMs, playbackRate = 1.0, atHostTimeMs } = payload || {};

      // Calculate network delay compensation
      const delta = atHostTimeMs ? Date.now() - atHostTimeMs : 0;

      DEBUG_ENABLED && console.log('[useVideoSync] Applying remote control', {
        type,
        positionMs,
        delta,
      });

      switch (type) {
        case WS_TYPES.PLAY: {
          // Compensate for network delay
          const adjustedPosition = positionMs + delta * playbackRate;
          const currentTime = adjustedPosition / 1000;

          DEBUG_ENABLED && console.log('[useVideoSync] PLAY at', currentTime, 'seconds');

          player.currentTime(currentTime);
          player.playbackRate(playbackRate);
          player.play().catch((err) => {
            console.error('[useVideoSync] Play failed', err);
          });
          break;
        }

        case WS_TYPES.PAUSE: {
          const currentTime = positionMs / 1000;

          DEBUG_ENABLED && console.log('[useVideoSync] PAUSE at', currentTime, 'seconds');

          player.currentTime(currentTime);
          player.pause();
          break;
        }

        case WS_TYPES.SEEK: {
          const currentTime = positionMs / 1000;
          const wasPlaying = !player.paused();

          DEBUG_ENABLED && console.log('[useVideoSync] SEEK to', currentTime, 'seconds', { wasPlaying });

          player.currentTime(currentTime);

          // If video was playing, keep it playing after seek
          if (wasPlaying) {
            setTimeout(() => {
              if (!player.paused()) return; // Already playing
              player.play().catch((err) => {
                console.error('[useVideoSync] Resume play after seek failed', err);
              });
            }, 50);
          }
          break;
        }

        case WS_TYPES.SYNC_STATE: {
          // Full state sync (when joining or reconnecting)
          const { playing, serverTimeMs } = payload;
          const delta = serverTimeMs ? Date.now() - serverTimeMs : 0;

          // Compensate position if playing
          const adjustedPosition = playing
            ? positionMs + delta * playbackRate
            : positionMs;
          const currentTime = adjustedPosition / 1000;

          DEBUG_ENABLED && console.log('[useVideoSync] SYNC_STATE', {
            playing,
            currentTime,
            delta,
            positionMs,
          });

          // Set position first
          player.currentTime(currentTime);
          player.playbackRate(playbackRate);

          // Then handle play/pause
          if (playing) {
            DEBUG_ENABLED && console.log('[useVideoSync] Auto-playing video from SYNC_STATE');
            
            // Try to play with error handling for browser autoplay policy
            player.play().catch((err) => {
              console.error('[useVideoSync] Autoplay failed (browser policy)', err);
              
              // Fallback: mute and try again
              const wasMuted = player.muted();
              if (!wasMuted) {
                player.muted(true);
                player.play()
                  .then(() => {
                    DEBUG_ENABLED && console.log('[useVideoSync] Autoplay succeeded with muted');
                    onAutoplayBlocked?.(); // Notify parent component
                    // Unmute after 1 second
                    setTimeout(() => {
                      player.muted(false);
                      onAutoplayBlocked?.(false); // Hide warning
                    }, 3000);
                  })
                  .catch((err2) => {
                    console.error('[useVideoSync] Muted autoplay also failed', err2);
                  });
              }
            });
          } else {
            player.pause();
          }
          break;
        }

        default:
          console.warn('[useVideoSync] Unknown control type', type);
      }
    } finally {
      // Reset flag after a brief delay
      setTimeout(() => {
        isApplyingRemoteRef.current = false;
      }, 100);
    }
  };

  /**
   * Handle player events
   */
  useEffect(() => {
    if (!player) return;

    const handlePlay = () => {
      // Skip if we're applying remote control
      if (isApplyingRemoteRef.current) {
        DEBUG_ENABLED && console.log('[useVideoSync] Skipping play - applying remote');
        return;
      }

      DEBUG_ENABLED && console.log('[useVideoSync] Player play event');

      if (!isHost) {
        // Non-host can play locally, but request sync from host
        DEBUG_ENABLED && console.log('[useVideoSync] Non-host play - requesting sync from host');
        
        // Request current state from host (backend should send SYNC_STATE)
        // For now, just allow local play - will sync on next remote event
        return;
      }

      // Host sends PLAY control
      const positionMs = Math.round(player.currentTime() * 1000);
      suppressEcho();
      onLocalControl?.(WS_TYPES.PLAY, positionMs);
    };

    const handlePause = () => {
      // Skip if we're applying remote control
      if (isApplyingRemoteRef.current) {
        DEBUG_ENABLED && console.log('[useVideoSync] Skipping pause - applying remote');
        return;
      }

      DEBUG_ENABLED && console.log('[useVideoSync] Player pause event');

      if (!isHost) {
        // Non-host can pause locally (catch up later)
        DEBUG_ENABLED && console.log('[useVideoSync] Non-host pause - allowed locally');
        return;
      }

      // Host sends PAUSE control
      const positionMs = Math.round(player.currentTime() * 1000);
      suppressEcho();
      onLocalControl?.(WS_TYPES.PAUSE, positionMs);
    };

    const handleSeeked = () => {
      // Skip if we're applying remote control
      if (isApplyingRemoteRef.current) {
        DEBUG_ENABLED && console.log('[useVideoSync] Skipping seeked - applying remote');
        return;
      }

      DEBUG_ENABLED && console.log('[useVideoSync] Player seeked event');

      if (!isHost) {
        DEBUG_ENABLED && console.log('[useVideoSync] Non-host seeked - not sending control');
        return;
      }

      // Host sends SEEK control
      const positionMs = Math.round(player.currentTime() * 1000);
      suppressEcho();
      onLocalControl?.(WS_TYPES.SEEK, positionMs);
    };

    // Attach listeners
    player.on('play', handlePlay);
    player.on('pause', handlePause);
    player.on('seeked', handleSeeked);

    // Cleanup
    return () => {
      player.off('play', handlePlay);
      player.off('pause', handlePause);
      player.off('seeked', handleSeeked);

      if (suppressTimerRef.current) {
        clearTimeout(suppressTimerRef.current);
      }
    };
  }, [player, isHost, onLocalControl]);

  /**
   * Apply control event when it changes
   */
  useEffect(() => {
    if (controlEvent) {
      applyRemoteControl(controlEvent);
    }
  }, [controlEvent, player]);

  return {
    suppressEcho,
  };
}

export default useVideoSync;
