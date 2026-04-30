# 🎊 欢乐聊天 - 局域网娱乐平台

一个基于React、Node.js和Socket.io的实时局域网聊天应用，支持多人`游戏和娱乐互动。

## ✨ 功能特性

- 💬 实时聊天室
  - 多用户实时通讯
  - 消息历史记录
  - 输入状态提示
  - 表情快捷键

- 🎮 多人小游戏
  - 你画我们猜（开发中）
  - 实时抢答（开发中）
  - 文字接龙（开发中）
  - 猜数字
  - 掷骰子
  - 石头剪刀布
  - 翻牌子

- 📺 娱乐厅
  - 音乐分享
  - 照片墙
  - 在线投票
  - 待办清单

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 启动应用

同时启动前端和后端：

```bash
npm start
```

或者分别启动：

```bash
# 启动后端服务器
npm run server

# 启动前端开发服务器
npm run dev
```

### 局域网访问

1. 查看本机IP地址
   - Windows: 在命令行运行 `ipconfig`
   - Mac/Linux: 在终端运行 `ifconfig` 或 `ip addr`

2. 在同一局域网内的其他设备浏览器中输入：
   ```
   http://<你的IP>:3000
   ```

例如，如果本机IP是 `192.168.1.100`，访问地址为：
```
http://192.168.1.100:3000
```

## 📁 项目结构

```
DoorIndustryWebsite/
├── server/                    # 后端代码
│   ├── index.js              # 服务器入口
│   ├── config/
│   │   └── database.js       # 数据库配置
│   └── socket/               # Socket.io事件处理
│       ├── connection.js     # 连接管理
│       ├── chat.js           # 聊天事件
│       └── games.js          # 游戏事件
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── App.css
│   ├── components/
│   │   ├── Login.jsx        # 登录界面
│   │   ├── Sidebar.jsx      # 侧边栏
│   │   ├── ChatRoom.jsx     # 聊天室
│   │   └── ...
│   ├── games/
│   │   └── GamesView.jsx    # 游戏大厅
│   └── hooks/
│       └── useSocket.js      # Socket.io钩子
├── data/                     # SQLite数据库文件
│   └── chat.db
└── package.json
```

## 🔧 技术栈

### 后端
- **Node.js** - JavaScript运行时
- **Express** - Web框架
- **Socket.io** - 实时通信
- **better-sqlite3** - SQLite数据库

### 前端
- **React** - UI框架
- **Vite** - 构建工具
- **Socket.io-client** - WebSocket客户端

## 📊 数据存储

应用使用SQLite数据库存储以下数据：

- 用户信息（用户名、头像、在线状态）
- 聊天消息（内容、发送者、时间戳）
- 游戏数据（绘画、抢答、接龙等）

数据存储在 `data/chat.db` 文件中。

## 🎯 Socket.io事件协议

### 连接事件
- `login` - 用户登录
- `login:success` - 登录成功
- `login:error` - 登录失败
- `user:join` - 用户加入
- `user:leave` - 用户离开
- `user:list` - 用户列表

### 聊天事件
- `message:send` - 发送消息
- `message:new` - 新消息
- `message:history` - 消息历史
- `typing:start` - 开始输入
- `typing:stop` - 停止输入

### 游戏事件（你画我们猜）
- `pictionary:create` - 创建游戏
- `pictionary:join` - 加入游戏
- `pictionary:start` - 开始游戏
- `pictionary:draw` - 绘画数据
- `pictionary:guess` - 猜词
- `pictionary:guess:correct` - 猜对
- `pictionary:guess:wrong` - 猜错

### 游戏事件（抢答）
- `quiz:create` - 创建抢答
- `quiz:start` - 开始抢答
- `quiz:answer` - 抢答
- `quiz:first` - 第一名抢答
- `quiz:result` - 抢答结果

### 游戏事件（文字接龙）
- `wordchain:create` - 创建接龙
- `wordchain:start` - 开始接龙
- `wordchain:submit` - 提交接龙词
- `wordchain:valid` - 词语有效
- `wordchain:invalid` - 词语无效

## 🛠️ 开发指南

### 添加新的Socket事件

**后端 (server/socket/games.js):**
```javascript
socket.on('custom:event', (data) => {
  // 处理逻辑
  io.emit('custom:response', responseData);
});
```

**前端 (src/hooks/useSocket.js):**
```javascript
const { on } = useSocket();
on('custom:response', (data) => {
  // 处理响应
});
```

### 添加新的游戏

1. 在 `src/games/` 创建新游戏组件
2. 在 `server/socket/games.js` 添加游戏逻辑
3. 在 `src/games/GamesView.jsx` 添加游戏入口

## 📝 注意事项

1. **防火墙设置**: 确保防火墙允许端口3000的连接
2. **网络环境**: 所有设备需要在同一局域网内
3. **数据备份**: 定期备份 `data/chat.db` 文件

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📄 许可证

MIT

## 📞 联系方式

如有问题，欢迎提出Issue。
