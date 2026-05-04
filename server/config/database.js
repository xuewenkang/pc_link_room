import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync, accessSync, constants } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 检测是否在 Render 环境
const isRender = process.env.RENDER_SERVICE_ID || process.env.RENDER === 'true';

// 数据目录配置
let dataDir;
if (isRender) {
  // Render 环境：使用项目目录的相对路径
  dataDir = path.join(__dirname, '../../data');
  console.log('🚀 检测到 Render 环境，使用相对路径存储');
} else {
  // 本地环境：使用本地数据目录
  dataDir = path.join(__dirname, '../data');
  console.log('📁 使用本地数据目录');
}

// 确保数据目录存在
if (!existsSync(dataDir)) {
  try {
    mkdirSync(dataDir, { recursive: true });
    console.log('✅ 数据目录创建成功:', dataDir);
  } catch (error) {
    console.error('❌ 创建数据目录失败:', error.message);
    console.error('💡 提示：请检查目录权限或手动创建目录');
    throw new Error(`无法创建数据目录: ${dataDir}`);
  }
}

const dbPath = path.join(dataDir, 'chat.db');

// 打印数据库路径用于调试
console.log('📁 数据库路径:', dbPath);
let db;

export function initDatabase() {
  db = new Database(dbPath);

  // 启用外键约束
  db.pragma('foreign_keys = ON');

  // 创建用户表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      avatar TEXT DEFAULT '😊',
      avatarId TEXT DEFAULT 'bear',
      online INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 检查并是否需要添加avatarId列
  try {
    const columns = db.prepare("PRAGMA table_info(users)").all();
    const hasAvatarId = columns.some(col => col.name === 'avatarId');
    if (!hasAvatarId) {
      db.exec("ALTER TABLE users ADD COLUMN avatarId TEXT DEFAULT 'bear'");
      console.log('已添加avatarId列到users表');
    }
  } catch (error) {
    console.log('检查avatarId列失败:', error.message);
  }

  // 创建消息表
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      room_id TEXT DEFAULT 'general',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // 创建绘画游戏表（你画我们猜）
  db.exec(`
    CREATE TABLE IF NOT EXISTS drawings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      drawing_data TEXT NOT NULL,
      word TEXT NOT NULL,
      is_guessed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // 创建抢答游戏表
  db.exec(`
    CREATE TABLE IF NOT EXISTS quiz_games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id TEXT NOT NULL,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      winner_id INTEGER,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (winner_id) REFERENCES users(id)
    )
  `);

  // 创建文字接龙表
  db.exec(`
    CREATE TABLE IF NOT EXISTS word_chain_games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id TEXT NOT NULL,
      word TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  console.log('✅ 数据库初始化完成');
}

// 用户相关操作
export const userOps = {
  create: (username, avatar, avatarId = 'bear') => {
    const stmt = db.prepare('INSERT INTO users (username, avatar, avatarId) VALUES (?, ?, ?)');
    return stmt.run(username, avatar, avatarId);
  },
  findByUsername: (username) => {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    return stmt.get(username);
  },
  updateOnlineStatus: (userId, online) => {
    const stmt = db.prepare('UPDATE users SET online = ? WHERE id = ?');
    return stmt.run(online, userId);
  },
  getAllOnline: () => {
    const stmt = db.prepare('SELECT * FROM users WHERE online = 1');
    return stmt.all();
  },
  setAllOffline: () => {
    const stmt = db.prepare('UPDATE users SET online = 0');
    return stmt.run();
  }
};

// 消息相关操作
export const messageOps = {
  create: (userId, content, roomId = 'general') => {
    const stmt = db.prepare('INSERT INTO messages (user_id, content, room_id) VALUES (?, ?, ?)');
    return stmt.run(userId, content, roomId);
  },
  getHistory: (roomId = 'general', limit = 50, offset = 0) => {
    const stmt = db.prepare(`
      SELECT m.*, u.username, u.avatar, u.avatarId
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.room_id = ?
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `);
    return stmt.all(roomId, limit, offset).reverse();
  },
  // 获取总消息数量（用于分页计算）
  getCount: (roomId = 'general') => {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM messages WHERE room_id = ?');
    return stmt.get(roomId).count;
  },
  getWithUser: (messageId) => {
    const stmt = db.prepare(`
      SELECT m.*, u.username, u.avatar, u.avatarId
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.id = ?
    `);
    return stmt.get(messageId);
  }
};

export function getDb() {
  return db;
}
