import React, { useState, useEffect, useRef } from 'react';
import './ChatRoom.css';

const EMOJIS = ['😀', '😍', '😂', '👍', '🎉', '🔥', '❤️', '👏', '😎', '🙏'];

function ChatRoom({ socket, user, users, joinRoom, sendMessage, requestMessageHistory, startTyping, stopTyping }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [typingUser, setTypingUser] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (socket && user) {
      // 加入聊天房间
      joinRoom('general');
      requestMessageHistory('general');

      // 监听新消息
      socket.on('message:new', ({ message }) => {
        setMessages(prev => [...prev, message]);
      });

      // 监听消息历史
      socket.on('message:history', ({ messages }) => {
        setMessages(messages);
      });

      // 监听打字提示
      socket.on('typing:start', ({ username }) => {
        setTypingUser(username);
      });

      socket.on('typing:stop', ({ username }) => {
        if (typingUser === username) {
          setTypingUser(null);
        }
      });

      return () => {
        socket.off('message:new');
        socket.off('message:history');
        socket.off('typing:start');
        socket.off('typing:stop');
      };
    }
  }, [socket, user, joinRoom, requestMessageHistory]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUser]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    sendMessage(inputText, 'general');
    setInputText('');
    stopTyping('general');
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);

    // 发送打字提示
    if (e.target.value.length > 0) {
      startTyping('general');
    } else {
      stopTyping('general');
    }

    // 清除之前的超时
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // 3秒后停止打字提示
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping('general');
    }, 3000);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '刚刚';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  const onlineUsers = users.filter(u => u.online);

  return (
    <div className="chat-room">
      <div className="chat-sidebar">
        <div className="sidebar-header">
          <h3>👥 在线好友</h3>
        </div>
        <div className="user-list">
          {onlineUsers.map(u => (
            <div key={u.id} className={user.id === u.id ? "user-item mine" : "user-item"}>
              <span className="user-avatar">{u.avatar}</span>
              <span className="user-name">{u.username}</span>
              <span className="user-status"></span>
            </div>
          ))}
        </div>
      </div>

      <div className="chat-main">
        <div className="chat-header">
          <h3>💬 公共聊天室</h3>
          <span className="room-info">{onlineUsers.length}人在线</span>
        </div>

        <div className="messages-container">
          <div className="welcome-message">
            <span>🎉 欢迎来到公共聊天室！</span>
            <p>与朋友们一起畅聊吧</p>
          </div>

          {messages.map(msg => {
            const isMine = msg.user_id === user?.id;
            return (
              <div key={msg.id} className={`message ${isMine ? 'mine' : ''}`}>
                {!isMine && <span className="msg-avatar">{msg.avatar}</span>}
                <div className="msg-content">
                  {!isMine && <span className="msg-sender">{msg.username}</span>}
                  <div className="msg-text">{msg.content}</div>
                  <span className="msg-time">{formatTime(msg.created_at)}</span>
                </div>
                {isMine && <span className="msg-avatar mine">{msg.avatar}</span>}
              </div>
            );
          })}

          {typingUser && typingUser !== user?.username && (
            <div className="typing-indicator">
              <span className="typing-avatar">{users.find(u => u.username === typingUser)?.avatar}</span>
              <span>{typingUser} 正在输入...</span>
            </div>
          )}

          <div ref={messagesEndRef}></div>
        </div>

        <form className="chat-input-area" onSubmit={handleSend}>
          <div className="quick-emojis">
            {EMOJIS.map((emoji, i) => (
              <button
                key={i}
                type="button"
                className="emoji-btn"
                onClick={() => setInputText(prev => prev + emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
          <input
            type="text"
            className="chat-input"
            placeholder="说点什么..."
            value={inputText}
            onChange={handleInputChange}
          />
          <button type="submit" className="send-btn">发送</button>
        </form>
      </div>
    </div>
  );
}

export default ChatRoom;
