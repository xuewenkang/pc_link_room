import { getOnlineUsers, getSocketByUserId } from './connection.js';

// 游戏状态存储
const pictionaryGames = new Map(); // 你画我们猜游戏
const quizGames = new Map();      // 抢答游戏
const wordChainGames = new Map(); // 文字接龙游戏

// 你画我们猜词库
const PictionaryWords = [
  '苹果', '香蕉', '橙子', '西瓜', '葡萄',
  '猫', '狗', '兔子', '老虎', '大象',
  '房子', '汽车', '飞机', '轮船', '自行车',
  '太阳', '月亮', '星星', '彩虹', '云朵',
  '树', '花', '草', '山', '河',
  '书', '笔', '杯子', '桌子', '椅子',
  '电视', '电脑', '手机', '相机', '收音机',
  '足球', '篮球', '网球', '乒乓球', '羽毛球',
  '眼镜', '手表', '项链', '戒指', '耳环',
  '汉堡', '披萨', '面条', '饺子', '米饭'
];

export function setupGameHandlers(io, socket) {
  // ========== 你画我们猜游戏 ==========

  // 创建游戏房间
  socket.on('pictionary:create', ({ roomId, rounds = 5, timeLimit = 60 }) => {
    if (pictionaryGames.has(roomId)) {
      socket.emit('pictionary:error', { message: '房间已存在' });
      return;
    }

    const userId = socket.data.userId;
    const game = {
      roomId,
      creator: userId,
      players: [{ userId, username: socket.data.username, avatar: socket.data.avatar, score: 0 }],
      currentRound: 0,
      totalRounds: rounds,
      timeLimit,
      status: 'waiting', // waiting, drawing, guessing, ended
      currentDrawer: null,
      currentWord: null,
      canvasData: null,
      timer: null,
      guesses: []
    };

    pictionaryGames.set(roomId, game);
    socket.join(`pictionary:${roomId}`);

    socket.emit('pictionary:created', { game });
    io.to(`pictionary:${roomId}`).emit('pictionary:status', game);
  });

  // 加入游戏房间
  socket.on('pictionary:join', ({ roomId }) => {
    const game = pictionaryGames.get(roomId);
    if (!game) {
      socket.emit('pictionary:error', { message: '房间不存在' });
      return;
    }

    const userId = socket.data.userId;
    if (game.players.find(p => p.userId === userId)) {
      return; // 已在房间中
    }

    game.players.push({
      userId,
      username: socket.data.username,
      avatar: socket.data.avatar,
      score: 0
    });

    socket.join(`pictionary:${roomId}`);
    io.to(`pictionary:${roomId}`).emit('pictionary:player_joined', { player: game.players[game.players.length - 1] });
    io.to(`pictionary:${roomId}`).emit('pictionary:status', game);
  });

  // 开始游戏
  socket.on('pictionary:start', ({ roomId }) => {
    const game = pictionaryGames.get(roomId);
    if (!game || game.creator !== socket.data.userId) {
      socket.emit('pictionary:error', { message: '只有创建者可以开始游戏' });
      return;
    }

    startPictionaryRound(io, game);
  });

  // 绘画数据同步
  socket.on('pictionary:draw', ({ roomId, drawingData }) => {
    const game = pictionaryGames.get(roomId);
    if (!game) return;

    if (game.currentDrawer === socket.data.userId && game.status === 'drawing') {
      game.canvasData = drawingData;
      socket.to(`pictionary:${roomId}`).emit('pictionary:draw', { drawingData });
    }
  });

  // 猜词
  socket.on('pictionary:guess', ({ roomId, guess }) => {
    const game = pictionaryGames.get(roomId);
    if (!game || game.status !== 'guessing') return;

    const userId = socket.data.userId;
    if (userId === game.currentDrawer) return; // 绘画者不能猜词

    const player = game.players.find(p => p.userId === userId);
    if (!player) return;

    if (guess.toLowerCase() === game.currentWord.toLowerCase()) {
      // 猜对了
      player.score += Math.max(10 - game.guesses.length, 5); // 根据猜对顺序加分

      io.to(`pictionary:${roomId}`).emit('pictionary:guess:correct', {
        username: player.username,
        word: game.currentWord,
        score: player.score
      });

      // 清除计时器
      if (game.timer) {
        clearTimeout(game.timer);
        game.timer = null;
      }

      // 开始下一轮
      setTimeout(() => {
        startPictionaryRound(io, game);
      }, 3000);
    } else {
      // 猜错了
      game.guesses.push({ username: player.username, guess });
      socket.to(`pictionary:${roomId}`).emit('pictionary:guess:wrong', { username: player.username, guess });
      socket.emit('pictionary:guess:wrong', { username: player.username, guess });
    }
  });

  // ========== 实时抢答游戏 ==========

  // 创建抢答游戏
  socket.on('quiz:create', ({ roomId, question, answer, timeLimit = 30 }) => {
    if (quizGames.has(roomId)) {
      socket.emit('quiz:error', { message: '房间已存在' });
      return;
    }

    const game = {
      roomId,
      creator: socket.data.userId,
      question,
      answer: answer.toLowerCase(),
      timeLimit,
      status: 'waiting', // waiting, active, answered, ended
      firstAnswerer: null,
      timer: null
    };

    quizGames.set(roomId, game);
    socket.join(`quiz:${roomId}`);

    socket.emit('quiz:created', { game });
  });

  // 加入抢答游戏
  socket.on('quiz:join', ({ roomId }) => {
    const game = quizGames.get(roomId);
    if (!game) {
      socket.emit('quiz:error', { message: '房间不存在' });
      return;
    }

    socket.join(`quiz:${roomId}`);
  });

  // 开始抢答
  socket.on('quiz:start', ({ roomId }) => {
    const game = quizGames.get(roomId);
    if (!game || game.creator !== socket.data.userId) {
      socket.emit('quiz:error', { message: '只有创建者可以开始' });
      return;
    }

    game.status = 'active';
    game.firstAnswerer = null;
    game.timer = setTimeout(() => {
      // 超时
      game.status = 'ended';
      io.to(`quiz:${roomId}`).emit('quiz:timeout', { question: game.question, answer: game.answer });
    }, game.timeLimit * 1000);

    io.to(`quiz:${roomId}`).emit('quiz:started', { question: game.question, timeLimit: game.timeLimit });
  });

  // 抢答
  socket.on('quiz:answer', ({ roomId }) => {
    const game = quizGames.get(roomId);
    if (!game || game.status !== 'active') return;

    if (game.firstAnswerer !== null) return; // 已经有人抢答了

    game.firstAnswerer = socket.data.userId;
    game.status = 'answered';

    // 清除超时计时器
    if (game.timer) {
      clearTimeout(game.timer);
      game.timer = null;
    }

    io.to(`quiz:${roomId}`).emit('quiz:first_answer', {
      userId: game.firstAnswerer,
      username: socket.data.username
    });

    // 10秒后公布答案
    setTimeout(() => {
      game.status = 'ended';
      io.to(`quiz:${roomId}`).emit('quiz:result', {
        correct: false, // 需要提交答案来验证
        answer: game.answer
      });
    }, 10000);
  });

  // 提交答案
  socket.on('quiz:submit_answer', ({ roomId, answer }) => {
    const game = quizGames.get(roomId);
    if (!game || game.status !== 'answered') return;

    if (game.firstAnswerer !== socket.data.userId) {
      socket.emit('quiz:error', { message: '只有抢答者可以提交答案' });
      return;
    }

    const isCorrect = answer.toLowerCase() === game.answer;
    game.status = 'ended';

    io.to(`quiz:${roomId}`).emit('quiz:result', {
      isCorrect,
      username: socket.data.username,
      answer: game.answer
    });
  });

  // ========== 文字接龙游戏 ==========

  // 创建接龙游戏
  socket.on('wordchain:create', ({ roomId, mode = 'word' }) => {
    if (wordChainGames.has(roomId)) {
      socket.emit('wordchain:error', { message: '房间已存在' });
      return;
    }

    const game = {
      roomId,
      creator: socket.data.userId,
      mode, // 'word' 或 'idiom'
      status: 'waiting', // waiting, playing, ended
      currentWord: null,
      history: [],
      currentPlayerIndex: 0,
      players: [{ userId: socket.data.userId, username: socket.data.username, avatar: socket.data.avatar }],
      timer: null
    };

    wordChainGames.set(roomId, game);
    socket.join(`wordchain:${roomId}`);

    socket.emit('wordchain:created', { game });
  });

  // 加入接龙游戏
  socket.on('wordchain:join', ({ roomId }) => {
    const game = wordChainGames.get(roomId);
    if (!game) {
      socket.emit('wordchain:error', { message: '房间不存在' });
      return;
    }

    const userId = socket.data.userId;
    if (!game.players.find(p => p.userId === userId)) {
      game.players.push({
        userId,
        username: socket.data.username,
        avatar: socket.data.avatar
      });

      io.to(`wordchain:${roomId}`).emit('wordchain:player_joined', { username: socket.data.username });
    }

    socket.join(`wordchain:${roomId}`);
  });

  // 开始接龙
  socket.on('wordchain:start', ({ roomId, firstWord }) => {
    const game = wordChainGames.get(roomId);
    if (!game || game.creator !== socket.data.userId) {
      socket.emit('wordchain:error', { message: '只有创建者可以开始' });
      return;
    }

    game.status = 'playing';
    game.currentWord = firstWord;
    game.history.push({
      word: firstWord,
      username: socket.data.username,
      timestamp: Date.now()
    });

    // 设置当前玩家
    game.currentPlayerIndex = 0;

    io.to(`wordchain:${roomId}`).emit('wordchain:started', {
      currentWord: firstWord,
      currentPlayer: game.players[0],
      mode: game.mode
    });

    // 启动计时器（30秒）
    startWordChainTimer(io, game);
  });

  // 提交接龙词
  socket.on('wordchain:submit', ({ roomId, word }) => {
    const game = wordChainGames.get(roomId);
    if (!game || game.status !== 'playing') return;

    // 验证是否轮到当前玩家
    const currentPlayer = game.players[game.currentPlayerIndex];
    if (currentPlayer.userId !== socket.data.userId) {
      socket.emit('wordchain:error', { message: '还没轮到你' });
      return;
    }

    // 验证接龙规则
    const lastChar = game.currentWord.slice(-1);
    const firstChar = word.charAt(0);

    if (firstChar !== lastChar) {
      socket.emit('wordchain:invalid', { word, reason: '首字不匹配' });
      return;
    }

    // 检查是否已经使用过
    if (game.history.some(h => h.word === word)) {
      socket.emit('wordchain:invalid', { word, reason: '词语已使用过' });
      return;
    }

    // 如果是成语模式，这里可以添加成语验证逻辑
    // 暂时跳过成语验证

    // 接龙成功
    game.currentWord = word;
    game.history.push({
      word,
      username: socket.data.username,
      timestamp: Date.now()
    });

    // 切换到下一个玩家
    game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;

    // 清除并重新启动计时器
    if (game.timer) {
      clearTimeout(game.timer);
      game.timer = null;
    }

    io.to(`wordchain:${roomId}`).emit('wordchain:valid', {
      word,
      username: socket.data.username,
      nextPlayer: game.players[game.currentPlayerIndex]
    });

    startWordChainTimer(io, game);
  });
}

// 辅助函数：开始你画我们猜的一轮
function startPictionaryRound(io, game) {
  game.currentRound++;

  if (game.currentRound > game.totalRounds) {
    // 游戏结束
    game.status = 'ended';
    const winner = [...game.players].sort((a, b) => b.score - a.score)[0];
    io.to(`pictionary:${game.roomId}`).emit('pictionary:ended', { winner, players: game.players });
    return;
  }

  // 选择绘画者（轮换）
  const drawerIndex = (game.currentRound - 1) % game.players.length;
  game.currentDrawer = game.players[drawerIndex].userId;

  // 随机选择词语
  game.currentWord = PictionaryWords[Math.floor(Math.random() * PictionaryWords.length)];
  game.canvasData = null;
  game.guesses = [];

  // 先进入绘画阶段
  game.status = 'drawing';
  io.to(`pictionary:${game.roomId}`).emit('pictionary:round_start', {
    round: game.currentRound,
    drawer: game.players[drawerIndex],
    wordLength: game.currentWord.length
  });

  // 给绘画者发送词语
  const drawerSocket = getSocketByUserId(game.currentDrawer);
  if (drawerSocket) {
    // 注意：这里需要获取实际的socket实例
    // 由于架构限制，暂时跳过这个功能
    // 实际实现中可以通过维护socketId->socket映射来实现
  }

  // 10秒后进入猜词阶段
  setTimeout(() => {
    game.status = 'guessing';
    io.to(`pictionary:${game.roomId}`).emit('pictionary:guessing_start', { timeLimit: game.timeLimit });

    // 启动计时器
    game.timer = setTimeout(() => {
      // 超时，开始下一轮
      io.to(`pictionary:${game.roomId}`).emit('pictionary:timeout', { word: game.currentWord });
      startPictionaryRound(io, game);
    }, game.timeLimit * 1000);
  }, 10000);
}

// 辅助函数：启动文字接龙计时器
function startWordChainTimer(io, game) {
  game.timer = setTimeout(() => {
    // 超时，当前玩家被淘汰
    const currentPlayer = game.players[game.currentPlayerIndex];
    game.players.splice(game.currentPlayerIndex, 1);

    if (game.players.length < 2) {
      // 游戏结束
      game.status = 'ended';
      const winner = game.players[0];
      io.to(`wordchain:${game.roomId}`).emit('wordchain:ended', { winner, reason: 'timeout' });
    } else {
      // 调整当前玩家索引
      if (game.currentPlayerIndex >= game.players.length) {
        game.currentPlayerIndex = 0;
      }

      io.to(`wordchain:${game.roomId}`).emit('wordchain:timeout', {
        username: currentPlayer.username,
        nextPlayer: game.players[game.currentPlayerIndex]
      });

      startWordChainTimer(io, game);
    }
  }, 30000); // 30秒
}
