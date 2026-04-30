import React, { useState, useEffect, useRef } from 'react';
import './ChatRoomNew.css';
import Icons from './Icons';
import { CARTOON_AVATARS, svgToDataUrl } from '../utils/avatars';

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

// 会话列表组件
function ConversationList({
  conversations,
  activeConversation,
  onSelect,
  currentUser,
  blockedUsers,
  onUnblockUser
}) {
  const [searchText, setSearchText] = useState('');

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchText.toLowerCase()) ||
    conv.lastMessage?.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="conversation-list">
      <div className="conversation-header">
        <h3>消息</h3>
        <button className="add-btn" title="新建对话">
          <Icons.Plus size={18} />
        </button>
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

      <div className="conversations">
        {filteredConversations.length === 0 && (
          <div className="empty-state">
            <p>没有找到会话</p>
          </div>
        )}
        {filteredConversations.map(conv => (
          <div
            key={conv.id}
            className={`conversation-item ${activeConversation?.id === conv.id ? 'active' : ''}`}
            onClick={() => onSelect(conv)}
          >
            <div className="conversation-avatar">
              <Avatar avatarId={conv.avatarId} size={40} />
              {conv.online && <span className="online-dot"></span>}
            </div>
            <div className="conversation-info">
              <div className="conversation-name-row">
                <span className="conversation-name">{conv.name}</span>
                <div className="conversation-right">
                  {conv.unreadCount > 0 && (
                    <span className="unread-badge">{conv.unreadCount > 99 ? '99+' : conv.unreadCount}</span>
                  )}
                  <span className="conversation-time">{conv.time}</span>
                </div>
              </div>
              <span className="conversation-message">{conv.lastMessage}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 聊天主区域组件
function ChatWindow({
  conversation,
  messages,
  systemMessages,
  currentUser,
  onSendMessage,
  onTyping,
  onStopTyping,
  blockedUsers,
  onBlockUser,
  onUnblockUser
}) {
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  const isImageMessage = (content) => {
    return content.startsWith('[图片] data:image');
  };

  const getImageUrl = (content) => {
    return content.replace('[图片] ', '');
  };

  const isMessageBlocked = (message) => {
    return blockedUsers.has(message.user_id);
  };

  return (
    <div className="chat-window">
      {/* 顶部栏 */}
      <div className="chat-header">
        <div className="header-left">
          <Avatar avatarId={conversation?.avatarId || 'bear'} size={40} className="header-avatar" />
          <div className="header-info">
            <span className="header-name">{conversation?.name || '选择一个对话'}</span>
            {conversation?.online && <span className="header-status">在线</span>}
          </div>
        </div>
        <div className="header-right">
          {conversation?.id && conversation?.id !== 'general' && (
            <button
              className={`header-btn ${blockedUsers.has(conversation.id) ? 'blocked-active' : ''}`}
              title={blockedUsers.has(conversation.id) ? '取消屏蔽' : '屏蔽用户'}
              onClick={() => {
                if (blockedUsers.has(conversation.id)) {
                  onUnblockUser(conversation.id);
                } else {
                  onBlockUser(conversation.id);
                }
              }}
            >
              <Icons.Shield size={18} />
            </button>
          )}
          <button className="header-btn" title="语音通话">
            <Icons.Phone size={18} />
          </button>
          <button className="header-btn" title="视频通话">
            <Icons.Video size={18} />
          </button>
          <button className="header-btn" title="更多">
            <Icons.More size={18} />
          </button>
        </div>
      </div>

      {/* 消息区域 */}
      <div className="messages-area">
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
              const isBlocked = !isMine && isMessageBlocked(msg);
              const isImg = isImageMessage(msg.content);

              if (isBlocked) {
                return (
                  <div key={msg.id} className="message-row blocked">
                    <div className="blocked-message">
                      <Icons.Shield size={16} />
                      <span>消息已被屏蔽</span>
                    </div>
                  </div>
                );
              }

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

// 好友列表组件
function FriendList({ users, currentUser, onFriendSelect, blockedUsers }) {
  const [searchText, setSearchText] = useState('');

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="friend-list">
      <div className="friend-header">
        <h3>好友</h3>
        <span className="friend-count">{filteredUsers.filter(u => u.online).length} 在线</span>
      </div>

      <div className="search-container">
        <div className="search-icon-wrapper">
          <Icons.Search size={18} color="#8e8e93" />
        </div>
        <input
          type="text"
          className="search-input"
          placeholder="搜索好友..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      <div className="friends">
        {filteredUsers.map(u => (
          <div
            key={u.id}
            className={`friend-item ${currentUser?.id === u.id ? 'me' : ''} ${blockedUsers.has(u.id) ? 'blocked' : ''}`}
            onClick={() => onFriendSelect && onFriendSelect(u)}
          >
            <div className="friend-avatar">
              <Avatar avatarId={u.avatarId || 'bear'} size={40} />
              {u.online && <span className="online-dot"></span>}
            </div>
            <div className="friend-info">
              <span className="friend-name">{u.username}</span>
              {blockedUsers.has(u.id) && (
                <span className="blocked-badge">
                  <Icons.Shield size={12} />
                  已屏蔽
                </span>
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
  const [activeConversation, setActiveConversation] = useState(null);
  const [currentRoom, setCurrentRoom] = useState('general');
  const [blockedUsers, setBlockedUsers] = useState(new Set());
  const [conversations, setConversations] = useState([]);
  const [showProfileEdit, setShowProfileEdit] = useState(false);

  // 根据用户列表生成/刷新会话列表（保留已有的 lastMessage/unreadCount）
  useEffect(() => {
    setConversations(prev => {
      const prevMap = new Map(prev.map(c => [c.id, c]));
      const newConversations = [
        {
          id: 'general',
          name: '公共聊天室',
          avatarId: 'group',
          online: true,
          lastMessage: prevMap.get('general')?.lastMessage || '',
          time: prevMap.get('general')?.time || '',
          unreadCount: prevMap.get('general')?.unreadCount || 0
        },
        ...users.map(u => {
          const existing = prevMap.get(u.id);
          return {
            id: u.id,
            name: u.username,
            avatarId: u.avatarId,
            online: u.online,
            lastMessage: existing?.lastMessage || '',
            time: existing?.time || '',
            unreadCount: existing?.unreadCount || 0
          };
        })
      ];
      return newConversations;
    });
  }, [users]);

  // 根据当前房间消息更新对应会话的 lastMessage
  const updateConversationLastMsg = (msgList) => {
    if (!msgList || msgList.length === 0) return;
    // 按 room_id 分组
    const byRoom = {};
    msgList.forEach(m => {
      if (!byRoom[m.room_id]) byRoom[m.room_id] = [];
      byRoom[m.room_id].push(m);
    });

    for (const [roomId, roomMsgs] of Object.entries(byRoom)) {
      const latest = roomMsgs[roomMsgs.length - 1];
      setConversations(prev => prev.map(c =>
        String(c.id) === String(roomId) ? { ...c, lastMessage: latest.content || '', time: '' } : c
      ));
    }
  };

  useEffect(() => {
    if (socket && user) {
      joinRoom('general');
      requestMessageHistory('general');

      socket.on('message:new', ({ message }) => {
        setMessages(prev => [...prev, message]);
        // 用消息自身的 room_id 更新对应会话的最后一条消息
        const msgRoomId = message.room_id || 'general';
        setConversations(prev => prev.map(c =>
          c.id === msgRoomId || String(c.id) === String(msgRoomId)
            ? { ...c, lastMessage: message.content || '', time: '' }
            : c
        ));
        // 如果消息不是当前查看的会话，增加未读数
        if (msgRoomId !== activeConversation?.id && String(msgRoomId) !== String(activeConversation?.id) && message.user_id !== user?.id) {
          setConversations(prev => prev.map(c =>
            c.id === msgRoomId || String(c.id) === String(msgRoomId)
              ? { ...c, unreadCount: (c.unreadCount || 0) + 1 }
              : c
          ));
        }
      });

      socket.on('message:history', ({ messages }) => {
        setMessages(messages);
        updateConversationLastMsg(messages);
      });

      socket.on('typing:start', ({ username }) => {
        setTypingUser(username);
      });

      socket.on('typing:stop', ({ username }) => {
        if (typingUser === username) {
          setTypingUser(null);
        }
      });

      // 系统消息：用户加入
      socket.on('user:join', ({ user: joinedUser }) => {
        if (joinedUser && joinedUser.id !== user.id) {
          setSystemMessages(prev => [
            ...prev,
            { type: 'join', content: `${joinedUser.username} 加入了聊天室`, timestamp: Date.now() }
          ]);
          // 5秒后自动移除系统消息
          setTimeout(() => {
            setSystemMessages(prev => prev.filter(m => m.timestamp !== (Date.now() - 5000 > 0 ? 0 : 1)));
          }, 15000);
        }
      });

      // 系统消息：用户离开
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
  }, [socket, user, joinRoom, requestMessageHistory, typingUser, users]);

  const handleSendMessage = (content) => {
    sendMessage(content, currentRoom);
  };

  const handleTyping = () => {
    startTyping(currentRoom);
  };

  const handleStopTyping = () => {
    stopTyping(currentRoom);
  };

  const handleConversationSelect = (conv) => {
    setActiveConversation(conv);

    // 清除该会话的未读数
    setConversations(prev => prev.map(c =>
      c.id === conv.id ? { ...c, unreadCount: 0 } : c
    ));

    // 如果切换会话，离开当前房间并加入新房间
    if (conv.id !== currentRoom) {
      if (currentRoom) {
        // leaveRoom(currentRoom); // 如果有leaveRoom函数
      }
      setCurrentRoom(conv.id);
      if (conv.id !== 'general') {
        // joinRoom(conv.id); // 加入私聊房间
      }
      requestMessageHistory(conv.id);
    }
  };

  const handleFriendSelect = (friend) => {
    // 将好友选择转换为对话
    setActiveTab('chats');
    const conv = conversations.find(c => c.id === friend.id);
    if (conv) {
      setActiveConversation(conv);
      setCurrentRoom(friend.id);
      requestMessageHistory(friend.id);
    }
  };

  const handleBlockUser = (userId) => {
    setBlockedUsers(prev => new Set([...prev, userId]));
  };

  const handleUnblockUser = (userId) => {
    setBlockedUsers(prev => {
      const newSet = new Set(prev);
      newSet.delete(userId);
      return newSet;
    });
  };

  // 保存个人资料
  const handleSaveProfile = async (newUsername, newAvatar, newAvatarId) => {
    if (socket) {
      socket.emit('profile:update', { username: newUsername, avatar: newAvatar, avatarId: newAvatarId });
      // 更新本地存储
      localStorage.setItem('chatUser', JSON.stringify({
        username: newUsername,
        avatar: newAvatar,
        avatarId: newAvatarId
      }));
      // 通知父组件更新用户信息
      if (onUpdateUser) {
        onUpdateUser(newUsername, newAvatar, newAvatarId);
      }
    }
  };

  // 过滤掉被屏蔽用户的消息
  const filteredMessages = messages.filter(msg => {
    if (msg.user_id === user?.id) return true;
    return !blockedUsers.has(msg.user_id);
  });

  return (
    <div className="chat-app">
      <LeftSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={onLogout}
        currentUser={user}
        onEditProfile={() => setShowProfileEdit(true)}
      />
      <ConversationList
        conversations={conversations}
        activeConversation={activeConversation}
        onSelect={handleConversationSelect}
        currentUser={user}
        blockedUsers={blockedUsers}
        onUnblockUser={handleUnblockUser}
      />
      <ChatWindow
        conversation={activeConversation || { name: '公共聊天室', avatarId: 'group', online: true }}
        messages={filteredMessages}
        systemMessages={systemMessages}
        currentUser={user}
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        onStopTyping={handleStopTyping}
        blockedUsers={blockedUsers}
        onBlockUser={handleBlockUser}
        onUnblockUser={handleUnblockUser}
      />
      <FriendList
        users={users}
        currentUser={user}
        onFriendSelect={handleFriendSelect}
        blockedUsers={blockedUsers}
      />
      {showProfileEdit && (
        <UserProfileEdit
          currentUser={user}
          users={users}
          onSave={handleSaveProfile}
          onClose={() => setShowProfileEdit(false)}
          socket={socket}
        />
      )}
    </div>
  );
}

export default ChatRoomNew;
