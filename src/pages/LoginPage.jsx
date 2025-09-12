import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ApiService from '../services/AuthService';
import { useAuth } from '../context/AuthContext';
import "../css/LoginPage.css";
import { formatPhoneNumber } from '../utils/formatPhoneNumber';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay } from '@fortawesome/free-solid-svg-icons';
import Logo from '../components/Logo';

const LoginPage = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [activeTab, setActiveTab] = useState('phone');
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    // Thêm state âm thanh
    const [isSoundOn, setIsSoundOn] = useState(false);
    const videoRef = useRef(null);
    
    const handleLogin = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setIsLoggingIn(true);

        // Kiểm tra thông tin nhập vào
        if (!phoneNumber.trim() || !password) {
            setErrorMessage('Bạn vui lòng nhập đầy đủ thông tin');
            setIsLoggingIn(false);
            return;
        }

        // Định dạng số điện thoại và kiểm tra tính hợp lệ
        const formattedPhone = formatPhoneNumber(phoneNumber);
        if (!formattedPhone) {
            setErrorMessage('Số điện thoại không hợp lệ');
            setIsLoggingIn(false);
            return;
        }

        try {
            const response = await ApiService.post('/login', {
                username: formattedPhone,
                password,
            });

            if (response && response.idToken) {
                // BE mới trả về: idToken, accessToken, refeshToken, expiresIn, userAttributes, my_user, username
                const { 
                    idToken, 
                    accessToken, 
                    refeshToken, 
                    expiresIn, 
                    userAttributes, 
                    my_user, 
                    username 
                } = response;
                
                login({
                    username: username || formattedPhone, // Sử dụng username từ BE
                    idToken,
                    accessToken,
                    refeshToken, // Giữ tên như BE (có typo)
                    refreshToken: refeshToken, // Thêm bản đúng để backward compatible
                    expiresIn,
                    userAttributes,
                    my_user,
                    lastLoginTime: Date.now(),
                }, () => {
                    navigate('/main');
                });
            } else {
                setErrorMessage('Tài khoản không tồn tại');
            }
        } catch (error) {
            console.error("Lỗi đăng nhập:", error.response || error);
            setErrorMessage('Số điện thoại hoặc mật khẩu không đúng !!!');
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setErrorMessage(''); // Reset thông báo lỗi khi chuyển tab
    };

    return (
    <div className="login-bg-video">
      {/* BG video */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted={!isSoundOn}
        preload="auto"
        playsInline
        className="bg-video"
      >
        <source src={`${process.env.PUBLIC_URL}/videologin.mp4`} type="video/mp4" />
        Trình duyệt của bạn không hỗ trợ video nền.
      </video>

      {/* Nút âm lượng */}
      <div className="sound-toggle">
        <button
          onClick={() => {
            const next = !isSoundOn;
            setIsSoundOn(next);
            if (videoRef.current) {
              videoRef.current.muted = !next;
              if (next) videoRef.current.play();
            }
          }}
          className={isSoundOn ? "sound-on" : "sound-off"}
        >
          {isSoundOn ? "🔊" : "🔈"}
        </button>
      </div>

      {/* TOPBAR: logo + Xem ngay */}
        <div className="auth-topbar">
        <Link to="/main" className="brand">
             <Logo type="wordmark" size={40} />
            
        </Link>

        <button className="btn-watch" style={{width:"10%"}} onClick={() => navigate('/main')}>
            <FontAwesomeIcon icon={faPlay} /> Xem ngay
        </button>
        </div>


      {/* Card */}
      <div className="login-content">
        <div className="card auth-card p-4">
          <div className="text-center mb-3">
            <h1 className="auth-heading">CartoonToo</h1>
            <p className="auth-subtitle">
              Đăng nhập tài khoản <br /> để khám phá kho phim hoạt hình đặc sắc!
            </p>
          </div>

          <form onSubmit={handleLogin}>
            {activeTab === 'phone' && (
              <>
                {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}

                <div className="input-group mt-2">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="📱 Số điện thoại"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                  />
                </div>
                <div className="input-group mb-2">
                  <input
                    type="password"
                    className="form-control"
                    placeholder="🔒 Mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn-login-dark w-100 mb-2" disabled={isLoggingIn}>
                  {isLoggingIn ? 'Đang đăng nhập...' : 'Đăng Nhập Với Mật Khẩu'}
                </button>
              </>
            )}
          </form>

          <div className="text-center mb-2">
            <a href="/forgot-password" className="text-link">Quên mật khẩu?</a>
          </div>

          <hr className="auth-sep" />

          <div className="text-center">
            <span className="muted">Chưa có tài khoản? </span>
            <Link to="/create-user" className="text-link fw-bold">Đăng Ký</Link>
          </div>

          <div className="auth-footer mt-3">
            © Bản quyền thuộc về Cartoon Too.
          </div>
        </div>

        {isLoggingIn && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p className="loading-text">Đang đăng nhập...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;