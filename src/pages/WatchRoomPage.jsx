/**
 * WatchRoomPage - Main page for Watch Together feature
 * @author Senior FE Developer
 * @version 2.0 - Redesigned UI
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { WatchPlayer } from '../components/WatchPlayer';
import { WatchChat } from '../components/WatchChat';
import { MemberList } from '../components/MemberList';
import { SyncDebug } from '../components/SyncDebug';
import { useWatchRoom } from '../hooks/useWatchRoom';
import { WatchRoomProvider } from '../context/WatchRoomContext';
import { useAuth } from '../context/AuthContext';
import WatchRoomService from '../services/WatchRoomService';
import InviteCodeModal from '../components/InviteCodeModal';
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
  const controlEventRef = useRef(null);
  
  // States for invite code verification
  const [isVerifyingAccess, setIsVerifyingAccess] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [roomInfo, setRoomInfo] = useState(null);

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
   * Also verify access for private rooms
   */
  useEffect(() => {
    const fetchRoomInfo = async () => {
      try {
        setIsVerifyingAccess(true);
        
        // Fetch room info from API
        console.log('[WatchRoomPage] Fetching room info from API...');
        const roomData = await WatchRoomService.getWatchRoomById(roomId);
        
        if (!roomData) {
          console.warn('[WatchRoomPage] No room info found');
          setAccessDenied(true);
          setIsVerifyingAccess(false);
          return;
        }

        setRoomInfo(roomData);

        // Check if room is private and requires invite code
        if (roomData.isPrivate) {
          console.log('[WatchRoomPage] Room is private, checking invite code...');
          
          // If no invite code in URL, show modal
          if (!inviteCode) {
            console.log('[WatchRoomPage] No invite code provided, showing modal');
            setShowInviteModal(true);
            setIsVerifyingAccess(false);
            return;
          }

          // Verify invite code
          try {
            const verifyResponse = await WatchRoomService.verifyInviteCode(roomId, inviteCode);
            
            if (!verifyResponse || !verifyResponse.valid) {
              console.log('[WatchRoomPage] Invalid invite code');
              setShowInviteModal(true);
              setIsVerifyingAccess(false);
              return;
            }
            
            console.log('[WatchRoomPage] Invite code verified successfully');
          } catch (error) {
            console.error('[WatchRoomPage] Error verifying invite code:', error);
            setShowInviteModal(true);
            setIsVerifyingAccess(false);
            return;
          }
        }

        // Access granted, proceed with loading video
        const videoFromParams = searchParams.get('video');
        
        if (videoFromParams) {
          console.log('[WatchRoomPage] Using video URL from params:', videoFromParams);
          setVideoUrl(videoFromParams);
        } else if (roomData.videoUrl) {
          console.log('[WatchRoomPage] Fetched video URL from API:', roomData.videoUrl);
          setVideoUrl(roomData.videoUrl);
        } else {
          console.warn('[WatchRoomPage] No video URL, using demo');
          setVideoUrl('https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8');
        }
        
        // Set initial video state (for persistence)
        if (roomData.videoState) {
          console.log('[WatchRoomPage] Fetched video state from API:', roomData.videoState);
          setInitialVideoState(roomData.videoState);
        }

        setIsVerifyingAccess(false);
      } catch (error) {
        console.error('[WatchRoomPage] Error fetching room info:', error);
        setAccessDenied(true);
        setIsVerifyingAccess(false);
        
        // Fallback for demo
        if (!searchParams.get('video')) {
          setVideoUrl('https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8');
        }
      }
    };

    fetchRoomInfo();
  }, [roomId, searchParams, inviteCode]);

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
   * Scroll to top on mount - MULTIPLE TIMES to ensure it works
   */
  useEffect(() => {
    // Scroll immediately
    window.scrollTo(0, 0);
    
    // Scroll after short delay
    const timer1 = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 50);
    
    // Scroll after component fully rendered
    const timer2 = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 150);
    
    // Final scroll to be sure
    const timer3 = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 300);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  /**
   * Scroll to top when video URL is loaded
   */
  useEffect(() => {
    if (videoUrl) {
      window.scrollTo(0, 0);
      
      // Also scroll after video player renders
      const timer = setTimeout(() => {
        window.scrollTo(0, 0);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [videoUrl]);

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
   * Copy invite code
   */
  const handleCopyInviteCode = () => {
    // Get invite code from roomInfo or URL
    const code = roomInfo?.inviteCode || inviteCode;
    
    if (!code) {
      alert('❌ Phòng này không có mã mời');
      return;
    }

    // Copy invite code to clipboard
    navigator.clipboard.writeText(code)
      .then(() => {
        alert(`✓ Đã sao chép mã mời: ${code}`);
      })
      .catch((err) => {
        console.error('Failed to copy:', err);
        // Fallback: show alert with code
        alert(`Mã mời: ${code}\n\n(Vui lòng copy thủ công)`);
      });
  };

  /**
   * Handle invite code submit from modal
   */
  const handleInviteCodeSubmit = async (code) => {
    try {
      // Verify invite code
      const verifyResponse = await WatchRoomService.verifyInviteCode(roomId, code);
      
      if (!verifyResponse || !verifyResponse.valid) {
        throw new Error('Mã mời không đúng');
      }

      // Valid code, update URL and reload
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('invite', code);
      window.location.href = newUrl.toString();
    } catch (error) {
      console.error('[WatchRoomPage] Error verifying invite code:', error);
      throw error;
    }
  };

  /**
   * Handle modal cancel - go back
   */
  const handleModalCancel = () => {
    setShowInviteModal(false);
    navigate(-1);
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
  if (isVerifyingAccess) {
    return (
      <div className="watch-room-loading">
        <div className="loading-spinner"></div>
        <div className="watch-room-loading-text">Đang xác thực quyền truy cập...</div>
      </div>
    );
  }

  /**
   * Access denied state
   */
  if (accessDenied && !showInviteModal) {
    return (
      <div className="watch-room-loading">
        <div className="watch-room-error">
          <i className="fas fa-lock" style={{ fontSize: '3rem', marginBottom: '1rem' }}></i>
          <h2>Không thể truy cập phòng</h2>
          <p>Phòng này không tồn tại hoặc bạn không có quyền truy cập.</p>
          <button onClick={() => navigate(-1)} className="btn-back-error">
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  /**
   * Show invite modal if needed
   */
  if (showInviteModal) {
    return (
      <div className="watch-room-page">
        <InviteCodeModal
          isOpen={showInviteModal}
          onSubmit={handleInviteCodeSubmit}
          onCancel={handleModalCancel}
          roomName={roomInfo?.roomName || 'Phòng xem chung'}
        />
      </div>
    );
  }

  /**
   * Loading video state
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
            {/* Show copy invite code button only for private rooms */}
            {roomInfo?.isPrivate && (
              <button
                onClick={handleCopyInviteCode}
                className="btn-header btn-invite"
                title="Sao chép mã mời"
              >
                <i className="fa-solid fa-key"></i>
                <span className="btn-text">Copy Mã</span>
              </button>
            )}

            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="btn-header btn-toggle-sidebar"
              title={showSidebar ? 'Ẩn sidebar' : 'Hiện sidebar'}
            >
              <i className={`fa-solid ${showSidebar ? 'fa-chevron-right' : 'fa-chevron-left'}`}></i>
              <span className="btn-text">{showSidebar ? 'Ẩn' : 'Hiện'}</span>
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
