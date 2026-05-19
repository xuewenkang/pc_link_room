// 视频通话信令处理（WebRTC Signaling）
// 使用 Mesh P2P 拓扑：每个用户与房间内其他每个用户建立直连

import { onlineUsers } from './connection.js';

// 存储正在参与视频的用户 { socketId: { userId, username, avatarId } }
const videoParticipants = new Map();

export function setupVideoHandlers(io, socket) {
  // 加入视频通话
  socket.on('video:join', () => {
    const user = onlineUsers.get(socket.id);
    if (!user) return;

    if (videoParticipants.has(socket.id)) {
      videoParticipants.delete(socket.id);
      socket.leave('video-room');
      socket.to('video-room').emit('video:user-left', {
        userId: user.id,
        socketId: socket.id
      });
    }

    for (const [sid] of videoParticipants) {
      if (!io.sockets.sockets.has(sid)) {
        videoParticipants.delete(sid);
      }
    }

    // 先记录参与者信息（必须在发送 room-info 之前，否则新用户收不到已加入的用户）
    videoParticipants.set(socket.id, {
      userId: user.id,
      username: user.username,
      avatarId: user.avatarId,
      socketId: socket.id
    });

    // 将用户加入视频房间
    socket.join('video-room');

    // 告诉新用户当前已在视频中的所有用户（不包括自己）
    const existingParticipants = [];
    for (const [sid, info] of videoParticipants) {
      if (sid !== socket.id) {
        existingParticipants.push(info);
      }
    }
    socket.emit('video:room-info', {
      participants: existingParticipants
    });

    // 通知房间内其他人：有新用户加入视频
    socket.to('video-room').emit('video:user-joined', {
      userId: user.id,
      username: user.username,
      avatarId: user.avatarId,
      socketId: socket.id
    });

    console.log(`${user.username} 加入了视频通话 (共 ${videoParticipants.size} 人)`);
  });

  // 离开视频通话
  socket.on('video:leave', () => {
    const user = onlineUsers.get(socket.id);
    socket.leave('video-room');

    if (videoParticipants.has(socket.id)) {
      const info = videoParticipants.get(socket.id);
      videoParticipants.delete(socket.id);

      // 通知所有人该用户离开
      io.to('video-room').emit('video:user-left', {
        userId: info.userId,
        socketId: socket.id
      });

      console.log(`${info?.username || user?.username || '某用户'} 离开了视频通话`);
    }
  });

  // 发送 SDP Offer
  socket.on('video:offer', ({ targetSocketId, sdp }) => {
    const user = onlineUsers.get(socket.id);
    io.to(targetSocketId).emit('video:offer', {
      fromSocketId: socket.id,
      fromUserId: user?.id,
      fromUsername: user?.username,
      fromAvatarId: user?.avatarId,
      sdp
    });
  });

  // 发送 SDP Answer
  socket.on('video:answer', ({ targetSocketId, sdp }) => {
    io.to(targetSocketId).emit('video:answer', {
      fromSocketId: socket.id,
      sdp
    });
  });

  // 交换 ICE Candidate
  socket.on('video:ice-candidate', ({ targetSocketId, candidate }) => {
    io.to(targetSocketId).emit('video:ice-candidate', {
      fromSocketId: socket.id,
      candidate
    });
  });
}

// 获取当前视频参与者数量
export function getVideoParticipantCount() {
  return videoParticipants.size;
}

// 用户断开时清理
export function cleanupVideoUser(socketId) {
  if (videoParticipants.has(socketId)) {
    const info = videoParticipants.get(socketId);
    videoParticipants.delete(socketId);
    return info;
  }
  return null;
}
