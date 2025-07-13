// ChatBox.jsx
import React, { useState, useEffect } from "react";
import { sendMessageToGPT } from "../services/ChatService"; 
import MovieService from "../services/MovieService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpRightAndDownLeftFromCenter,faCommentDots } from "@fortawesome/free-solid-svg-icons";

import "../css/ChatBox.css";
import ReactMarkdown from "react-markdown";

const ChatBox = () => {
  const [message, setMessage] = useState("");
  const [chatLog, setChatLog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [popularMovies, setPopularMovies] = useState([]);

  const handleSend = async () => {
    if (!message.trim()) return;
    const userMessage = { role: "user", content: message };
    setChatLog((prev) => [...prev, userMessage]);
    setMessage("");
    setLoading(true);

    // Nếu người dùng hỏi về phim nổi bật
    if (/phim nổi bật|nhiều lượt xem|xem nhiều nhất/i.test(message)) {
     const movies = await MovieService.getPopularMovies();
      setPopularMovies(movies);
      setChatLog((prev) => [...prev, { role: "assistant", content: "popular_movies" }]);
    } else {
      const aiResponse = await sendMessageToGPT(message);
      const aiMessage = { role: "assistant", content: aiResponse };
      setChatLog((prev) => [...prev, aiMessage]);
    }

    setLoading(false);
  };

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
      <FontAwesomeIcon icon={faCommentDots} />
      </div>
    );
  }

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
                    ><FontAwesomeIcon icon={faUpRightAndDownLeftFromCenter} /></button>
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
            <div className={`chatbox-message ${msg.role}`} key={i}>
              <strong>{msg.role === "user" ? "Bạn: " : "AI: "}</strong>
              {msg.content === "popular_movies" ? (
                <div>
                  <p>Dưới đây là một số bộ phim có lượt xem cao nhất hiện nay:</p>
                  {popularMovies.map((movie, index) => (
                    <div key={movie.movieId} className="movie-suggestion-card">
                      <img
                        src={movie.thumbnailUrl}
                        alt={movie.title}
                       className="movie-thumb"
                      />
                      <div className="movie-info">
                        <a
                          href={`/movies/${movie.movieId}`}
                          className="movie-title"
                        >
                          {index + 1}. {movie.title}
                        </a>
                        <div className="movie-meta">
                          <span>{movie.viewCount} lượt xem</span>
                          <div><strong>Thể loại:</strong> {movie.genres.join(", ")}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
               <ReactMarkdown
              components={{
                img: ({node, ...props}) => (
            <img {...props} className="markdown-thumb" alt={props.alt || ""} />
                )}}>
              {msg.content}
            </ReactMarkdown>
              )}
            </div>
          ))}
          {loading && <div className="chatbox-message assistant">AI đang trả lời...</div>}
        </div>
        <div className="chatbox-input-area">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
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
