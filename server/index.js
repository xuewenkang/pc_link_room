import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './config/database.js';
import { setupConnectionHandlers } from './socket/connection.js';
import { setupChatHandlers } from './socket/chat.js';
import { setupGameHandlers } from './socket/games.js';
import { setupVideoHandlers, cleanupVideoUser } from './socket/video.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;

// 初始化数据库
initDatabase();
import { userOps } from './config/database.js';
userOps.setAllOffline();

// 静态文件服务
app.use(express.static(path.join(__dirname, '../dist')));

// Socket.io 连接处理
io.on('connection', (socket) => {
  console.log(`用户连接: ${socket.id}`);

  // 设置各个功能的 Socket 处理器
  setupConnectionHandlers(io, socket);
  setupChatHandlers(io, socket);
  setupGameHandlers(io, socket);
  setupVideoHandlers(io, socket);

  socket.on('disconnect', () => {
    console.log(`用户断开: ${socket.id}`);
    // 清理视频通话
    const videoInfo = cleanupVideoUser(socket.id);
    if (videoInfo) {
      io.to('video-room').emit('video:user-left', {
        userId: videoInfo.userId,
        socketId: socket.id
      });
    }
  });
});

// 启动服务器
server.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════════════════╗
║                                                    ║
║   🎊 link启动成功！           ║
║                                                    ║
║   ✅ 服务器运行中（HTTP 模式）                      ║
║   📡 本地访问: http://localhost:${PORT}
║   🌐 局域网访问: http://<你的IP>:${PORT}
║                                                    ║
║   💡 摄像头功能需要 HTTPS，请用以下方式启动浏览器:
║   chrome.exe --unsafely-treat-insecure-origin-as-secure=http://<你的IP>:${PORT} --user-data-dir="C:\\chrome-dev"
║                                                    ║
╚════════════════════════════════════════════════╝
  `);
});
