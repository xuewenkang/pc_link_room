import React, { useState, useEffect } from 'react';
import { generateRandomNickname, getRandomAvatar, svgToDataUrl } from '../utils/avatars';
import './AutoLogin.css';

function AutoLogin({ onLogin }) {
  const [isLoading, setIsLoading] = useState(true);
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [currentAvatarIndex, setCurrentAvatarIndex] = useState(0);

  useEffect(() => {
    // 生成随机昵称和头像
    const randomNickname = generateRandomNickname();
    const randomAvatar = getRandomAvatar();
    const avatarUrl = svgToDataUrl(randomAvatar.svg);

    setNickname(randomNickname);
    setAvatar({
      ...randomAvatar,
      dataUrl: avatarUrl
    });
    setIsLoading(false);
  }, []);

  const handleLogin = () => {
    if (nickname.trim() && avatar) {
      onLogin(nickname.trim(), avatar.dataUrl, avatar.id);
    }
  };

  const handleRefreshAvatar = () => {
    const newAvatar = getRandomAvatar([avatar.id]);
    const avatarUrl = svgToDataUrl(newAvatar.svg);
    setAvatar({
      ...newAvatar,
      dataUrl: avatarUrl
    });
  };

  const handleRefreshNickname = () => {
    const newNickname = generateRandomNickname();
    setNickname(newNickname);
  };

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>正在生成你的角色...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auto-login-container">
      {/* 背景卡通动画 */}
      <div className="bg-animations">
        <div className="floating-icon" style={{ top: '15%', left: '5%', animationDelay: '0s' }}>🎈</div>
        <div className="floating-icon" style={{ top: '25%', right: '8%', animationDelay: '2s' }}>☁️</div>
        <div className="floating-icon" style={{ bottom: '20%', left: '12%', animationDelay: '4s' }}>🧸</div>
        <div className="floating-icon" style={{ bottom: '15%', right: '15%', animationDelay: '1s' }}>🎨</div>
        <div className="floating-icon" style={{ top: '40%', left: '25%', animationDelay: '3s' }}>🍭</div>
        <div className="floating-icon" style={{ top: '60%', right: '20%', animationDelay: '5s' }}>🍕</div>
      </div>

      <div className="login-card">
        {/* 装饰元素 */}
        <div className="decoration decoration-top-left">🌟</div>
        <div className="decoration decoration-top-right">⭐</div>
        <div className="decoration decoration-bottom-left">🌈</div>
        <div className="decoration decoration-bottom-right">✨</div>

        <div className="login-header">
          <h1>🎮 欢乐聊天</h1>
          <p>进入卡通世界开始冒险！</p>
        </div>

        <div className="avatar-preview">
          <div className="avatar-circle">
            <div className="avatar-svg-wrapper" dangerouslySetInnerHTML={{ __html: avatar?.svg }} />
          </div>
          <button type="button" className="refresh-btn" onClick={handleRefreshAvatar}>
            🔄 换个头像
          </button>
        </div>

        <div className="nickname-section">
          <div className="nickname-box">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={12}
              placeholder="你的昵称"
              className="nickname-input"
            />
            <button
              type="button"
              className="refresh-nickname-btn"
              onClick={handleRefreshNickname}
              title="换个昵称"
            >
              🎲
            </button>
          </div>
        </div>

        <button className="start-btn" onClick={handleLogin}>
          🚀 开始冒险
        </button>

        <div className="login-footer">
          <p>✨ 同局域网朋友一起玩更开心哦！</p>
        </div>
      </div>
    </div>
  );
}

export default AutoLogin;
