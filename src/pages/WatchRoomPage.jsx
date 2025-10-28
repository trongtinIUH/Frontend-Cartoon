import React, { useEffect, useLayoutEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { WatchPlayer } from '../components/WatchPlayer';
import { WatchChat } from '../components/WatchChat';
import { MemberList } from '../components/MemberList';
import { SyncDebug } from '../components/SyncDebug';
import { DeleteRoomButton } from '../components/DeleteRoomButton';
import { useWatchRoom } from '../hooks/useWatchRoom';
import { WatchRoomProvider } from '../context/WatchRoomContext';
import { useAuth } from '../context/AuthContext';
import WatchRoomService from '../services/WatchRoomService';
import InviteCodeModal from '../components/InviteCodeModal';
import '../css/WatchRoomPage.css';
import '../css/ModalOverrides.css'; // Ensure modals appear above video

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
  const [roomInfo, setRoomInfo] = useState(null); // Store room info for permission check
  const [showRoomDeletedDialog, setShowRoomDeletedDialog] = useState(false);
  const [roomDeletedReason, setRoomDeletedReason] = useState('');
  const controlEventRef = useRef(null);
  const prevMessagesLengthRef = useRef(0);
  const playerRef = useRef(null); // Reference to player for stopping on delete
  const disconnectRef = useRef(null); // Store disconnect function
  
  // States for invite code verification
  const [isVerifyingAccess, setIsVerifyingAccess] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  /**
   * Handle control events from WS to forward to player
   */
  const handleControlEvent = useCallback((event) => {
    controlEventRef.current = event;
  }, []);

  /**
   * Handle room deleted/expired from WebSocket
   */
  const handleRoomDeleted = useCallback(({ reason, reasonText }) => {
    console.log('[WatchRoomPage] Room deleted/expired:', reason);
    console.log('[WatchRoomPage] Backend cascade deleted: messages + members');
    
    // Show toast notification
    toast.error(`⚠️ Phòng ${reasonText}. Đang chuyển về danh sách...`, {
      position: 'top-center',
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
    
    // Show blocking dialog
    setRoomDeletedReason(reasonText);
    setShowRoomDeletedDialog(true);

    // Try to pause/stop player
    if (playerRef.current?.pause) {
      try {
        playerRef.current.pause();
      } catch (err) {
        console.warn('[WatchRoomPage] Failed to pause player:', err);
      }
    }

    // Disconnect WebSocket using ref
    // This will automatically clear members/messages state in useWatchRoom
    if (disconnectRef.current) {
      disconnectRef.current();
    }

    // Redirect after 3 seconds
    setTimeout(() => {
      navigate('/rooms');
    }, 3000);
  }, [navigate]);

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
    onRoomDeleted: handleRoomDeleted,
  });

  // Store disconnect function in ref for handleRoomDeleted
  useEffect(() => {
    disconnectRef.current = disconnect;
  }, [disconnect]);

  /**
   * Handle local control from player
   */
  const handleLocalControl = useCallback(
    (type, positionMs) => {
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
    let isMounted = true; // Prevent state updates after unmount
    
    const fetchRoomInfo = async () => {
      try {
        if (!isMounted) return; // Early exit if unmounted
        
        setIsVerifyingAccess(true);
        const fetchStartTime = Date.now();
        
        // Fetch room info from API
        console.log('[WatchRoomPage] 🔄 Fetching room info from API...');
        console.log('[WatchRoomPage] Current URL params:', {
          roomId,
          inviteCode,
          isHostFromUrl,
          searchParams: Object.fromEntries(searchParams.entries())
        });
        console.log('[WatchRoomPage] Current user info:', {
          userId,
          loggedInUserId: loggedInUser?.userId,
          urlUserId: searchParams.get('userId')
        });
        
        const roomData = await WatchRoomService.getWatchRoomById(roomId);
        
        if (!isMounted) return; // Exit if unmounted during fetch
        
        const fetchDuration = Date.now() - fetchStartTime;
        console.log(`[WatchRoomPage] ⏱️ Room data fetched in ${fetchDuration}ms`);
        
        if (!roomData) {
          console.warn('[WatchRoomPage] No room info found');
          setAccessDenied(true);
          setIsVerifyingAccess(false);
          return;
        }

        console.log('[WatchRoomPage] Room data received:', roomData);
        setRoomInfo(roomData);

        // SIMPLIFIED ACCESS CHECK:
        // 1. If URL has ?host=1 → Creator mode, always allow
        // 2. If room is public → Always allow
        // 3. If room is private → Need invite code (unless creator)
        
        const isCreatorByUrl = isHostFromUrl; // ?host=1 in URL
        const isPublicRoom = !roomData.isPrivate;
        
        console.log('[WatchRoomPage] Access check:', {
          isCreatorByUrl,
          isPublicRoom,
          roomIsPrivate: roomData.isPrivate,
          hasInviteCodeInUrl: !!inviteCode
        });

        // Allow access if creator or public room
        if (isCreatorByUrl || isPublicRoom) {
          console.log('[WatchRoomPage] ✅ Access granted - Creator mode or public room');
          // Continue to load video below
        } else {
          // Private room and not creator - need invite code
          console.log('[WatchRoomPage] 🔒 Private room - checking invite code...');
          // Private room and not creator - need invite code
          console.log('[WatchRoomPage] 🔒 Private room - checking invite code...');
          
          // If no invite code in URL, show modal
          if (!inviteCode) {
            console.log('[WatchRoomPage] ❌ No invite code provided, showing modal');
            setShowInviteModal(true);
            setIsVerifyingAccess(false);
            return;
          }

          // Verify invite code
          try {
            console.log('[WatchRoomPage] Verifying invite code...');
            const verifyResponse = await WatchRoomService.verifyInviteCode(roomId, inviteCode);
            
            if (!isMounted) return; // Exit if unmounted during verify
            
            if (!verifyResponse || !verifyResponse.valid) {
              console.log('[WatchRoomPage] ❌ Invalid invite code');
              setShowInviteModal(true);
              setIsVerifyingAccess(false);
              return;
            }
            
            console.log('[WatchRoomPage] ✅ Invite code verified successfully');
          } catch (error) {
            if (!isMounted) return; // Exit if unmounted during error
            
            console.error('[WatchRoomPage] ❌ Error verifying invite code:', error);
            setShowInviteModal(true);
            setIsVerifyingAccess(false);
            return;
          }
        }

        // Access granted, proceed with loading video
        const videoFromParams = searchParams.get('video');
        
        if (videoFromParams) {
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

        // ✅ Check if room is DELETED or EXPIRED
        if (roomData.status === 'DELETED' || roomData.status === 'EXPIRED') {
          const reason = roomData.status === 'EXPIRED' ? 'hết hạn' : 'đã bị xóa';
          alert(`⚠️ Phòng này ${reason}. Bạn sẽ được chuyển về danh sách phòng.`);
          setTimeout(() => {
            navigate('/rooms');
          }, 2000);
          return;
        }

        setIsVerifyingAccess(false);
      } catch (error) {
        console.error('[WatchRoomPage] Error fetching room info:', error);
        
        // ✅ Check if error is ROOM_GONE (404)
        if (error.response?.status === 404 || error.message?.includes('ROOM_GONE')) {
          alert('⚠️ Phòng không tồn tại hoặc đã bị xóa. Bạn sẽ được chuyển về danh sách phòng.');
          setTimeout(() => {
            navigate('/rooms');
          }, 2000);
          return;
        }
        
        if (!isMounted) return; // Exit if unmounted during error
        
        setAccessDenied(true);
        setIsVerifyingAccess(false);
        
        // Fallback for demo
        if (!searchParams.get('video')) {
          setVideoUrl('https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8');
        }
      }
    };

    fetchRoomInfo();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };

  }, [roomId, searchParams, navigate, inviteCode]);

  /**
   * Apply initial video state (after fetching from API)
   */
  useEffect(() => {
    if (!initialVideoState || !isConnected) return;

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
   * Check if current user can delete room (memoized)
   * User can delete if:
   * 1. User is ADMIN (has 'ADMIN' in roles array)
   * 2. User is host (userId === room.userId) - Note: backend uses 'userId' field for host
   * 3. Room is not already DELETED or EXPIRED
   */
  const canDeleteRoom = useMemo(() => {
    // Must have both roomInfo and loggedInUser with userId
    if (!roomInfo || !roomInfo.userId || !loggedInUser || !loggedInUser.userId) {
      return false;
    }

    // Cannot delete if room is already DELETED or EXPIRED
    if (roomInfo.status === 'DELETED' || roomInfo.status === 'EXPIRED') {
      return false;
    }

    // Check if user is ADMIN
    const isAdmin = loggedInUser.roles?.includes('ADMIN') || 
                    loggedInUser.role === 'ADMIN' ||
                    MyUser?.my_user?.roles?.includes('ADMIN') ||
                    MyUser?.roles?.includes('ADMIN');

    // Check if user is host (backend uses 'userId' field for room owner/host)
    const currentUserId = String(loggedInUser.userId);
    const roomHostId = String(roomInfo.userId); // Backend field name is 'userId', not 'hostUserId'
    const isHost = currentUserId === roomHostId;

    return isAdmin || isHost;
  }, [roomInfo, loggedInUser, MyUser]);

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
        {/* Room Deleted/Expired Dialog - Blocking */}
        {showRoomDeletedDialog && (
          <div className="room-deleted-overlay">
            <div className="room-deleted-dialog">
              <div className="room-deleted-icon">
                <i className="fa-solid fa-circle-exclamation"></i>
              </div>
              <h2>Phòng đã đóng</h2>
              <p>Phòng này {roomDeletedReason}.</p>
              <p className="info-text">
                Tất cả dữ liệu đã bị xóa (tin nhắn, thành viên, lịch sử).
              </p>
              <p className="redirect-text">Bạn sẽ được chuyển về danh sách phòng sau 3 giây...</p>
              <button 
                onClick={() => navigate('/watch-together')} 
                className="btn-redirect-now"
              >
                Quay về ngay
              </button>
            </div>
          </div>
        )}

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
              <h1 className="watch-room-title">
                {roomInfo?.roomName || 'Watch Together'}
              </h1>
              <div className="connection-status">
                <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
                <span className="status-text">
                  {isConnected ? 'Đã kết nối' : 'Mất kết nối'}
                </span>
                {/* Viewer count */}
                <span className="viewer-count">
                  <i className="fa-solid fa-eye"></i>
                  <span>{state.members.length}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="watch-room-header-right">
            {/* Delete Room Button - Only for ADMIN or Host */}
            {roomInfo && loggedInUser && canDeleteRoom && (
              <DeleteRoomButton
                roomId={roomId}
                viewerCount={state.members.length}
                canDelete={canDeleteRoom}
                currentUserId={loggedInUser?.userId}
                isAdmin={loggedInUser?.roles?.includes('ADMIN')}
                onDeleteSuccess={() => {
                  // Disconnect WebSocket to stop all events
                  if (disconnectRef.current) {
                    disconnectRef.current();
                  }
                  
                  // Clear player ref to prevent accessing null player
                  if (playerRef.current) {
                    playerRef.current = null;
                  }
                }}
              />
            )}

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
