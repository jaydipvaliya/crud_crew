import React, { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft, Bot, MessageSquare } from 'lucide-react';

export function ChatWindow({
  activeChat,
  messages,
  typingStatus,
  aiToggleEnabled,
  onToggleAi,
  onSendMessage,
  onTyping,
  onBack,
}) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingStatus]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
    onTyping(false);
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    onTyping(e.target.value.length > 0);
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp + 'Z');
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateLabel = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp + 'Z');
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (!activeChat) {
    return (
      <div className="welcome-panel">
        <div className="welcome-icon">
          <MessageSquare size={44} />
        </div>
        <h2>Select a Contact</h2>
        <p>Choose a contact from the list to start chatting in real-time. Make sure to toggle AI Stand-In if you want the chatbot to reply on your behalf when you are offline.</p>
      </div>
    );
  }

  let lastDate = '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%' }}>
      {/* Header */}
      <div className="chat-header">
        <div className="header-contact-info">
          <button className="icon-btn mobile-only" onClick={onBack} style={{ marginRight: '8px' }}>
            <ArrowLeft size={20} />
          </button>
          <div className="header-contact-avatar">{getInitials(activeChat.display_name)}</div>
          <div>
            <div className="header-name">{activeChat.display_name}</div>
            <div className={`header-status ${activeChat.is_online ? 'online' : ''}`}>
              {activeChat.is_online ? 'online' : 'offline'}
            </div>
          </div>
        </div>

        <div className="header-actions">
          <div className="toggle-wrapper">
            <Bot size={16} color="var(--accent-primary)" />
            <span className="toggle-label">AI Stand-In</span>
            <label className="switch">
              <input
                type="checkbox"
                checked={aiToggleEnabled}
                onChange={(e) => onToggleAi(e.target.checked)}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="messages-area">
        {messages.map((msg, index) => {
          const dateLabel = formatDateLabel(msg.timestamp);
          const showDate = dateLabel !== lastDate;
          if (showDate) lastDate = dateLabel;

          const isSent = msg.sender_id !== activeChat.id;
          const isAI = msg.is_ai_generated === 1;

          return (
            <React.Fragment key={msg.id || index}>
              {showDate && <div className="date-tag">{dateLabel}</div>}
              <div className={`message-bubble-wrapper ${isSent ? 'sent' : 'received'} ${isAI ? 'ai-msg' : ''}`}>
                <div className="msg-bubble">
                  <span>{msg.content}</span>
                  {isAI && (
                    <span className="ai-stamp">
                      <Bot size={10} /> AI
                    </span>
                  )}
                  <div className="msg-time">{formatTime(msg.timestamp)}</div>
                </div>
              </div>
            </React.Fragment>
          );
        })}

        {/* Typing indicator */}
        {typingStatus && (
          <div className="typing-bubble">
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form className="input-area" onSubmit={handleSend}>
        <div className="input-field-wrapper">
          <input
            type="text"
            className="input-field"
            placeholder="Type a message..."
            value={inputText}
            onChange={handleInputChange}
          />
        </div>
        <button type="submit" className="send-btn">
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
