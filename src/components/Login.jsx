import React, { useState } from 'react';
import './Login.css';

const AVATARS = ['😊', '😎', '🥳', '🤖', '🦊', '🐱', '🐶', '🐼', '🦄', '🌟'];

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      onLogin(username.trim(), avatar);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>🎊 欢乐聊天</h1>
          <p>局域网娱乐平台</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="avatar-selector">
            <label>选择你的头像</label>
            <div className="avatar-grid">
              {AVATARS.map((a, i) => (
                <button
                  key={i}
                  type="button"
                  className={`avatar-btn ${avatar === a ? 'active' : ''}`}
                  onClick={() => setAvatar(a)}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div className="username-input">
            <label>输入你的昵称</label>
            <input
              type="text"
              placeholder="请输入昵称"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={20}
              autoFocus
            />
          </div>

          <button type="submit" className="login-btn" disabled={!username.trim()}>
            进入聊天室
          </button>
        </form>

        <div className="login-tips">
          <p>💡 让同局域网内的朋友输入您的IP即可访问</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
