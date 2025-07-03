import React, { useState } from "react";
import { sendMessageToGPT } from "../services/ChatService";
import "../css/ChatBox.css";
import ReactMarkdown from "react-markdown";



const ChatBox = () => {
  const [message, setMessage] = useState("");
  const [chatLog, setChatLog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isOpen, setIsOpen] = useState(false); // mở rộng chatbox
if (!isOpen) {
  return (
    <div
      onClick={() => setIsOpen(true)}
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        width: 60,
        height: 60,
        borderRadius: "50%",
        backgroundColor: "#007bff",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 28,
        cursor: "pointer",
        zIndex: 9999,
      }}
    >
      💬
    </div>
  );
}


      if (isHidden) {
        return (
          <div
            className="chatbox-toggle-ball"
            onClick={() => setIsHidden(false)}
            title="Mở chat"
          >
            💬
          </div>
        );
      }


  const handleSend = async () => {
    if (!message.trim()) return;

    const userMessage = { role: "user", content: message };
    setChatLog((prev) => [...prev, userMessage]);
    setMessage("");
    setLoading(true);

    const aiResponse = await sendMessageToGPT(message);
    const aiMessage = { role: "assistant", content: aiResponse };
    setChatLog((prev) => [...prev, aiMessage]);
    setLoading(false);
  };

  return (
    <div className={`chatbox-wrapper${isFullScreen ? " fullscreen" : ""}`}>
      <div className="chatbox-container">
        <div className="chatbox-header">
          <span>Chat AI</span>
          <div>
            {!isFullScreen ? (
              <button
                className="chatbox-zoom-btn"
                 onClick={() => setIsOpen(false)}
                title="Phóng to"
              >⛶</button>
            ) : (
              <button
                className="chatbox-zoom-btn"
                onClick={() => setIsFullScreen(false)}
                title="Thu nhỏ"
              >🗗</button>
            )}
          </div>
        </div>
        <div className="chatbox-content">
          {chatLog.map((msg, i) => (
            <div className={`chatbox-message ${msg.role}`}>
              <strong>{msg.role === "user" ? "Bạn: " : "AI: "}</strong>
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          ))}
          {loading && (
            <div className="chatbox-message assistant">AI đang trả lời...</div>
          )}
        </div>
        <div className="chatbox-input-area">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") handleSend();
            }}
            placeholder="Nhập câu hỏi về phim..."
            className="chatbox-input"
          />
          <button onClick={handleSend} className="chatbox-send-button">
            Gửi
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;