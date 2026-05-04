import { userOps, getPool } from '../config/database.js';

// 存储在线用户信息：socket.id -> user
const onlineUsers = new Map();

export function setupConnectionHandlers(io, socket) {
  // 用户登录
  socket.on('login', async ({ username, avatar, avatarId }) => {
    if (!username || username.trim().length === 0) {
      socket.emit('login:error', '用户名不能为空');
      return;
    }

    try {
      // 查找或创建用户
      let user = await userOps.findByUsername(username);

      if (!user) {
        // 新用户
        user = await userOps.create(username, avatar || '😊', avatarId || 'bear');
      } else {
        // 检查是否有其他在线用户使用相同名字（防止重复登录不同账号）
        const allOnline = await userOps.getAllOnline();
        const sameNameOnline = allOnline.find(u => u.username === username && u.id !== user.id);
        if (sameNameOnline) {
          socket.emit('login:error', `用户名 "${username}" 已被其他用户使用`);
          return;
        }
        // 更新现有用户的头像
        if (avatar && avatarId) {
          const pool = getPool();
          await pool.query(
            'UPDATE users SET avatar = $1, avatarId = $2 WHERE id = $3',
            [avatar, avatarId, user.id]
          );
          user.avatar = avatar;
          user.avatarId = avatarId;
        }
      }

      // 更新在线状态
      await userOps.updateOnlineStatus(user.id, 1);

      // 存储用户和socket的关联
      onlineUsers.set(socket.id, user);
      socket.data.userId = user.id;
      socket.data.username = user.username;
      socket.data.avatar = user.avatar;
      socket.data.avatarId = user.avatarId;

      // 获取所有在线用户
      const allOnlineUsers = await userOps.getAllOnline();

      // 将用户加入以其自身ID为名的私聊房间（这样任何人给他发私聊都能收到）
      socket.join(user.id.toString());

      // 通知客户端登录成功
      socket.emit('login:success', user);

      // 广播用户加入
      io.emit('user:join', { user, onlineCount: allOnlineUsers.length });
      io.emit('user:list', allOnlineUsers);

      console.log(`用户 ${username} 登录成功`);
    } catch (error) {
      console.error('登录错误:', error);
      socket.emit('login:error', '登录失败，请重试');
    }
  });

  // 更新个人资料
  socket.on('profile:update', async ({ username, avatar, avatarId }) => {
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

    try {
      // 检查新名字是否被其他用户占用
      const existingUser = await userOps.findByUsername(trimmedName);
      if (existingUser && existingUser.id !== currentUser.id) {
        socket.emit('profile:error', `昵称 "${trimmedName}" 已被使用`);
        return;
      }

      // 更新数据库
      const pool = getPool();
      await pool.query(
        'UPDATE users SET username = $1, avatar = $2, avatarId = $3 WHERE id = $4',
        [trimmedName, avatar, avatarId, currentUser.id]
      );

      // 更新内存中的用户信息
      currentUser.username = trimmedName;
      currentUser.avatar = avatar;
      currentUser.avatarId = avatarId;

      // 同步到socket.data
      socket.data.username = trimmedName;
      socket.data.avatar = avatar;
      socket.data.avatarId = avatarId;

      // 广播用户列表更新
      const allOnlineUsers = await userOps.getAllOnline();
      io.emit('user:list', allOnlineUsers);

      // 通知客户端更新成功
      socket.emit('profile:success', { ...currentUser });

      console.log(`用户 ${currentUser.id} 更新资料: ${trimmedName}`);
    } catch (error) {
      console.error('更新资料错误:', error);
      socket.emit('profile:error', '更新失败，请重试');
    }
  });

  // 处和其他模块使用）
  socket.on('disconnect', async () => {
    const user = onlineUsers.get(socket.id);
    if (user) {
      console.log(`用户断开: ${user.username} (${socket.id})`);

      try {
        // 更新在线状态
        await userOps.updateOnlineStatus(user.id, 0);

        // 从在线列表中移除
        onlineUsers.delete(socket.id);

        // 获取更新后的在线用户列表
        const allOnlineUsers = await userOps.getAllOnline();

        // 广播用户离开
        io.emit('user:leave', { userId: user.id, onlineCount: allOnlineUsers.length });
        io.emit('user:list', allOnlineUsers);
      } catch (error) {
        console.error('断开连接错误:', error);
      }
    }
  });

  socket.on('user:get_list', async () => {
    try {
      const allOnlineUsers = await userOps.getAllOnline();
      socket.emit('user:list', allOnlineUsers);
    } catch (error) {
      console.error('获取用户列表错误:', error);
    }
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
