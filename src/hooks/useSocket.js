import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

// 动态获取Socket.io服务器地址
const getSocketUrl = () => {
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const port = window.location.port;
  // 如果端口是空的（80 或 443），则使用 protocol//hostname
  if (port) {
    return `${protocol}//${hostname}:${port}`;
  }
  return `${protocol}//${hostname}`;
};

const SOCKET_URL = getSocketUrl();

export function useSocket() {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);

  const eventHandlersRef = useRef({});

  useEffect(() => {
    console.log('尝试连接 Socket 服务器:', SOCKET_URL);

    const socketInstance = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10
    });

    socketInstance.on('connect', () => {
      console.log('Socket连接成功, ID:', socketInstance.id);
      setConnected(true);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket连接错误:', error);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('Socket断开连接, 原因:', reason);
      setConnected(false);
    });

    // 登录成功
    socketInstance.on('login:success', (userData) => {
      setUser(userData);
    });

    socketInstance.on('login:error', (error) => {
      console.error('登录失败:', error);
      alert(error);
    });

    // 用户列表更新
    socketInstance.on('user:list', (userList) => {
      setUsers(userList);
    });

    // 个人资料更新成功 - 同步本地 user 状态
    socketInstance.on('profile:success', (updatedUser) => {
      setUser(updatedUser);
    });

    socketInstance.on('user:join', ({ user }) => {
      console.log(`${user.username} 加入聊天室`);
    });

    socketInstance.on('user:leave', ({ userId, username }) => {
      console.log(`用户 ${username || userId} 离开聊天室`);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // 动态添加事件监听器
  const on = (event, handler) => {
    if (!socket) return;

    socket.on(event, handler);
    eventHandlersRef.current[event] = handler;
  };

  // 动态移除事件监听器
  const off = (event) => {
    if (!socket) return;

    socket.off(event, eventHandlersRef.current[event]);
    delete eventHandlersRef.current[event];
  };

  const login = (username, avatar, avatarId) => {
    if (socket) {
      socket.emit('login', { username, avatar, avatarId });
    }
  };

  const sendMessage = (content, roomId = 'general') => {
    if (socket) {
      socket.emit('message:send', { content, roomId });
    }
  };

  const joinRoom = (roomId) => {
    if (socket) {
      socket.emit('room:join', roomId);
    }
  };

  const leaveRoom = (roomId) => {
    if (socket) {
      socket.emit('room:leave', roomId);
    }
  };

  const requestMessageHistory = (roomId = 'general') => {
    if (socket) {
      socket.emit('message:history', roomId);
    }
  };

  const startTyping = (roomId = 'general') => {
    if (socket) {
      socket.emit('typing:start', roomId);
    }
  };

  const stopTyping = (roomId = 'general') => {
    if (socket) {
      socket.emit('typing:stop', roomId);
    }
  };

  return {
    socket,
    connected,
    user,
    users,
    on,
    off,
    login,
    sendMessage,
    joinRoom,
    leaveRoom,
    requestMessageHistory,
    startTyping,
    stopTyping
  };
}
