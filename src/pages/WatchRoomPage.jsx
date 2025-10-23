/**
 * WatchRoomPage - Main page for Watch Together feature
 * @author Senior FE Developer
 * @version 1.0
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { WatchPlayer } from '../components/WatchPlayer';
import { WatchChat } from '../components/WatchChat';
import { MemberList } from '../components/MemberList';
import { SyncDebug } from '../components/SyncDebug';
import { useWatchRoom } from '../hooks/useWatchRoom';
import { WatchRoomProvider } from '../context/WatchRoomContext';
import { useAuth } from '../context/AuthContext';
import '../css/WatchRoomPage.css';

export const WatchRoomPage = () => {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const { MyUser } = useAuth();

  // Get user info from AuthContext (if logged in) or query params (if not logged in)
  const loggedInUser = MyUser?.my_user;
  const userId = loggedInUser?.userId || searchParams.get('userId') || 'user_' + Date.now();
  const userName = loggedInUser?.userName || loggedInUser?.fullname || loggedInUser?.username || searchParams.get('name') || 'User';
  const avatarUrl = loggedInUser?.avatarUrl || loggedInUser?.avatar || searchParams.get('avatar') || undefined;
  const inviteCode = searchParams.get('invite') || undefined;
  const isHostFromUrl = searchParams.get('host') === '1'; // Force host mode from URL

  const [videoUrl, setVideoUrl] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeTab, setActiveTab] = useState('chat');
  const controlEventRef = useRef(null);

  /**
   * Handle control events from WS to forward to player
   */
  const handleControlEvent = useCallback((event) => {
    console.log('[WatchRoomPage] Control event received', event);
    controlEventRef.current = event;
  }, []);

  /**
   * useWatchRoom hook
   */
  const {
    state,
    connect,
    disconnect,
    sendChat,
    play,
    pause,
    seek,
    loadMoreMessages,
    isConnected,
    isReconnecting,
  } = useWatchRoom({
    roomId,
    userId,
    userName,
    avatarUrl,
    inviteCode,
    forceHost: isHostFromUrl,
    onControlEvent: handleControlEvent,
  });

  /**
   * Handle local control from player
   */
  const handleLocalControl = useCallback(
    (type, positionMs) => {
      console.log('[WatchRoomPage] Local control', type, positionMs);

      switch (type) {
        case 'PLAY':
          play(positionMs);
          break;
        case 'PAUSE':
          pause(positionMs);
          break;
        case 'SEEK':
          seek(positionMs);
          break;
        default:
          console.warn('[WatchRoomPage] Unknown control type', type);
      }
    },
    [play, pause, seek]
  );

  /**
   * Fetch room info and video URL
   */
  useEffect(() => {
    // TODO: Fetch room info from API
    // const fetchRoomInfo = async () => {
    //   const roomInfo = await watchRoomApi.getRoomInfo(roomId);
    //   setVideoUrl(roomInfo.videoUrl);
    // };
    // fetchRoomInfo();

    // Mock video URL (HLS stream) - override from query param for testing
    setVideoUrl(
      searchParams.get('video') ||
        'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
    );
  }, [roomId, searchParams]);

  /**
   * Connect to room on mount
   */
  useEffect(() => {
    if (!roomId) return;

    connect();

    return () => {
      disconnect();
    };
  }, [roomId, connect, disconnect]);

  /**
   * Copy invite link
   */
  const handleCopyInviteLink = () => {
    const inviteLink = `${window.location.origin}/watch/${roomId}${
      inviteCode ? `?invite=${inviteCode}` : ''
    }`;

    navigator.clipboard.writeText(inviteLink);
    alert('✓ Đã sao chép link mời vào clipboard!');
  };

  /**
   * Reconnecting banner
   */
  const renderReconnectingBanner = () => {
    if (!isReconnecting) return null;

    return (
      <div className="watch-room-reconnecting-banner">
        ⚠️ Đang kết nối lại...
      </div>
    );
  };

  /**
   * Loading state
   */
  if (!videoUrl) {
    return (
      <div className="watch-room-loading">
        <div className="watch-room-loading-icon">🎬</div>
        <div className="watch-room-loading-text">Đang tải phòng xem...</div>
      </div>
    );
  }

  return (
    <WatchRoomProvider
      value={{
        state,
        connect,
        disconnect,
        sendChat,
        play,
        pause,
        seek,
        loadMoreMessages,
        isConnected,
        isReconnecting,
      }}
    >
      <div className="watch-room-page">
        {/* Reconnecting banner */}
        {renderReconnectingBanner()}

        {/* Header */}
        <div className="watch-room-header">
          <div className="watch-room-header-left">
            <h1 className="watch-room-title">🎬 Watch Together</h1>
            <span className="watch-room-subtitle">
              {isConnected ? '🟢 Đã kết nối' : '🔴 Mất kết nối'}
            </span>
          </div>

          <div className="watch-room-header-right">
            <button
              onClick={handleCopyInviteLink}
              className="watch-room-btn"
              title="Sao chép link mời bạn bè"
            >
              📋 Copy Link Mời
            </button>

            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="watch-room-btn watch-room-btn-secondary"
              title={showSidebar ? 'Ẩn sidebar' : 'Hiện sidebar'}
            >
              {showSidebar ? '→ Ẩn' : '← Hiện'} Sidebar
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="watch-room-main">
          {/* Video Player */}
          <div className="watch-room-player-container">
            <WatchPlayer
              videoUrl={videoUrl}
              isHost={state.isHost}
              onLocalControl={handleLocalControl}
              controlEvent={controlEventRef.current}
              autoplay={false}
            />
          </div>

          {/* Sidebar */}
          {showSidebar && (
            <div className="watch-room-sidebar">
              {/* Tabs */}
              <div className="watch-room-tabs">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`watch-room-tab ${
                    activeTab === 'chat' ? 'watch-room-tab-active' : ''
                  }`}
                >
                  💬 Chat
                </button>
                <button
                  onClick={() => setActiveTab('members')}
                  className={`watch-room-tab ${
                    activeTab === 'members' ? 'watch-room-tab-active' : ''
                  }`}
                >
                  👥 Thành viên ({state.members.length})
                </button>
              </div>

              {/* Tab Content - Render both to prevent layout shift */}
              <div className="watch-room-tab-content">
                <div style={{ display: activeTab === 'chat' ? 'block' : 'none', height: '100%' }}>
                  <WatchChat
                    messages={state.messages}
                    onSendMessage={sendChat}
                    onLoadMore={loadMoreMessages}
                    hasMore={false} // TODO: implement pagination
                    currentUserId={userId}
                  />
                </div>
                <div style={{ display: activeTab === 'members' ? 'block' : 'none', height: '100%' }}>
                  <MemberList members={state.members} currentUserId={userId} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Debug Panel */}
        <SyncDebug
          latencyMs={state.latencyMs}
          syncState={state.sync}
          isConnected={isConnected}
          isReconnecting={isReconnecting}
        />
      </div>
    </WatchRoomProvider>
  );
};

export default WatchRoomPage;
