import React, { useState } from 'react';
import './GamesView.css';

function GamesView({ socket, user }) {
  const [currentGame, setCurrentGame] = useState(null);

  const games = [
    { id: 'pictionary', icon: '🎨', title: '你画我们猜', desc: '经典绘画猜词游戏' },
    { id: 'quiz', icon: '🎯', title: '实时抢答', desc: '比比谁反应快' },
    { id: 'wordchain', icon: '🔗', title: '文字接龙', desc: '成语词语接龙' },
    { id: 'dice', icon: '🎲', title: '掷骰子', desc: '比一比谁的运气好' },
    { id: 'rock', icon: '✊', title: '石头剪刀布', desc: '经典猜拳游戏' },
    { id: 'memory', icon: '🃏', title: '翻牌子', desc: '记忆力大挑战' }
  ];

  return (
    <div className="games-view">
      {!currentGame ? (
        <>
          <div className="section-header">
            <h2>🎮 小游戏厅</h2>
            <p>选择一个游戏开始玩吧！</p>
          </div>
          <div className="games-grid">
            {games.map(game => (
              <button
                key={game.id}
                className="game-card"
                onClick={() => setCurrentGame(game.id)}
              >
                <span className="game-icon">{game.icon}</span>
                <h3>{game.title}</h3>
                <p>{game.desc}</p>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="game-play-area">
          <button className="back-btn" onClick={() => setCurrentGame(null)}>
            ← 返回游戏列表
          </button>
          <div className="game-placeholder">
            <h3>🎮 {games.find(g => g.id === currentGame)?.title}</h3>
            <p>游戏开发中，敬请期待！</p>
            <div className="game-tips">
              <p>💡 多人游戏功能需要多个用户参与</p>
              <p>请邀请朋友一起玩耍</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GamesView;
