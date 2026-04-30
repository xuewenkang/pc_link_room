import { messageOps, userOps } from '../config/database.js';

export function setupChatHandlers(io, socket) {
  // 发送消息
  socket.on('message:send', ({ content, roomId = 'general' }) => {
    if (!content || content.trim().length === 0) return;

    const userId = socket.data.userId;
    if (!userId) {
      socket.emit('message:error', '请先登录');
      return;
    }

    // 保存消息到数据库
    const result = messageOps.create(userId, content, roomId);
    const message = messageOps.getWithUser(result.lastInsertRowid);

    // 广播消息给房间内的所有用户
    io.to(roomId).emit('message:new', { message, roomId });
  });

  // 请求消息历史（支持分页）
  socket.on('message:history', (data) => {
    // 兼容旧格式: roomId 可以是字符串或对象
    const roomId = (typeof data === 'string') ? data : (data?.roomId || 'general');
    const page = (typeof data === 'object' && data?.page) ? data.page : 1;
    const pageSize = 30; // 每页30条

    socket.join(roomId); // 加入房间

    const userId = socket.data.userId;
    if (!userId) {
      socket.emit('message:error', '请先登录');
      return;
    }

    const offset = (page - 1) * pageSize;
    const history = messageOps.getHistory(roomId, pageSize, offset);
    const total = messageOps.getCount(roomId);
    const hasMore = offset + history.length < total;

    socket.emit('message:history', { messages: history, roomId, hasMore, total });
  });

  // 开始输入提示
  socket.on('typing:start', (roomId = 'general') => {
    const username = socket.data.username;
    if (username) {
      socket.to(roomId).emit('typing:start', { username, roomId });
    }
  });

  // 停止输入提示
  socket.on('typing:stop', (roomId = 'general') => {
    const username = socket.data.username;
    if (username) {
      socket.to(roomId).emit('typing:stop', { username, roomId });
    }
  });

  // 加入房间
  socket.on('room:join', (roomId) => {
    socket.join(roomId);
    console.log(`用户 ${socket.data.username} 加入房间 ${roomId}`);
  });

  // 离开房间
  socket.on('room:leave', (roomId) => {
    socket.leave(roomId);
    console.log(`用户 ${socket.data.username} 离开房间 ${roomId}`);
  });
}
