// ChatBox.jsx
import React, { useState, useEffect, useRef } from "react";
import { sendMessageToServer, fetchWelcome } from "../services/ChatService";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import "../css/ChatBox.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpRightAndDownLeftFromCenter, faCommentDots } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../context/AuthContext";

const ChatBox = ({ currentMovieId }) => {
  const { MyUser } = useAuth();
  
  // ✅ Conversation ID for persistent chat session
  const convRef = useRef(localStorage.getItem('ai_conv_id') || crypto.randomUUID());
  useEffect(() => {
    localStorage.setItem('ai_conv_id', convRef.current);
  }, []);

  const [message, setMessage] = useState("");
  const [chatLog, setChatLog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [showQuickSuggestions, setShowQuickSuggestions] = useState(false); // ✅ NEW: state để control quick suggestions
  const MAX_QUESTIONS_GUEST = 3; // Giới hạn 3 câu hỏi cho khách
  
  // Ref để scroll xuống tin nhắn cuối cùng
  const chatContentRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Reset conversation function
  const resetConversation = () => {
    localStorage.removeItem('ai_conv_id');
    convRef.current = crypto.randomUUID();
    localStorage.setItem('ai_conv_id', convRef.current);
    setChatLog([]);
    setQuestionCount(0);
  };
  
  const [quick, setQuick] = useState([
    "Có khuyến mãi hay voucher nào không?",
    "Mã giảm giá cho gói VIP rẻ nhất",
    "Ưu đãi đang hoạt động hôm nay",
    "Gợi ý phim gia đình",
    "Top phim chiếu rạp mới"
  ]);

  // Hàm scroll xuống cuối
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: "smooth", 
        block: "end" 
      });
    }
  };

  // Auto scroll khi có tin nhắn mới hoặc loading thay đổi
  useEffect(() => {
    scrollToBottom();
  }, [chatLog, loading]);

  // Khi mở chat lần đầu -> gọi welcome
  useEffect(() => {
    if (isOpen && chatLog.length === 0) {
      (async () => {
        try {
          const res = await fetchWelcome(convRef.current);
          const welcomeMsg = MyUser 
            ? res.answer.replace(/bạn/gi, MyUser?.my_user?.userName || MyUser?.username || "bạn")
            : res.answer;
          setChatLog([{ 
            role: "assistant", 
            content: welcomeMsg, 
            suggestions: res.showSuggestions ? res.suggestions : [], 
            showSuggestions: res.showSuggestions,
            promos: res.showPromos ? res.promos : [],
            showPromos: res.showPromos
          }]);
        } catch(e) {
          console.error("❌ Welcome API failed:", e);
          const errorMsg = e.message || "Không thể kết nối tới server chat";
          const welcomeText = MyUser 
            ? `Chào ${MyUser?.my_user?.userName || MyUser?.username}! ${errorMsg}`
            : `Chào bạn! ${errorMsg} (Giới hạn 3 câu hỏi cho khách)`;
          setChatLog([{ role: "assistant", content: welcomeText }]);
        }
      })();
    }
  }, [isOpen, MyUser]);

  // Reset questionCount khi user đăng nhập/đăng xuất
  useEffect(() => {
    if (MyUser) {
      setQuestionCount(0); // Reset khi đăng nhập
    }
  }, [MyUser]);

  const handleSend = async () => {
    if (!message.trim()) return;
    
    // Kiểm tra giới hạn câu hỏi cho khách
    if (!MyUser && questionCount >= MAX_QUESTIONS_GUEST) {
      setChatLog((prev) => [...prev, { 
        role: "assistant", 
        content: "❌ Bạn đã hết lượt hỏi! Vui lòng đăng nhập để tiếp tục sử dụng dịch vụ." 
      }]);
      return;
    }

    const userMsg = { 
      role: "user", 
      content: message,
      username: MyUser ? (MyUser?.my_user?.userName || MyUser?.username) : "Khách"
    };
    setChatLog((prev) => [...prev, userMsg]);
    setMessage("");
    setLoading(true);

    // Tăng số câu hỏi nếu là khách
    if (!MyUser) {
      setQuestionCount(prev => prev + 1);
    }

    try {
      const res = await sendMessageToServer(message, currentMovieId, convRef.current);
      const aiMsg = {
        role: "assistant",
        content: res.answer,
        suggestions: res.showSuggestions ? (res.suggestions || []) : [],
        showSuggestions: !!res.showSuggestions,
        promos: res.showPromos ? (res.promos || []) : [],
        showPromos: !!res.showPromos
      };
      setChatLog((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error("❌ Chat error:", error);
      const errorMsg = error.message || "Lỗi không xác định";
      setChatLog((prev) => [...prev, { 
        role: "assistant", 
        content: `❌ ${errorMsg}` 
      }]);
    } finally { setLoading(false); }
  };

  // Khi click quick-chip -> gửi luôn
  const sendQuick = async (text) => {
    // Kiểm tra giới hạn câu hỏi cho khách
    if (!MyUser && questionCount >= MAX_QUESTIONS_GUEST) {
      setChatLog((prev) => [...prev, { 
        role: "assistant", 
        content: "❌ Bạn đã hết lượt hỏi! Vui lòng đăng nhập để tiếp tục sử dụng dịch vụ." 
      }]);
      return;
    }

    const userMsg = { 
      role: "user", 
      content: text,
      username: MyUser ? (MyUser?.my_user?.userName || MyUser?.username) : "Khách"
    };
    setChatLog((prev) => [...prev, userMsg]);
    setLoading(true);

    // Tăng số câu hỏi nếu là khách
    if (!MyUser) {
      setQuestionCount(prev => prev + 1);
    }

    try {
      const res = await sendMessageToServer(text, currentMovieId, convRef.current);
      const aiMsg = {
        role: "assistant",
        content: res.answer,
        suggestions: res.showSuggestions ? (res.suggestions || []) : [],
        showSuggestions: !!res.showSuggestions,
        promos: res.showPromos ? (res.promos || []) : [],
        showPromos: !!res.showPromos
      };
      setChatLog((prev) => [...prev, aiMsg]);
    } catch {
      setChatLog((prev) => [...prev, { role: "assistant", content: "❌ Lỗi khi gọi AI!" }]);
    } finally { 
      setLoading(false); 
    }
  };

  if (!isOpen) {
    return (
      <div
        onClick={() => setIsOpen(true)}
        style={{
          position: "fixed", bottom: 20, right: 20, width: 60, height: 60,
          borderRadius: "50%", backgroundColor: "#007bff", color: "white",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28, cursor: "pointer", zIndex: 9999,
        }}
      >
        <FontAwesomeIcon icon={faCommentDots} />
      </div>
    );
  }

  return (
    <div className={`chatbox-wrapper${isFullScreen ? " fullscreen" : ""}`}>
      <div className="chatbox-container">
        <div className="chatbox-header">
          <span>Chat AI CartoonToo</span>
          <div className="header-actions">
            <button 
              className="chatbox-suggestion-btn" 
              onClick={() => setShowQuickSuggestions(!showQuickSuggestions)}
              title={showQuickSuggestions ? "Ẩn gợi ý nhanh" : "Hiện gợi ý nhanh"}
            >
              💡
            </button>
            {!isFullScreen ? (
              <button className="chatbox-zoom-btn" onClick={() => setIsOpen(false)} title="Thu gọn">
                <FontAwesomeIcon icon={faUpRightAndDownLeftFromCenter} />
              </button>
            ) : (
              <button className="chatbox-zoom-btn" onClick={() => setIsFullScreen(false)} title="Thu nhỏ">🗗</button>
            )}
          </div>
        </div>

        <div className="chatbox-content" ref={chatContentRef}>
          {chatLog.map((msg, i) => (
            <div className={`chatbox-message ${msg.role}`} key={i}>
              <strong>{msg.role === "user" ? `${msg.username}: ` : "AI: "}</strong>
              <ReactMarkdown>{msg.content}</ReactMarkdown>

              {msg.suggestions?.length > 0 && (
                <div className="suggestion-grid">
                  {msg.suggestions.map((m, idx) => (
                     <Link
                        key={m.movieId}
                        to={`/movie/${m.movieId}`}
                        className="movie-suggestion-card"
                        onClick={() => setIsOpen(false)}
                      >
                      <img src={m.thumbnailUrl} alt={m.title} className="movie-thumb" />
                      <div className="movie-info">
                        <div className="movie-title">{idx + 1}. {m.title}</div>
                        <div className="movie-meta">
                          <span>{m.viewCount} lượt xem</span>
                          <div><strong>Thể loại:</strong> {m.genres?.join(", ")}</div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* PROMOS */}
              {msg.showPromos && msg.promos?.length > 0 && (
                <div className="promo-grid">
                  {msg.promos.map((p, i) => (
                    <div key={p.promotionId + i} className="promo-card">
                      <div className="promo-title">{p.promotionName || p.title}</div>
                      <div className="promo-meta">
                        <div><b>Loại:</b> {p.type}</div>
                        {p.voucherCode && (
                          <div className="voucher-code-row">
                            <b>Mã:</b> 
                            <span 
                              className="voucher-code" 
                              onClick={() => {
                                navigator.clipboard.writeText(p.voucherCode);
                                alert(`Đã sao chép mã: ${p.voucherCode}`);
                              }}
                              title="Click để copy mã"
                            >
                              {p.voucherCode}
                            </span>
                          </div>
                        )}
                        {p.discountPercent != null && <div><b>Giảm:</b> {p.discountPercent}%</div>}
                        {p.maxDiscountAmount != null && <div><b>Tối đa:</b> {p.maxDiscountAmount.toLocaleString()}đ</div>}
                        <div><b>HSD:</b> {p.endDate}</div>
                      </div>
                      {p.note && <div className="promo-note">{p.note}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {loading && <div className="chatbox-message assistant">AI đang trả lời...</div>}
          
          {/* Hiển thị quick suggestions khi chat trống hoặc chỉ có welcome message HOẶC khi user bật manually */}
          {(showQuickSuggestions || chatLog.length === 0 || (chatLog.length === 1 && chatLog[0].role === "assistant")) && (
            <div className="quick-suggestions">
              <div className="quick-title">💡 Bạn có thể hỏi:</div>
              <div className="quick-chips">
                {quick.map((q, idx) => (
                  <button 
                    key={idx} 
                    className="quick-chip"
                    onClick={() => {
                      sendQuick(q);
                      setShowQuickSuggestions(false); // Ẩn đi sau khi click
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Invisible element để scroll xuống */}
          <div ref={messagesEndRef} />
        </div>

        <div className="chatbox-input-area">
          <div className="input-wrapper">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={MyUser ? "Nhập câu hỏi về phim..." : `Câu hỏi về phim... (${MAX_QUESTIONS_GUEST - questionCount}/3)`}
              className="chatbox-input"
              disabled={!MyUser && questionCount >= MAX_QUESTIONS_GUEST}
            />
            {!MyUser && questionCount < MAX_QUESTIONS_GUEST && (
              <span className="guest-limit-badge">{MAX_QUESTIONS_GUEST - questionCount}</span>
            )}
          </div>
          <button 
            onClick={handleSend} 
            className="chatbox-send-button"
            disabled={!MyUser && questionCount >= MAX_QUESTIONS_GUEST}
          >
            Gửi
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
