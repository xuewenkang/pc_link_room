import { userOps, getDb } from '../config/database.js';

// 存储在线用户信息：socket.id -> user
const onlineUsers = new Map();

export function setupConnectionHandlers(io, socket) {
  // 用户登录
  socket.on('login', ({ username, avatar, avatarId }) => {
    if (!username || username.trim().length === 0) {
      socket.emit('login:error', '用户名不能为空');
      return;
    }

    // 查找或创建用户
    let user = userOps.findByUsername(username);

    if (!user) {
      // 新用户
      userOps.create(username, avatar || '😊', avatarId || 'bear');
      user = userOps.findByUsername(username);
    } else {
      // 检查是否有其他在线用户使用相同名字（防止重复登录不同账号）
      const allOnline = userOps.getAllOnline();
      const sameNameOnline = allOnline.find(u => u.username === username && u.id !== user.id);
      if (sameNameOnline) {
        socket.emit('login:error', `用户名 "${username}" 已被其他用户使用`);
        return;
      }
      // 更新现有用户的头像
      if (avatar && avatarId) {
        const db = getDb();
        const stmt = db.prepare('UPDATE users SET avatar = ?, avatarId = ? WHERE id = ?');
        stmt.run(avatar, avatarId, user.id);
        user.avatar = avatar;
        user.avatarId = avatarId;
      }
    }

    // 更新在线状态
    userOps.updateOnlineStatus(user.id, 1);

    // 存储用户和socket的关联
    onlineUsers.set(socket.id, user);
    socket.data.userId = user.id;
    socket.data.username = user.username;
    socket.data.avatar = user.avatar;
    socket.data.avatarId = user.avatarId;

    // 获取所有在线用户
    const allOnlineUsers = userOps.getAllOnline();

    // 通知客户端登录成功
    socket.emit('login:success', user);

    // 广播用户加入
    io.emit('user:join', { user, onlineCount: allOnlineUsers.length });
    io.emit('user:list', allOnlineUsers);

    console.log(`用户 ${username} 登录成功`);
  });

  // 更新个人资料
  socket.on('profile:update', ({ username, avatar, avatarId }) => {
    const currentUser = onlineUsers.get(socket.id);
    if (!currentUser) {
      socket.emit('profile:error', '未登录');
      return;
    }

    if (!username || username.trim().length === 0) {
      socket.emit('profile:error', '昵称不能为空');
      return;
    }

    const trimmedName = username.trim();

    // 检查新名字是否被其他用户占用
    const existingUser = userOps.findByUsername(trimmedName);
    if (existingUser && existingUser.id !== currentUser.id) {
      socket.emit('profile:error', `昵称 "${trimmedName}" 已被使用`);
      return;
    }

    // 更新数据库
    const db = getDb();
    db.prepare('UPDATE users SET username = ?, avatar = ?, avatarId = ? WHERE id = ?')
      .run(trimmedName, avatar, avatarId, currentUser.id);

    // 更新内存中的用户信息
    currentUser.username = trimmedName;
    currentUser.avatar = avatar;
    currentUser.avatarId = avatarId;

    // 同步到socket.data
    socket.data.username = trimmedName;
    socket.data.avatar = avatar;
    socket.data.avatarId = avatarId;

    // 广播用户列表更新
    const allOnlineUsers = userOps.getAllOnline();
    io.emit('user:list', allOnlineUsers);

    // 通知客户端更新成功
    socket.emit('profile:success', { ...currentUser });

    console.log(`用户 ${currentUser.id} 更新资料: ${trimmedName}`);
  });

  // 处理断开连接
  socket.on('disconnect', () => {
    const user = onlineUsers.get(socket.id);
    if (user) {
      console.log(`用户断开: ${user.username} (${socket.id})`);
      
      // 更新在线状态
      userOps.updateOnlineStatus(user.id, 0);
      
      // 从在线列表中移除
      onlineUsers.delete(socket.id);
      
      // 获取更新后的在线用户列表
      const allOnlineUsers = userOps.getAllOnline();
      
      // 广播用户离开
      io.emit('user:leave', { userId: user.id, onlineCount: allOnlineUsers.length });
      io.emit('user:list', allOnlineUsers);
    }
  });

  socket.on('user:get_list', () => {
    const allOnlineUsers = userOps.getAllOnline();
    socket.emit('user:list', allOnlineUsers);
  });
}

// 获取在线用户列表（供其他模块使用）
export function getOnlineUsers() {
  return Array.from(onlineUsers.values());
}

// 通过userId查找socket（供其他模块使用）
export function getSocketByUserId(userId) {
  for (const [socketId, user] of onlineUsers) {
    if (user.id === userId) {
      return { socketId, user };
    }
  }
  return null;
}

export { onlineUsers };
