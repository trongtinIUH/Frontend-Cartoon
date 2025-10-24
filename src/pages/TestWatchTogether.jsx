/**
 * TestWatchTogether - Simple test page for Watch Together feature
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const TestWatchTogether = () => {
  const navigate = useNavigate();
  
  const [roomId, setRoomId] = useState('test_room_' + Date.now());
  const [isHost, setIsHost] = useState(true);

  const demoVideos = [
    {
      name: 'Mux Test Stream',
      url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
    },
    {
      name: 'Sintel Trailer',
      url: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8'
    },
    {
      name: 'Big Buck Bunny',
      url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
    }
  ];

  const [selectedVideo, setSelectedVideo] = useState(demoVideos[0].url);

  const handleJoinRoom = () => {
    const params = new URLSearchParams({
      video: selectedVideo,
      host: isHost ? '1' : '0'
    });

    navigate(`/watch-together/${roomId}?${params.toString()}`);
  };

  const handleCopyLink = () => {
    const params = new URLSearchParams({
      video: selectedVideo,
      host: '0' // Friends join as non-host
    });
    
    const link = `${window.location.origin}/watch-together/${roomId}?${params.toString()}`;
    navigator.clipboard.writeText(link);
    alert('✓ Đã copy link! Gửi cho bạn bè để cùng xem.');
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🎬 Test Watch Together</h1>
        <p style={styles.subtitle}>Phát HLS từ CloudFront, đồng bộ real-time qua WebSocket</p>

        <div style={styles.section}>
          <label style={styles.label}>Room ID</label>
          <input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            style={styles.input}
            placeholder="room_123"
          />
        </div>

        <div style={styles.section}>
          <label style={styles.label}>Video URL (HLS .m3u8)</label>
          <select 
            value={selectedVideo} 
            onChange={(e) => setSelectedVideo(e.target.value)}
            style={styles.select}
          >
            {demoVideos.map((v, i) => (
              <option key={i} value={v.url}>{v.name}</option>
            ))}
          </select>
          <input
            type="text"
            value={selectedVideo}
            onChange={(e) => setSelectedVideo(e.target.value)}
            style={{...styles.input, marginTop: 8}}
            placeholder="https://..."
          />
        </div>

        <div style={styles.section}>
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={isHost}
              onChange={(e) => setIsHost(e.target.checked)}
              style={styles.checkbox}
            />
            <span>👑 Tôi là Host (điều khiển video)</span>
          </label>
        </div>

        <div style={styles.buttonGroup}>
          <button onClick={handleJoinRoom} style={styles.primaryButton}>
            Tham gia phòng
          </button>
          <button onClick={handleCopyLink} style={styles.secondaryButton}>
            📋 Copy link mời
          </button>
        </div>

        <div style={styles.infoBox}>
          <h4 style={styles.infoTitle}>ℹ️ Hướng dẫn test</h4>
          <ol style={styles.infoList}>
            <li>Đảm bảo backend chạy tại <code>localhost:8080</code></li>
            <li>Click "Tham gia phòng" với <strong>Host = ON</strong></li>
            <li>Mở tab/trình duyệt mới</li>
            <li>Paste link hoặc nhập cùng Room ID với <strong>Host = OFF</strong></li>
            <li>Trên tab Host: PLAY/PAUSE/SEEK → tab kia đồng bộ</li>
            <li>Chat, debug panel (🔧) để xem latency</li>
          </ol>
        </div>

        <div style={styles.techStack}>
          <p style={styles.techTitle}>Tech Stack</p>
          <div style={styles.badges}>
            <span style={styles.badge}>video.js</span>
            <span style={styles.badge}>@stomp/stompjs</span>
            <span style={styles.badge}>sockjs-client</span>
            <span style={styles.badge}>HLS</span>
            <span style={styles.badge}>CloudFront</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  card: {
    background: 'white',
    borderRadius: '16px',
    padding: '2rem',
    maxWidth: '600px',
    width: '100%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
  },
  title: {
    fontSize: '2rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
    color: '#333'
  },
  subtitle: {
    color: '#666',
    marginBottom: '2rem'
  },
  section: {
    marginBottom: '1.5rem'
  },
  label: {
    display: 'block',
    fontWeight: '600',
    marginBottom: '0.5rem',
    color: '#333'
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '1rem',
    outline: 'none',
    transition: 'border 0.2s'
  },
  select: {
    width: '100%',
    padding: '0.75rem',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '1rem',
    outline: 'none',
    background: 'white'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    fontSize: '1rem'
  },
  checkbox: {
    width: '20px',
    height: '20px',
    cursor: 'pointer'
  },
  buttonGroup: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1.5rem'
  },
  primaryButton: {
    flex: 1,
    padding: '1rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'transform 0.2s'
  },
  secondaryButton: {
    flex: 1,
    padding: '1rem',
    background: 'white',
    color: '#667eea',
    border: '2px solid #667eea',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  infoBox: {
    background: '#f8f9fa',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '1rem'
  },
  infoTitle: {
    marginTop: 0,
    marginBottom: '0.5rem',
    fontSize: '1rem',
    fontWeight: '600'
  },
  infoList: {
    marginBottom: 0,
    paddingLeft: '1.5rem',
    fontSize: '0.9rem',
    lineHeight: '1.6'
  },
  techStack: {
    textAlign: 'center'
  },
  techTitle: {
    fontSize: '0.875rem',
    color: '#999',
    marginBottom: '0.5rem'
  },
  badges: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    justifyContent: 'center'
  },
  badge: {
    background: '#667eea',
    color: 'white',
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '500'
  }
};

export default TestWatchTogether;
