import React from 'react';
import './Sidebar.css';

function Sidebar({ currentView, setCurrentView, user, userCount }) {
  const menuItems = [
    { id: 'home', icon: '🏠', label: '首页' },
    { id: 'chat', icon: '💬', label: '聊天室' },
    { id: 'games', icon: '🎮', label: '小游戏' },
    { id: 'room', icon: '📺', label: '娱乐厅' }
  ];

  return (
    <div className="sidebar">
      <div className="logo-section">
        <h1>🎊 欢乐聊天</h1>
        <p className="subtitle">局域网娱乐平台</p>
      </div>

      {user && (
        <div className="user-profile">
          <span className="user-avatar">{user.avatar}</span>
          <span className="user-name">{user.username}</span>
        </div>
      )}

      <div className="online-info">
        <span className="online-dot"></span>
        <span>{userCount}人在线</span>
      </div>

      <nav className="nav-menu">
        {menuItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${currentView === item.id ? 'active' : ''}`}
            onClick={() => setCurrentView(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <p className="tips">💡 同局域网下输入您的IP即可访问</p>
      </div>
    </div>
  );
}

export default Sidebar;
