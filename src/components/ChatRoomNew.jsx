import React, { useState, useEffect, useRef } from 'react';
import './ChatRoomNew.css';
import Icons from './Icons';
import { CARTOON_AVATARS, svgToDataUrl } from '../utils/avatars';
import VideoRoom from './VideoRoom';

const EMOJIS = ['😀', '😍', '😂', '👍', '🎉', '🔥', '❤️', '👏', '😎', '🙏', '😊', '🥰', '🌟', '💯', '🌈', '💫'];

// 获取头像SVG
function getAvatarSvg(avatarId) {
  const avatar = CARTOON_AVATARS.find(a => a.id === avatarId);
  if (avatar) {
    return avatar.svg;
  }
  // 如果找不到，返回第一个头像
  return CARTOON_AVATARS[0]?.svg || '';
}

// 渲染SVG头像组件
function Avatar({ avatarId, size = 40, className = '' }) {
  const svgString = getAvatarSvg(avatarId);
  return (
    <div
      className={`avatar-svg-container ${className}`}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svgString }}
    />
  );
}

// 左侧功能栏组件
function LeftSidebar({ activeTab, setActiveTab, onLogout, currentUser, onEditProfile }) {
  const menuItems = [
    { id: 'chats', icon: Icons.Message, label: '消息' },
    { id: 'contacts', icon: Icons.Users, label: '好友' },
    { id: 'groups', icon: Icons.Group, label: '群组' },
    { id: 'settings', icon: Icons.Settings, label: '设置' },
  ];

  return (
    <div className="left-sidebar">
      {/* 用户信息 */}
      <div className="sidebar-user-profile" onClick={onEditProfile} title="点击编辑个人资料">
        <div className="profile-avatar">
          <Avatar avatarId={currentUser?.avatarId || 'bear'} size={36} />
        </div>
        <span className="profile-name">{currentUser?.username || '我'}</span>
        <span className="edit-badge">✎</span>
      </div>

      {menuItems.map(item => (
        <button
          key={item.id}
          className={`menu-item ${activeTab === item.id ? 'active' : ''}`}
          onClick={() => setActiveTab(item.id)}
          title={item.label}
        >
          <item.icon size={22} />
        </button>
      ))}
      <button
        className="menu-item logout-item"
        onClick={onLogout}
        title="退出登录"
      >
        <Icons.Logout size={22} />
      </button>
    </div>
  );
}

// 移动端底部导航栏
function MobileBottomNav({ activeTab, setActiveTab, onLogout, onShowDrawer, currentUser, unreadCount }) {
  const navItems = [
    { id: 'chats', icon: Icons.Message, label: '消息' },
    { id: 'contacts', icon: Icons.Users, label: '好友' },
  ];

  return (
    <div className="mobile-bottom-nav">
      {navItems.map(item => (
        <button
          key={item.id}
          className={`mobile-nav-item ${activeTab === item.id ? 'active' : ''}`}
          onClick={() => setActiveTab(item.id)}
        >
          <item.icon size={22} />
          <span className="nav-label">{item.label}</span>
          {item.id === 'chats' && unreadCount > 0 && (
            <span className="nav-unread">{unreadCount > 99 ? '99+' : unreadCount}</span>
          )}
        </button>
      ))}
      <button className="mobile-nav-item" onClick={onShowDrawer}>
        <Icons.More size={22} />
        <span className="nav-label">更多</span>
      </button>
    </div>
  );
}

// 移动端侧边抽屉
function MobileDrawer({ show, onClose, children, position = 'left' }) {
  if (!show) return null;
  return (
    <>
      <div className={`drawer-overlay ${show ? 'show' : ''}`} onClick={onClose} />
      <div className={`drawer-panel ${position} ${show ? 'show' : ''}`}>
        {children}
      </div>
    </>
  );
}

// 个人资料编辑面板
function UserProfileEdit({ currentUser, users, onSave, onClose, socket }) {
  const [nickname, setNickname] = useState(currentUser?.username || '');
  const [selectedAvatarId, setSelectedAvatarId] = useState(currentUser?.avatarId || 'bear');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const allAvatars = CARTOON_AVATARS.filter(a => a.id !== 'group');

  const handleSave = async () => {
    const trimmedName = nickname.trim();
    if (!trimmedName) {
      setError('昵称不能为空');
      return;
    }
    if (trimmedName.length > 12) {
      setError('昵称不能超过12个字符');
      return;
    }
    // 检查名字是否与其他用户重复（排除自己）
    const duplicateUser = users.find(u =>
      u.username === trimmedName && u.id !== currentUser?.id
    );
    if (duplicateUser) {
      setError(`昵称 "${trimmedName}" 已被使用`);
      return;
    }
    setError('');
    setSaving(true);
    try {
      const newAvatarDataUrl = svgToDataUrl(
        allAvatars.find(a => a.id === selectedAvatarId)?.svg || ''
      );
      await onSave(trimmedName, newAvatarDataUrl, selectedAvatarId);
      onClose();
    } catch (e) {
      setError('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-edit-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="profile-edit-panel">
        <div className="profile-edit-header">
          <h3>编辑个人资料</h3>
          <button className="profile-edit-close" onClick={onClose}>
            <Icons.Close size={16} />
          </button>
        </div>

        <div className="profile-edit-section">
          <label className="profile-edit-label">昵称</label>
          <input
            type="text"
            className={`profile-edit-input ${error ? 'error' : ''}`}
            value={nickname}
            onChange={(e) => { setNickname(e.target.value); setError(''); }}
            placeholder="输入你的昵称"
            maxLength={12}
            autoFocus
          />
          {error && <div className="profile-edit-error">{error}</div>}
        </div>

        <div className="profile-edit-section">
          <label className="profile-edit-label">选择头像</label>
          <div className="avatar-selector-grid">
            {allAvatars.map(avatar => (
              <div
                key={avatar.id}
                className={`avatar-select-item ${selectedAvatarId === avatar.id ? 'selected' : ''}`}
                onClick={() => setSelectedAvatarId(avatar.id)}
                dangerouslySetInnerHTML={{ __html: avatar.svg }}
              />
            ))}
          </div>
        </div>

        <button
          className="profile-edit-save-btn"
          onClick={handleSave}
          disabled={saving || (!nickname.trim() || nickname.trim() === currentUser?.username && selectedAvatarId === currentUser?.avatarId)}
        >
          {saving ? '保存中...' : '保存更改'}
        </button>
      </div>
    </div>
  );
}

// 格式化会话列表中的时间显示
function formatConversationTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return '';
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }
  // 跨天显示月/日
  return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
}

// 截断消息预览文本（处理图片消息和超长文本）
function truncateMessage(content, maxLength = 30) {
  if (!content) return '';
  let text = content;
  if (text.startsWith('[图片]')) {
    return '[图片]';
  }
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + '...';
  }
  return text;
}

// 会话列表组件（仅公共聊天室）
function ConversationList({ lastMessage, time, unreadCount }) {
  return (
    <div className="conversation-list">
      <div className="conversation-header">
        <h3>消息</h3>
      </div>

      <div className="conversations">
        <div className="conversation-item active">
          <div className="conversation-avatar">
            <Avatar avatarId="group" size={40} />
            <span className="online-dot"></span>
          </div>
          <div className="conversation-info">
            <div className="conversation-name-row">
              <span className="conversation-name">公共聊天室</span>
              <div className="conversation-right">
                {unreadCount > 0 && (
                  <span className="unread-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
                <span className="conversation-time">{formatConversationTime(time)}</span>
              </div>
            </div>
            <span className="conversation-message">{truncateMessage(lastMessage)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// 聊天主区域组件（仅公共聊天室）
function ChatWindow({
  messages,
  systemMessages,
  currentUser,
  onSendMessage,
  onTyping,
  onStopTyping,
  onOpenVideo,
  onLoadMoreMessages,
  hasMoreHistory,
  loadingHistory
}) {
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const messagesEndRef = useRef(null);
  const messagesAreaRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  // 用于记录滚动加载前的位置，防止跳动
  const prevScrollHeightRef = useRef(0);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 滚动监听：到达顶部时触发加载更多
  useEffect(() => {
    const area = messagesAreaRef.current;
    if (!area) return;

    const handleScroll = () => {
      // 距离顶部小于80px时触发加载
      if (area.scrollTop < 80 && hasMoreHistory && !loadingHistory) {
        // 记录当前滚动高度
        prevScrollHeightRef.current = area.scrollHeight;
        onLoadMoreMessages();
      }
    };

    area.addEventListener('scroll', handleScroll);
    return () => area.removeEventListener('scroll', handleScroll);
  }, [hasMoreHistory, loadingHistory, onLoadMoreMessages]);

  // 加载更多消息后保持位置不变
  useEffect(() => {
    if (loadingHistory) return;
    const area = messagesAreaRef.current;
    if (area && prevScrollHeightRef.current > 0) {
      // 新内容加载后，调整scrollTop使视觉位置不变
      const newScrollHeight = area.scrollHeight;
      area.scrollTop = newScrollHeight - prevScrollHeightRef.current;
      prevScrollHeightRef.current = 0;
    }
  }, [messages, loadingHistory]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim() && !selectedImage) return;

    if (selectedImage) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onSendMessage(`[图片] ${reader.result}`);
      };
      reader.readAsDataURL(selectedImage);
      setSelectedImage(null);
    }

    if (inputText.trim()) {
      onSendMessage(inputText);
    }

    setInputText('');
    onStopTyping();
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);

    if (e.target.value.length > 0) {
      onTyping();
    } else {
      onStopTyping();
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      onStopTyping();
    }, 3000);
  };

  const handleEmojiSelect = (emoji) => {
    setInputText(prev => prev + emoji);
    onTyping();
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      onStopTyping();
    }, 3000);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '刚刚';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '刚刚';
    const now = new Date();
    const diff = now - date;
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    // 不到1分钟
    if (diff < 60000) return '刚刚';
    // 不到1小时
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    // 今天 - 显示时分
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }
    // 昨天 - 显示"昨天 时:分"
    if (date.toDateString() === yesterday.toDateString()) {
      return `昨天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    }
    // 今年 - 显示月/日 时:分
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) +
        ' ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }
    // 更早 - 显示年/月/日 时:分
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }) +
      ' ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  const isImageMessage = (content) => {
    return content.startsWith('[图片] data:image');
  };

  const getImageUrl = (content) => {
    return content.replace('[图片] ', '');
  };

  return (
    <div className="chat-window">
      {/* 顶部栏 */}
      <div className="chat-header">
        <div className="header-left">
          <Avatar avatarId="group" size={40} className="header-avatar" />
          <div className="header-info">
            <span className="header-name">公共聊天室</span>
          </div>
        </div>
        <div className="header-right">
          <button className="header-btn video-call-btn" title="群视频通话" onClick={onOpenVideo}>
            <Icons.Video size={18} />
            <span className="video-call-label">视频</span>
          </button>
          <button className="header-btn" title="更多">
            <Icons.More size={18} />
          </button>
        </div>
      </div>

      {/* 消息区域 */}
      <div className="messages-area" ref={messagesAreaRef}>
        {/* 历史消息加载指示器 */}
        <div className="history-load-indicator">
          {loadingHistory && (
            <div className="loading-history">
              <span className="loading-dots">
                <span></span><span></span><span></span>
              </span>
              加载历史消息中...
            </div>
          )}
          {!hasMoreHistory && messages.length > 0 && !loadingHistory && (
            <span className="no-more-history">— 已经是第一条消息 —</span>
          )}
        </div>
        {messages.length === 0 && (!systemMessages || systemMessages.length === 0) ? (
          <div className="empty-state">
            <Icons.Message size={48} color="#8e8e93" />
            <p>开始聊天吧</p>
          </div>
        ) : (
          <>
            {systemMessages && systemMessages.map((sysMsg, index) => (
              <div key={`system-${index}-${sysMsg.timestamp}`} className="system-message">
                <span className={`system-message-text ${sysMsg.type}`}>
                  {sysMsg.content}
                </span>
              </div>
            ))}
            {messages.map((msg, index) => {
              const isMine = msg.user_id === currentUser?.id;
              const isImg = isImageMessage(msg.content);

              return (
                <div key={msg.id} className={`message-row ${isMine ? 'mine' : ''}`}>
                  <Avatar avatarId={isMine ? (currentUser?.avatarId || 'bear') : (msg.avatarId || 'bear')} size={36} className="message-avatar" />
                  <div className="message-bubble-wrapper">
                    {isMine ? (
                      <span className="message-sender mine-name">我</span>
                    ) : (
                      <span className="message-sender">{msg.username}</span>
                    )}
                    {isImg ? (
                      <div
                        className="message-bubble image-bubble"
                        onClick={() => setPreviewImage(getImageUrl(msg.content))}
                      >
                        <img src={getImageUrl(msg.content)} alt="shared image" />
                      </div>
                    ) : (
                      <div className="message-bubble">{msg.content}</div>
                    )}
                    <span className="message-time">{formatTime(msg.created_at)}</span>
                  </div>
                </div>
              );
            })}
          </>
        )}
        <div ref={messagesEndRef} className="scroll-anchor" />
      </div>

      {/* 输入区域 */}
      <div className="input-container">
        <div className="input-wrapper">
          <button
            className="input-btn emoji-btn"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            title="表情"
          >
            <Icons.Emoji size={20} />
          </button>

          <button
            className="input-btn attachment-btn"
            onClick={() => fileInputRef.current?.click()}
            title="图片"
          >
            <Icons.Image size={20} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept="image/*"
            onChange={handleImageSelect}
          />

          <form className="message-form" onSubmit={handleSend}>
            <input
              type="text"
              className="message-input"
              placeholder="输入消息..."
              value={inputText}
              onChange={handleInputChange}
            />
            <button
              type="submit"
              className="send-btn"
              disabled={!inputText.trim() && !selectedImage}
            >
              <Icons.Send size={16} />
            </button>
          </form>

          {selectedImage && (
            <div className="preview-thumbnail">
              <img src={URL.createObjectURL(selectedImage)} alt="preview" />
              <button
                className="remove-preview"
                onClick={() => setSelectedImage(null)}
              >
                <Icons.Close size={12} />
              </button>
            </div>
          )}
        </div>

        {showEmojiPicker && (
          <div className="emoji-picker">
            <div className="emoji-grid">
              {EMOJIS.map((emoji, i) => (
                <button
                  key={i}
                  type="button"
                  className="emoji-item"
                  onClick={() => {
                    handleEmojiSelect(emoji);
                    setShowEmojiPicker(false);
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 图片预览弹窗 */}
      {previewImage && (
        <div className="image-modal" onClick={() => setPreviewImage(null)}>
          <img src={previewImage} alt="preview" onClick={(e) => e.stopPropagation()} />
          <button
            className="close-modal"
            onClick={() => setPreviewImage(null)}
          >
            <Icons.Close size={24} />
          </button>
        </div>
      )}
    </div>
  );
}

// 在线用户列表组件（纯展示）
function OnlineUserList({ users, currentUser }) {
  const [searchText, setSearchText] = useState('');

  // 不过滤自己，显示所有在线用户
  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="friend-list">
      <div className="friend-header">
        <h3>在线用户</h3>
        <span className="friend-count">{filteredUsers.length} 人</span>
      </div>

      <div className="search-container">
        <div className="search-icon-wrapper">
          <Icons.Search size={18} color="#8e8e93" />
        </div>
        <input
          type="text"
          className="search-input"
          placeholder="搜索..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      <div className="friends">
        {filteredUsers.length === 0 && (
          <div className="empty-state">
            <p>暂无在线用户</p>
          </div>
        )}
        {filteredUsers.map(u => (
          <div key={u.id} className={`friend-item ${currentUser?.id === u.id ? 'me' : ''}`}>
            <div className="friend-avatar">
              <Avatar avatarId={u.avatarId || 'bear'} size={40} />
              {u.online && <span className="online-dot"></span>}
            </div>
            <div className="friend-info">
              <span className="friend-name">{u.username}</span>
              {currentUser?.id === u.id ? (
                <span className="header-status">我</span>
              ) : (
                <span className="header-status">在线</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChatRoomNew({ socket, user, users, joinRoom, sendMessage, requestMessageHistory, startTyping, stopTyping, onLogout, onUpdateUser }) {
  const [messages, setMessages] = useState([]);
  const [systemMessages, setSystemMessages] = useState([]);
  const [typingUser, setTypingUser] = useState(null);
  const [activeTab, setActiveTab] = useState('chats');
  const [lastMessage, setLastMessage] = useState('');
  const [lastMsgTime, setLastMsgTime] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showVideoRoom, setShowVideoRoom] = useState(false);
  // 分页相关状态
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  // 移动端状态
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  const [drawerContent, setDrawerContent] = useState(null); // 'contacts' | 'users' | 'settings'

  useEffect(() => {
    if (socket && user) {
      joinRoom('general');
      requestMessageHistory('general');

      socket.on('message:new', ({ message }) => {
        setMessages(prev => [...prev, message]);
        setLastMessage(message.content || '');
        setLastMsgTime(message.created_at || Date.now());
        // 如果当前在消息tab，不算未读；否则+1
        if (activeTab !== 'chats' && message.user_id !== user?.id) {
          setUnreadCount(prev => prev + 1);
        }
      });

      socket.on('message:history', ({ messages: historyMsgs, hasMore, total }) => {
        if (currentPage === 1) {
          // 第一页直接替换（初始加载）
          setMessages(historyMsgs);
        } else {
          // 翻页：将旧消息插入到列表前面
          setMessages(prev => [...historyMsgs, ...prev]);
        }
        setHasMoreHistory(hasMore !== false && hasMore !== undefined ? hasMore : true);
        setLoadingHistory(false);
        if (historyMsgs.length > 0) {
          const latest = historyMsgs[historyMsgs.length - 1];
          // 只有第一页时才更新最后消息预览（避免翻页覆盖）
          if (currentPage === 1) {
            setLastMessage(latest.content || '');
            setLastMsgTime(latest.created_at || Date.now());
          }
        }
      });

      socket.on('typing:start', ({ username }) => {
        setTypingUser(username);
      });

      socket.on('typing:stop', ({ username }) => {
        if (typingUser === username) {
          setTypingUser(null);
        }
      });

      socket.on('user:join', ({ user: joinedUser }) => {
        if (joinedUser && joinedUser.id !== user.id) {
          const ts = Date.now();
          setSystemMessages(prev => [
            ...prev,
            { type: 'join', content: `${joinedUser.username} 加入了聊天室`, timestamp: ts }
          ]);
          setTimeout(() => {
            setSystemMessages(prev => prev.filter(m => m.timestamp !== ts));
          }, 15000);
        }
      });

      socket.on('user:leave', ({ userId, username }) => {
        const leaveUser = users.find(u => u.id === userId);
        const displayName = leaveUser?.username || username || '某位用户';
        if (userId !== user?.id) {
          setSystemMessages(prev => [
            ...prev,
            { type: 'leave', content: `${displayName} 离开了聊天室`, timestamp: Date.now() }
          ]);
        }
      });

      return () => {
        socket.off('message:new');
        socket.off('message:history');
        socket.off('typing:start');
        socket.off('typing:stop');
        socket.off('user:join');
        socket.off('user:leave');
      };
    }
  }, [socket, user, joinRoom, requestMessageHistory, typingUser, users, activeTab]);

  const handleSendMessage = (content) => {
    sendMessage(content, 'general');
    // 发送消息时切换回消息tab并清除未读
    setActiveTab('chats');
    setUnreadCount(0);
  };

  const handleTyping = () => {
    startTyping('general');
  };

  const handleStopTyping = () => {
    stopTyping('general');
  };

  // 切换到消息tab时清除未读
  const handleSwitchToChats = () => {
    setActiveTab('chats');
    setUnreadCount(0);
  };

  // 加载更多历史消息（向上滚动触发）
  const loadMoreMessages = () => {
    if (loadingHistory || !hasMoreHistory || !socket) return;
    setLoadingHistory(true);
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    socket.emit('message:history', { roomId: 'general', page: nextPage });
  };

  // 保存个人资料
  const handleSaveProfile = async (newUsername, newAvatar, newAvatarId) => {
    if (socket) {
      socket.emit('profile:update', { username: newUsername, avatar: newAvatar, avatarId: newAvatarId });
      localStorage.setItem('chatUser', JSON.stringify({
        username: newUsername,
        avatar: newAvatar,
        avatarId: newAvatarId
      }));
      if (onUpdateUser) {
        onUpdateUser(newUsername, newAvatar, newAvatarId);
      }
    }
  };

  const handleOpenDrawer = (content) => {
    setDrawerContent(content);
    setShowMobileDrawer(true);
  };

  return (
    <div className="chat-app">
      <LeftSidebar
        activeTab={activeTab}
        setActiveTab={(tab) => { if (tab === 'chats') handleSwitchToChats(); else setActiveTab(tab); }}
        onLogout={onLogout}
        currentUser={user}
        onEditProfile={() => setShowProfileEdit(true)}
      />
      {activeTab === 'chats' && (
        <ConversationList
          lastMessage={lastMessage}
          time={lastMsgTime}
          unreadCount={unreadCount}
        />
      )}
      <ChatWindow
        messages={messages}
        systemMessages={systemMessages}
        currentUser={user}
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        onStopTyping={handleStopTyping}
        onOpenVideo={() => setShowVideoRoom(true)}
        onLoadMoreMessages={loadMoreMessages}
        hasMoreHistory={hasMoreHistory}
        loadingHistory={loadingHistory}
      />
      <OnlineUserList
        users={users}
        currentUser={user}
      />

      {/* 移动端底部导航 */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={(tab) => { if (tab === 'chats') handleSwitchToChats(); else setActiveTab(tab); }}
        onLogout={onLogout}
        onShowDrawer={() => handleOpenDrawer('menu')}
        currentUser={user}
        unreadCount={unreadCount}
      />

      {/* 移动端侧边抽屉 */}
      <MobileDrawer show={showMobileDrawer} onClose={() => { setShowMobileDrawer(false); setDrawerContent(null); }} position="right">
        {drawerContent === 'menu' && (
          <div className="mobile-drawer-content">
            <div className="drawer-header">
              <h3>更多选项</h3>
              <button className="drawer-close-btn" onClick={() => setShowMobileDrawer(false)}>
                <Icons.Close size={18} />
              </button>
            </div>
            <div className="drawer-user-info" onClick={() => { setShowProfileEdit(true); setShowMobileDrawer(false); }}>
              <Avatar avatarId={user?.avatarId || 'bear'} size={44} />
              <span className="drawer-username">{user?.username || '我'}</span>
              <span className="drawer-edit-badge">编辑</span>
            </div>
            <div className="drawer-menu">
              <button className="drawer-menu-item" onClick={() => { handleOpenDrawer('users'); }}>
                <Icons.Users size={20} />
                <span>在线用户</span>
                <span className="drawer-menu-count">{users.length}</span>
              </button>
              <button className="drawer-menu-item" onClick={() => { setActiveTab('settings'); setShowMobileDrawer(false); }}>
                <Icons.Settings size={20} />
                <span>设置</span>
              </button>
            </div>
            <button className="drawer-logout-btn" onClick={() => { onLogout(); setShowMobileDrawer(false); }}>
              <Icons.Logout size={18} />
              <span>退出登录</span>
            </button>
          </div>
        )}
        {drawerContent === 'users' && (
          <div className="mobile-drawer-content drawer-users">
            <div className="drawer-header">
              <h3>在线用户 ({users.length})</h3>
              <button className="drawer-close-btn" onClick={() => { setShowMobileDrawer(false); setDrawerContent('menu'); }}>
                <Icons.Back size={18} />
              </button>
            </div>
            <div className="drawer-user-list">
              {users.map(u => (
                <div key={u.id} className={`drawer-user-item ${user?.id === u.id ? 'me' : ''}`}>
                  <Avatar avatarId={u.avatarId || 'bear'} size={36} />
                  <span className="drawer-user-name">{u.username}</span>
                  {user?.id === u.id ? <span className="drawer-me-tag">我</span> : <span className="drawer-online-dot"></span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </MobileDrawer>

      {showProfileEdit && (
        <UserProfileEdit
          currentUser={user}
          users={users}
          onSave={handleSaveProfile}
          onClose={() => setShowProfileEdit(false)}
          socket={socket}
        />
      )}
      {showVideoRoom && (
        <VideoRoom
          socket={socket}
          user={user}
          onClose={() => setShowVideoRoom(false)}
        />
      )}
    </div>
  );
}

export default ChatRoomNew;
