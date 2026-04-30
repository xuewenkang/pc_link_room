import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './config/database.js';
import { setupConnectionHandlers } from './socket/connection.js';
import { setupChatHandlers } from './socket/chat.js';
import { setupGameHandlers } from './socket/games.js';

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

  socket.on('disconnect', () => {
    console.log(`用户断开: ${socket.id}`);
  });
});

// 启动服务器
server.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════════════════╗
║                                                    ╔
║   🎊 欢乐聊天 - 局域网娱乐平台启动成功！           ║
║                                                    ║
║   ✅ 服务器运行中                                   ║
║   📡 本地访问: http://localhost:${PORT}            ║
║   🌐 局域网访问: http://<你的IP>:${PORT}          ║
║                                                    ║
╚══════════════════════════════════════════════════╝
  `);
});
