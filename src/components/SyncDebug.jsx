/**
 * SyncDebug - Debug panel for Watch Together sync
 * @author Senior FE Developer
 * @version 1.0
 */

import React, { useState } from 'react';
import dayjs from 'dayjs';
import '../css/SyncDebug.css';

/**
 * @typedef {import('../types/watch').SyncState} SyncState
 */

export function SyncDebug({
  latencyMs = 0,
  syncState = null,
  isConnected = false,
  isReconnecting = false,
}) {
  const [isOpen, setIsOpen] = useState(false);

  /**
   * Format time from ms
   */
  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  /**
   * Get latency color
   */
  const getLatencyColor = (ms) => {
    if (ms < 50) return '#22c55e'; // green
    if (ms < 150) return '#eab308'; // yellow
    return '#ef4444'; // red
  };

  /**
   * Render debug info
   */
  const renderDebugInfo = () => {
    if (!isOpen) return null;

    const currentPosition = syncState
      ? syncState.positionMs +
        (syncState.playing
          ? (Date.now() - syncState.serverTimeMs) * syncState.playbackRate
          : 0)
      : 0;

    return (
      <div className="sync-debug-panel">
        <div className="sync-debug-header">
          <h4 className="sync-debug-title">🔧 Debug Info</h4>
          <button
            className="sync-debug-close"
            onClick={() => setIsOpen(false)}
          >
            ✕
          </button>
        </div>

        <div className="sync-debug-content">
          {/* Connection status */}
          <div className="sync-debug-row">
            <span className="sync-debug-label">Connection:</span>
            <span
              className="sync-debug-value"
              style={{
                color: isConnected ? '#22c55e' : '#ef4444',
              }}
            >
              {isConnected ? '✓ Connected' : '✕ Disconnected'}
              {isReconnecting && ' (Reconnecting...)'}
            </span>
          </div>

          {/* Latency */}
          <div className="sync-debug-row">
            <span className="sync-debug-label">Latency:</span>
            <span
              className="sync-debug-value"
              style={{ color: getLatencyColor(latencyMs) }}
            >
              {latencyMs}ms
            </span>
          </div>

          {/* Sync state */}
          {syncState && (
            <>
              <div className="sync-debug-divider"></div>

              <div className="sync-debug-row">
                <span className="sync-debug-label">Playing:</span>
                <span className="sync-debug-value">
                  {syncState.playing ? '▶️ Yes' : '⏸️ No'}
                </span>
              </div>

              <div className="sync-debug-row">
                <span className="sync-debug-label">Position:</span>
                <span className="sync-debug-value">
                  {formatTime(currentPosition)}
                </span>
              </div>

              <div className="sync-debug-row">
                <span className="sync-debug-label">Playback Rate:</span>
                <span className="sync-debug-value">
                  {syncState.playbackRate}x
                </span>
              </div>

              <div className="sync-debug-row">
                <span className="sync-debug-label">Server Time:</span>
                <span className="sync-debug-value sync-debug-time">
                  {dayjs(syncState.serverTimeMs).format('HH:mm:ss')}
                </span>
              </div>

              <div className="sync-debug-row">
                <span className="sync-debug-label">Clock Drift:</span>
                <span className="sync-debug-value">
                  {Date.now() - syncState.serverTimeMs}ms
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="sync-debug">
      {/* Toggle button */}
      {!isOpen && (
        <button
          className="sync-debug-toggle"
          onClick={() => setIsOpen(true)}
          title="Show debug info"
        >
          <span className="sync-debug-toggle-icon">🔧</span>
          <span className="sync-debug-toggle-latency">{latencyMs}ms</span>
        </button>
      )}

      {/* Debug panel */}
      {renderDebugInfo()}
    </div>
  );
}

export default SyncDebug;
