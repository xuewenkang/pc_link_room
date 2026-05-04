import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import forge from 'node-forge';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
const envPath = path.resolve(__dirname, '../.env');
console.log('加载环境变量，，路径:', envPath);
const result = dotenv.config({ path: envPath });
if (result.error) {
  console.warn('⚠️ 警告: 无法加载 .env 文件:', result.error.message);
} else {
  console.log('✅ 环境变量已加载');
}

import { initDatabase } from './config/database.js';
import { setupConnectionHandlers } from './socket/connection.js';
import { setupChatHandlers } from './socket/chat.js';
import { setupGameHandlers } from './socket/games.js';
import { setupVideoHandlers, cleanupVideoUser } from './socket/video.js';

const app = express();

// 检测是否在 Render 环境
const isRender = process.env.RENDER === 'true' || process.env.RENDER_EXTERNAL_URL;

let server;

if (isRender) {
  // Render 环境：使用 HTTP（Render 反向代理处理 SSL）
  server = http.createServer(app);
  console.log('🚀 检测到 Render 环境，使用 HTTP 模式');
} else {
  // 本地环境：使用 HTTPS（自签名证书）
  function generateSelfSignedCert() {
    const keys = forge.pki.rsa.generateKeyPair(2048);

    const cert = forge.pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = '01';
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

    const attrs = [
      { name: 'commonName', value: 'localhost' },
      { name: 'countryName', value: 'CN' },
      { name: 'stateOrProvinceName', value: 'Beijing' },
      { name: 'localityName', value: 'Beijing' },
      { name: 'organizationName', value: 'Link Room' }
    ];

    cert.setSubject(attrs);
    cert.setIssuer(attrs);
    cert.sign(keys.privateKey);

    return {
      key: forge.pki.privateKeyToPem(keys.privateKey),
      cert: forge.pki.certificateToPem(cert)
    };
  }

  const https = await import('https');
  const { key: privateKey, cert: certificate } = generateSelfSignedCert();
  server = https.createServer({ key: privateKey, cert: certificate }, app);
  console.log('🔒 本地环境，使用 HTTPS 模式');
}

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || (isRender ? 10000 : 443);

// 初始化数据库（异步）
(async () => {
  try {
    await initDatabase();
    const { userOps } = await import('./config/database.js');
    await userOps.setAllOffline();
  } catch (error) {
    console.error('数据库初始化失败:', error);
    process.exit(1);
  }
})();

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
  if (isRender) {
    console.log(`
╔════════════════════════════════════════════════════╗
║                                                    ║
║   🎊 link启动成功！           ║
║                                                    ║
║   ✅ Render 环境运行中（自动 HTTPS）              ║
║   🌐 访问地址: ${process.env.RENDER_EXTERNAL_URL || 'https://your-app.onrender.com'}
║                                                    ║
╚════════════════════════════════════════════════╝
    `);
  } else {
    console.log(`
╔════════════════════════════════════════════════════╗
║                                                    ║
║   🎊 link启动成功！           ║
║                                                    ║
║   ✅ 服务器运行中（HTTPS 模式）                     ║
║║   📡 本地访问: https://localhost:${PORT}
║   🌐 局域网访问: https://<你的IP>:${PORT}
║                                                    ║
║   ⚠️  首次访问时需要浏览器信任自签名证书            ║
║   👉 点击"高级" → "继续访问"                        ║
║                                                    ║
╚════════════════════════════════════════════════╝
    `);
  }
});
