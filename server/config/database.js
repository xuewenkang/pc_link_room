import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 加载环境变量
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { Pool } = pg;

// 从环境变量获取数据库连接字符串
const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!DATABASE_URL) {
  console.error('❌ 错误: 未找到 DATABASE_URL 环境变量');
  console.error('💡 请设置 DATABASE_URL (PostgreSQL 连接字符串)');
  throw new Error('缺少数据库连接字符串');
}

// 创建连接池
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Neon/Render 等云数据库需要
  }
});

let poolConnected = false;

export async function initDatabase() {
  try {
    // 测试连接
    const client = await pool.connect();
    console.log('✅ 数据库连接成功');
    client.release();

    // 创建用户表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        avatar TEXT DEFAULT '😊',
        avatarId TEXT DEFAULT 'bear',
        online INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 检查并添加 avatarId 列（如果不存在）
    try {
      const columnResult = await pool.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'avatarid'
      `);
      if (columnResult.rows.length === 0) {
        await pool.query("ALTER TABLE users ADD COLUMN avatarId TEXT DEFAULT 'bear'");
        console.log('已添加 avatarId 列到 users 表');
      }
    } catch (error) {
      console.log('检查 avatarId 列失败:', error.message);
    }

    // 创建消息表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        room_id TEXT DEFAULT 'general',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // 创建绘画游戏表（你画我们猜）
    await pool.query(`
      CREATE TABLE IF NOT EXISTS drawings (
        id SERIAL PRIMARY KEY,
        room_id TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        drawing_data TEXT NOT NULL,
        word TEXT NOT NULL,
        is_guessed INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // 创建抢答游戏表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS quiz_games (
        id SERIAL PRIMARY KEY,
        room_id TEXT NOT NULL,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        winner_id INTEGER,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (winner_id) REFERENCES users(id)
      )
    `);

    // 创建文字接龙表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS word_chain_games (
        id SERIAL PRIMARY KEY,
        room_id TEXT NOT NULL,
        word TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    poolConnected = true;
    console.log('✅ 数据库表初始化完成');
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message);
    throw error;
  }
}

// 用户相关操作
export const userOps = {
  create: async (username, avatar, avatarId = 'bear') => {
    const result = await pool.query(
      'INSERT INTO users (username, avatar, avatarId) VALUES ($1, $2, $3) RETURNING *',
      [username, avatar, avatarId]
    );
    return result.rows[0];
  },

  findByUsername: async (username) => {
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    return result.rows[0];
  },

  updateOnlineStatus: async (userId, online) => {
    const result = await pool.query(
      'UPDATE users SET online = $1 WHERE id = $2 RETURNING *',
      [online, userId]
    );
    return result.rows[0];
  },

  getAllOnline: async () => {
    const result = await pool.query('SELECT * FROM users WHERE online = 1');
    return result.rows;
  },

  setAllOffline: async () => {
    await pool.query('UPDATE users SET online = 0');
    return { rowCount: 0 };
  },

  findById: async (userId) => {
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );
    return result.rows[0];
  }
};

// 消息相关操作
export const messageOps = {
  create: async (userId, content, roomId = 'general') => {
    const result = await pool.query(
      'INSERT INTO messages (user_id, content, room_id) VALUES ($1, $2, $3) RETURNING *',
      [userId, content, roomId]
    );
    return result.rows[0];
  },

  getHistory: async (roomId = 'general', limit = 50, offset = 0) => {
    const result = await pool.query(
      `
      SELECT m.*, u.username, u.avatar, u.avatarId
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.room_id = $1
      ORDER BY m.created_at DESC
      LIMIT $2 OFFSET $3
      `,
      [roomId, limit, offset]
    );
    return result.rows.reverse();
  },

  // 获取总消息数量（用于分页计算）
  getCount: async (roomId = 'general') => {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM messages WHERE room_id = $1',
      [roomId]
    );
    return parseInt(result.rows[0].count);
  },

  getWithUser: async (messageId) => {
    const result = await pool.query(
      `
      SELECT m.*, u.username, u.avatar, u.avatarId
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.id = $1
      `,
      [messageId]
    );
    return result.rows[0];
  }
};

// 绘画游戏相关操作
export const drawingOps = {
  create: async (roomId, userId, drawingData, word) => {
    const result = await pool.query(
      'INSERT INTO drawings (room_id, user_id, drawing_data, word) VALUES ($1, $2, $3, $4) RETURNING *',
      [roomId, userId, drawingData, word]
    );
    return result.rows[0];
  },

  getByRoom: async (roomId) => {
    const result = await pool.query(
      'SELECT * FROM drawings WHERE room_id = $1 AND is_guessed = 0 ORDER BY created_at DESC LIMIT 1',
      [roomId]
    );
    return result.rows[0];
  },

  markAsGuessed: async (drawingId) => {
    await pool.query(
      'UPDATE drawings SET is_guessed = 1 WHERE id = $1',
      [drawingId]
    );
  }
};

// 抢答游戏相关操作
export const quizOps = {
  create: async (roomId, question, answer) => {
    const result = await pool.query(
      'INSERT INTO quiz_games (room_id, question, answer) VALUES ($1, $2, $3) RETURNING *',
      [roomId, question, answer]
    );
    return result.rows[0];
  },

  getActive: async (roomId) => {
    const result = await pool.query(
      "SELECT * FROM quiz_games WHERE room_id = $1 AND status = 'active' ORDER BY created_at DESC LIMIT 1",
      [roomId]
    );
    return result.rows[0];
  },

  setWinner: async (gameId, winnerId) => {
    await pool.query(
      "UPDATE quiz_games SET winner_id = $1, status = 'completed' WHERE id = $2",
      [winnerId, gameId]
    );
  }
};

// 文字接龙相关操作
export const wordChainOps = {
  create: async (roomId, word, userId) => {
    const result = await pool.query(
      'INSERT INTO word_chain_games (room_id, word, user_id) VALUES ($1, $2, $3) RETURNING *',
      [roomId, word, userId]
    );
    return result.rows[0];
  },

  getHistory: async (roomId, limit = 10) => {
    const result = await pool.query(
      `
      SELECT w.*, u.username
      FROM word_chain_games w
      JOIN users u ON w.user_id = u.id
      WHERE w.room_id = $1
      ORDER BY w.created_at DESC
      LIMIT $2
      `,
      [roomId, limit]
    );
    return result.rows;
  }
};

// 获取数据库连接池
export function getPool() {
  return pool;
}

// 关闭数据库连接（用于优雅关闭）
export async function closeDatabase() {
  await pool.end();
  console.log('📊 数据库连接已关闭');
}
