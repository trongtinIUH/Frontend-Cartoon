/**
 * WatchRoomPage - Main page for Watch Together feature
 * @author Senior FE Developer
 * @version 2.0 - Redesigned UI
 */

import React, { useEffect, useLayoutEffect, useState, useCallback, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { WatchPlayer } from '../components/WatchPlayer';
import { WatchChat } from '../components/WatchChat';
import { MemberList } from '../components/MemberList';
import { SyncDebug } from '../components/SyncDebug';
import { useWatchRoom } from '../hooks/useWatchRoom';
import { WatchRoomProvider } from '../context/WatchRoomContext';
import { useAuth } from '../context/AuthContext';
import WatchRoomService from '../services/WatchRoomService';
import '../css/WatchRoomPage.css';

export const WatchRoomPage = () => {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { MyUser } = useAuth();

  // Get user info from AuthContext (if logged in) or query params (if not logged in)
  const loggedInUser = MyUser?.my_user;
  const userId = loggedInUser?.userId || searchParams.get('userId') || 'user_' + Date.now();
  const userName = loggedInUser?.userName || loggedInUser?.fullname || loggedInUser?.username || searchParams.get('name') || 'User';
  const avatarUrl = loggedInUser?.avatarUrl || loggedInUser?.avatar || searchParams.get('avatar') || undefined;
  const inviteCode = searchParams.get('invite') || undefined;
  const isHostFromUrl = searchParams.get('host') === '1'; // Force host mode from URL

  const [videoUrl, setVideoUrl] = useState('');
  const [initialVideoState, setInitialVideoState] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeTab, setActiveTab] = useState('chat');
  const [unreadCount, setUnreadCount] = useState(0);
  const controlEventRef = useRef(null);
  const prevMessagesLengthRef = useRef(0);

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
   * Fetch room info, video URL, and initial video state
   */
  useEffect(() => {
    const fetchRoomInfo = async () => {
      try {
        // Try to get video URL from query params first (for creator)
        const videoFromParams = searchParams.get('video');
        
        if (videoFromParams) {
          console.log('[WatchRoomPage] Using video URL from params:', videoFromParams);
          setVideoUrl(videoFromParams);
          // Creator still fetches video state from API (for persistence after refresh)
        }

        // Fetch room info from API (for video URL + video state)
        console.log('[WatchRoomPage] Fetching room info from API...');
        const roomInfo = await WatchRoomService.getWatchRoomById(roomId);
        
        if (roomInfo) {
          // Set video URL if not from params
          if (!videoFromParams && roomInfo.videoUrl) {
            console.log('[WatchRoomPage] Fetched video URL from API:', roomInfo.videoUrl);
            setVideoUrl(roomInfo.videoUrl);
          }
          
          // Set initial video state (for persistence)
          if (roomInfo.videoState) {
            console.log('[WatchRoomPage] Fetched video state from API:', roomInfo.videoState);
            setInitialVideoState(roomInfo.videoState);
          }
        } else {
          console.warn('[WatchRoomPage] No room info, using demo');
          if (!videoFromParams) {
            setVideoUrl('https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8');
          }
        }
      } catch (error) {
        console.error('[WatchRoomPage] Error fetching room info:', error);
        if (!searchParams.get('video')) {
          setVideoUrl('https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8');
        }
      }
    };

    fetchRoomInfo();
  }, [roomId, searchParams]);

  /**
   * Apply initial video state (after fetching from API)
   */
  useEffect(() => {
    if (!initialVideoState || !isConnected) return;

    console.log('[WatchRoomPage] Applying initial video state:', initialVideoState);

    // Create SYNC_STATE event from initial state
    const syncEvent = {
      type: 'SYNC_STATE',
      payload: initialVideoState,
      createdAt: new Date().toISOString(),
    };

    // Apply to player via controlEvent
    handleControlEvent(syncEvent);

    // Only apply once
    setInitialVideoState(null);
  }, [initialVideoState, isConnected, handleControlEvent]);

  /**
   * Prevent scroll restoration and lock scroll to top - runs before paint
   */
  useLayoutEffect(() => {
    // Disable browser scroll restoration
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    // Scroll to top immediately
    window.scrollTo(0, 0);
  }, []);

  /**
   * Track new messages and update unread count
   */
  useEffect(() => {
    const currentLength = state.messages.length;
    const prevLength = prevMessagesLengthRef.current;

    // If messages increased and (sidebar hidden OR chat tab not active)
    if (currentLength > prevLength) {
      const newMessagesCount = currentLength - prevLength;
      const shouldIncreaseUnread = !showSidebar || activeTab !== 'chat';

      if (shouldIncreaseUnread) {
        setUnreadCount(prev => prev + newMessagesCount);
      }
    }

    // Update ref for next check
    prevMessagesLengthRef.current = currentLength;
  }, [state.messages.length, showSidebar, activeTab]);

  /**
   * Reset unread count when user opens chat tab
   */
  useEffect(() => {
    if (showSidebar && activeTab === 'chat') {
      setUnreadCount(0);
    }
  }, [showSidebar, activeTab]);

  /**
   * Connect to room on mount
   */
  useEffect(() => {
    if (!roomId) return;

    connect();

    // Handle page close/refresh - send LEAVE before unload
    const handleBeforeUnload = () => {
      console.log('[WatchRoomPage] Page closing - sending LEAVE');
      disconnect();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      disconnect();
    };
  }, [roomId, connect, disconnect]);

  /**
   * Copy invite link
   */
  const handleCopyInviteLink = () => {
    // Build invite link with video URL
    const params = new URLSearchParams();
    if (videoUrl) {
      params.append('video', videoUrl);
    }
    if (inviteCode) {
      params.append('invite', inviteCode);
    }
    
    const inviteLink = `${window.location.origin}/watch-together/${roomId}?${params.toString()}`;

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
        <div className="loading-spinner"></div>
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
        {isReconnecting && (
          <div className="watch-room-reconnecting-banner">
            <div className="reconnecting-spinner"></div>
            <span>Đang kết nối lại...</span>
          </div>
        )}

        {/* Header */}
        <div className="watch-room-header">
          <div className="watch-room-header-left">
            <button 
              onClick={() => navigate(-1)}
              className="btn-back"
              title="Quay lại"
            >
              <i className="fa-solid fa-arrow-left"></i>
            </button>
            <div className="header-info">
              <h1 className="watch-room-title">Watch Together</h1>
              <div className="connection-status">
                <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
                <span className="status-text">
                  {isConnected ? 'Đã kết nối' : 'Mất kết nối'}
                </span>
              </div>
            </div>
          </div>

          <div className="watch-room-header-right">
            <button
              onClick={handleCopyInviteLink}
              className="btn-header btn-invite"
              title="Sao chép link mời bạn bè"
            >
              <i className="fa-solid fa-link"></i>
              <span className="btn-text">Copy Link</span>
            </button>

            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="btn-header btn-toggle-sidebar"
              title={showSidebar ? 'Ẩn sidebar' : 'Hiện sidebar'}
            >
              <i className={`fa-solid ${showSidebar ? 'fa-chevron-right' : 'fa-chevron-left'}`}></i>
              <span className="btn-text">{showSidebar ? 'Ẩn' : 'Hiện'}</span>
              {unreadCount > 0 && !showSidebar && (
                <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
              )}
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
                  {unreadCount > 0 && activeTab !== 'chat' && (
                    <span className="tab-notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                  )}
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
