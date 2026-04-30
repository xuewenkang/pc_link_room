import React, { useState, useEffect } from 'react';
import { useSocket } from './hooks/useSocket';
import AutoLogin from './components/AutoLogin';
import ChatRoomNew from './components/ChatRoomNew';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [savedUser, setSavedUser] = useState(null);

  // 检查localStorage中是否有保存的用户信息
  useEffect(() => {
    const savedData = localStorage.getItem('chatUser');
    if (savedData) {
      try {
        const userData = JSON.parse(savedData);
        setSavedUser(userData);
        setIsLoggedIn(true);
      } catch (e) {
        console.error('读取保存的用户数据失败:', e);
        localStorage.removeItem('chatUser');
      }
    }
  }, []);

  const {
    socket,
    connected,
    user,
    users,
    login,
    sendMessage,
    joinRoom,
    leaveRoom,
    requestMessageHistory,
    startTyping,
    stopTyping
  } = useSocket();

  const handleLogin = (username, avatar, avatarId) => {
    login(username, avatar, avatarId);
    setIsLoggedIn(true);

    // 保存用户信息到localStorage
    localStorage.setItem('chatUser', JSON.stringify({
      username,
      avatar,
      avatarId
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem('chatUser');
    setIsLoggedIn(false);
    setSavedUser(null);
  };

  const handleUpdateUser = (newUsername, newAvatar, newAvatarId) => {
    setSavedUser(prev => prev ? { ...prev, username: newUsername, avatar: newAvatar, avatarId: newAvatarId } : null);
  };

  // 使用保存的用户信息登录
  useEffect(() => {
    if (savedUser && connected && !user) {
      login(savedUser.username, savedUser.avatar);
    }
  }, [savedUser, connected, user, login]);

  // 显示的聊天室
  return (
    <div className="app">
      <div className="main-container">
        {!isLoggedIn || !user ? (
          <AutoLogin onLogin={handleLogin} />
        ) : (
          <>
            <ChatRoomNew
              socket={socket}
              user={user}
              users={users}
              joinRoom={joinRoom}
              sendMessage={sendMessage}
              requestMessageHistory={requestMessageHistory}
              startTyping={startTyping}
              stopTyping={stopTyping}
              onLogout={handleLogout}
              onUpdateUser={handleUpdateUser}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default App;
