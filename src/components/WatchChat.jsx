/**
 * WatchChat - Chat component for Watch Together
 * @author Senior FE Developer
 * @version 1.0
 */

import React, { useState, useRef, useEffect } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { MESSAGE_TYPES } from '../types/watch';
import '../css/WatchChat.css';

dayjs.extend(relativeTime);

/**
 * @typedef {import('../types/watch').Message} Message
 */

export function WatchChat({
  messages = [],
  onSendMessage,
  onLoadMore,
  hasMore = false,
  currentUserId,
}) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);

  /**
   * Scroll to bottom
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  /**
   * Auto scroll when new messages arrive
   */
  useEffect(() => {
    if (autoScroll) {
      scrollToBottom();
    }
  }, [messages, autoScroll]);

  /**
   * Check if user is near bottom
   */
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

    setAutoScroll(isNearBottom);
  };

  /**
   * Handle send message
   */
  const handleSend = (e) => {
    e.preventDefault();

    if (!inputText.trim()) return;

    onSendMessage?.(inputText.trim());
    setInputText('');
  };

  /**
   * Render single message
   */
  const renderMessage = (message, index) => {
    const isOwn = message.senderId === currentUserId;
    const isSystem = message.type === MESSAGE_TYPES.SYSTEM;

    if (isSystem) {
      return (
        <div key={index} className="chat-message-system">
          <span className="chat-message-system-text">{message.content}</span>
          <span className="chat-message-time">
            {dayjs(message.createdAt).format('HH:mm')}
          </span>
        </div>
      );
    }

    return (
      <div
        key={index}
        className={`chat-message ${isOwn ? 'chat-message-own' : 'chat-message-other'}`}
      >
        {!isOwn && (
          <div className="chat-message-avatar">
            {message.avatarUrl ? (
              <img src={message.avatarUrl} alt={message.senderName} />
            ) : (
              <div className="chat-message-avatar-placeholder">
                {message.senderName?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
          </div>
        )}

        <div className="chat-message-content">
          {!isOwn && (
            <div className="chat-message-sender">{message.senderName}</div>
          )}
          <div className="chat-message-bubble">
            <div className="chat-message-text">{message.content}</div>
            <div className="chat-message-time">
              {dayjs(message.createdAt).format('HH:mm')}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="watch-chat">
      {/* Messages */}
      <div
        className="chat-messages"
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
        {/* Load more button */}
        {hasMore && (
          <div className="chat-load-more">
            <button onClick={onLoadMore} className="chat-load-more-btn">
              Tải thêm tin nhắn
            </button>
          </div>
        )}

        {/* Message list */}
        {messages.length === 0 ? (
          <div className="chat-empty">
            <div className="chat-empty-icon">💬</div>
            <div className="chat-empty-text">Chưa có tin nhắn nào</div>
            <div className="chat-empty-hint">Hãy bắt đầu trò chuyện!</div>
          </div>
        ) : (
          messages.map(renderMessage)
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="chat-input-container">
        <form onSubmit={handleSend} className="chat-input-form">
          <input
            type="text"
            className="chat-input"
            placeholder="Nhập tin nhắn..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            maxLength={500}
          />
          <button
            type="submit"
            className="chat-send-btn"
            disabled={!inputText.trim()}
            title="Gửi tin nhắn"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="chat-send-icon">
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}

export default WatchChat;
