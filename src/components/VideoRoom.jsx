import React, { useState, useEffect, useRef, useCallback } from 'react';
import Icons from './Icons';
import { CARTOON_AVATARS } from '../utils/avatars';
import './VideoRoom.css';

// 获取头像SVG
function getAvatarSvg(avatarId) {
  const avatar = CARTOON_AVATARS.find(a => a.id === avatarId);
  return avatar ? avatar.svg : (CARTOON_AVATARS[0]?.svg || '');
}

function Avatar({ avatarId, size = 48 }) {
  const svgString = getAvatarSvg(avatarId);
  return (
    <div
      className="video-avatar"
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svgString }}
    />
  );
}

// 单个视频面板（本地或远程）
function VideoTile({ stream, username, avatarId, isLocal, isMuted, isCameraOff, onClick }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className={`video-tile ${isLocal ? 'local' : 'remote'} ${!stream ? 'no-video' : ''} clickable`} onClick={onClick}>
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="video-element"
        />
      ) : (
        <div className="video-placeholder">
          <Avatar avatarId={avatarId} size={64} />
        </div>
      )}
      {/* 用户信息覆盖层 */}
      <div className="video-tile-overlay">
        <span className="video-tile-name">{username}</span>
        {isLocal && <span className="video-tile-badge">我</span>}
        {isCameraOff && (
          <div className="camera-off-indicator">
            <Icons.Video size={14} /> 摄像头已关闭
          </div>
        )}
      </div>
      {/* 放大提示 */}
      <div className="video-tile-zoom-hint">
        <Icons.Maximize size={14} />
      </div>
    </div>
  );
}

// 视频控制栏
function VideoControls({
  isCameraOn,
  isMicOn,
  onToggleCamera,
  onToggleMic,
  onLeave,
  participantCount
}) {
  return (
    <div className="video-controls">
      <div className="video-controls-left">
        <span className="video-participant-count">
          <Icons.Users size={16} />
          {participantCount} 人参与
        </span>
      </div>
      <div className="video-controls-center">
        <button
          className={`control-btn ${!isMicOn ? 'off' : ''}`}
          onClick={onToggleMic}
          title={isMicOn ? '静音' : '取消静音'}
        >
          {isMicOn ? <Icons.Mic size={20} /> : <Icons.MicOff size={20} />}
        </button>
        <button
          className={`control-btn ${!isCameraOn ? 'off' : ''}`}
          onClick={onToggleCamera}
          title={isCameraOn ? '关闭摄像头' : '开启摄像头'}
        >
          {isCameraOn ? <Icons.Video size={20} /> : <Icons.VideoOff size={20} />}
        </button>
        <button className="control-btn leave-btn" onClick={onLeave} title="挂断">
          <Icons.Phone size={20} />
        </button>
      </div>
      <div className="video-controls-right" />
    </div>
  );
}

// 放大查看的视频播放器
function FocusVideoPlayer({ stream, username, avatarId, isLocal }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="focus-video-container">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className="focus-video-element"
      />
    </div>
  );
}

// WebRTC 连接管理 Hook
function useWebRTC({ socket, user }) {
  const localStreamRef = useRef(null);
  // remoteStreams: Map<socketId, { stream, userId, username, avatarId }>
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const peerConnectionsRef = useRef(new Map());
  const [isInCall, setIsInCall] = useState(false);
  // 权限错误相关状态
  const [permissionError, setPermissionError] = useState(null);
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);

  // 检测是否可能为无痕/隐私模式（通过尝试检测权限策略）
  const detectPrivateMode = () => {
    // 尝试通过 Permissions API 检测
    if (navigator.permissions && navigator.permissions.query) {
      return navigator.permissions.query({ name: 'microphone' }).then(result => {
        if (result.state === 'prompt') return false;
        return false; // 无法100%确定，但可以给出提示
      }).catch(() => false);
    }
    return Promise.resolve(false);
  };

  // 解析 getUserMedia 错误，返回用户友好的错误信息
  const parseMediaError = (err) => {
    const errorName = err?.name || '';
    const errorMsg = err?.message || '';

    // NotAllowedError: 用户拒绝权限 / 无痕模式下浏览器自动拒绝
    if (errorName === 'NotAllowedError') {
      // 判断是否可能是无痕模式
      const isLikelyIncognito = errorMsg.includes('Permission')
        || errorMsg.includes('denied')
        || !errorMsg;
      return {
        type: 'permission_denied',
        title: '摄像头/麦克风权限被拒绝',
        message: isLikelyIncognito
          ? '当前浏览器无法获取摄像头或麦克风。如果你正在使用**无痕/隐私浏览模式**，请切换到普通窗口重试。\n\n如果是普通模式，请在浏览器地址栏左侧点击"摄像头/麦克风"图标，选择"允许"。'
          : '请在浏览器弹窗中点击"允许"，或在地址栏左侧点击摄像头图标开启权限。',
        hint: isLikelyIncognito ? 'incognito' : 'permission'
      };
    }

    // NotFoundError: 没有找到摄像头或麦克风设备
    if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
      return {
        type: 'device_not_found',
        title: '未检测到摄像头或麦克风',
        message: '未在您的设备上找到可用的摄像头或麦克风。请检查：\n1. 设备是否已正确连接\n2. 驱动程序是否正常安装\n3. 是否被其他应用占用'
      };
    }

    // NotReadableError: 设备被占用或硬件错误
    if (errorName === 'NotReadableError' || errorName === 'TrackStartError') {
      return {
        type: 'device_busy',
        title: '设备被占用',
        message: '摄像头或麦克风可能被其他应用程序占用（如其他视频会议、录屏软件等）。请关闭其他使用摄像头的应用后重试。'
      };
    }

    // OverconstrainedError: 不满足约束条件
    if (errorName === 'OverconstrainedError') {
      return {
        type: 'constraint_failed',
        title: '设备不支持请求的参数',
        message: '您的设备不支持所请求的视频参数，将尝试使用默认设置。'
      };
    }

    // TypeError: 网页上下文不安全（非 HTTPS/localhost）
    if (errorName === 'TypeError') {
      return {
        type: 'insecure_context',
        title: '环境不支持',
        message: '当前网页环境不安全，无法访问媒体设备。请确保通过 HTTPS 或 localhost 访问。'
      };
    }

    // 其他未知错误
    return {
      type: 'unknown',
      title: '获取设备失败',
      message: `无法访问摄像头或麦克风 (${errorName}: ${errorMsg})。请刷新页面后重试。`
    };
  };

  // 创建 RTCPeerConnection 配置（局域网无需 STUN/TURN）
  const createPeerConnection = useCallback((targetSocketId) => {
    if (peerConnectionsRef.current.has(targetSocketId)) {
      return peerConnectionsRef.current.get(targetSocketId).pc;
    }

    const pc = new RTCPeerConnection({
      iceServers: [] // 局域网直连，不需要 STUN
    });

    // 添加本地流到连接
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // 收集远程流
    pc.ontrack = (event) => {
      console.log(`[Video] ontrack 触发! 来自 ${targetSocketId}, track kind=${event.track.kind}`);
      setRemoteStreams(prev => {
        const updated = new Map(prev);
        const remoteStream = event.streams[0] || new MediaStream();

        if (!updated.has(targetSocketId)) {
          // 首次收到轨道，创建完整条目
          updated.set(targetSocketId, {
            stream: remoteStream,
            socketId: targetSocketId,
            userId: null,
            username: null,
            avatarId: null
          });
        } else {
          const entry = updated.get(targetSocketId);
          if (!entry.stream) {
            // 之前 stream 为 null（handleRoomInfo/handleOffer 预注册的），直接替换为真实流
            entry.stream = remoteStream;
          } else {
            // 已有流对象，追加轨道
            remoteStream.getTracks().forEach(track => {
              entry.stream.addTrack(track);
            });
          }
        }
        return updated;
      });
    };

    // ICE 候选
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('video:ice-candidate', {
          targetSocketId,
          candidate: event.candidate.toJSON()
        });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`[Video] 与 ${targetSocketId} 的连接状态: ${pc.connectionState}`);
    };

    peerConnectionsRef.current.set(targetSocketId, { pc });
    return pc;
  }, [socket]);

  // 加入视频房间
  const joinVideo = useCallback(async () => {
    if (!socket) return false;

    // 先清除之前的错误状态
    setPermissionError(null);
    setIsPermissionDenied(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 24 }
        },
        audio: true
      });

      localStreamRef.current = stream;
      setIsInCall(true);

      socket.emit('video:join');

      return true;
    } catch (err) {
      console.error('获取摄像头失败:', err);
      const parsedError = parseMediaError(err);
      setPermissionError(parsedError);
      setIsPermissionDenied(parsedError.type === 'permission_denied');
      return false;
    }
  }, [socket]);

  // 加入视频房间（仅音频降级方案）
  const joinVideoAudioOnly = useCallback(async () => {
    if (!socket) return false;

    setPermissionError(null);
    setIsPermissionDenied(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true
      });

      localStreamRef.current = stream;
      setIsInCall(true);
      socket.emit('video:join');
      return true;
    } catch (err) {
      console.error('获取麦克风失败:', err);
      const parsedError = parseMediaError(err);
      parsedError.title = parsedError.title.replace('摄像头或', '');
      parsedError.message = '麦克风也无法使用。' + parsedError.message;
      setPermissionError(parsedError);
      return false;
    }
  }, [socket]);

  // 离开视频房间
  const leaveVideo = useCallback(() => {
    // 停止所有远程流
    setRemoteStreams(new Map());

    // 关闭所有 PeerConnection
    for (const [, { pc }] of peerConnectionsRef.current) {
      pc.close();
    }
    peerConnectionsRef.current.clear();

    // 停止本地流
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    // 通知服务端离开
    if (socket && isInCall) {
      socket.emit('video:leave');
    }
    setIsInCall(false);
  }, [socket, isInCall]);

  // 切换摄像头
  const toggleCamera = useCallback(() => {
    if (!localStreamRef.current) return;

    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      // 更新所有已建立的连接中的轨道
      for (const [, { pc }] of peerConnectionsRef.current) {
        const senders = pc.getSenders();
        senders.forEach(sender => {
          if (sender.track && sender.track.kind === 'video') {
            sender.track.enabled = videoTrack.enabled;
          }
        });
      }
    }
  }, []);

  // 切换麦克风
  const toggleMic = useCallback(() => {
    if (!localStreamRef.current) return;

    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      // 更新所有已建立的连接中的轨道
      for (const [, { pc }] of peerConnectionsRef.current) {
        const senders = pc.getSenders();
        senders.forEach(sender => {
          if (sender.track && sender.track.kind === 'audio') {
            sender.track.enabled = audioTrack.enabled;
          }
        });
      }
    }
  }, []);

  // 判断当前用户是否应作为 caller（主动发 offer 的一方）
  // 使用 socket.id 字符串比较，保证每对用户间只有一人发起连接，避免双向 glare
  const shouldInitiateCall = useCallback((targetSocketId) => {
    if (!socket?.id) return false;
    return socket.id > targetSocketId;
  }, [socket]);

  // 设置信令事件监听
  useEffect(() => {
    if (!socket || !user) return;

    // 收到当前已在视频房间的参与者列表
    const handleRoomInfo = async ({ participants }) => {
      if (!localStreamRef.current) return;

      // 对每个已有参与者：只在自己作为 caller 时才主动发 offer
      for (const participant of participants) {
        // 先注册用户信息（不管是不是 caller，都要显示占位格）
        setRemoteStreams(prev => {
          const updated = new Map(prev);
          if (!updated.has(participant.socketId)) {
            updated.set(participant.socketId, {
              stream: null,
              userId: participant.userId,
              username: participant.username,
              avatarId: participant.avatarId,
              socketId: participant.socketId
            });
          } else {
            const existing = updated.get(participant.socketId);
            updated.set(participant.socketId, { ...existing, ...participant, socketId: participant.socketId });
          }
          return updated;
        });

        // 只有 caller 才发起连接，callee 等待对方发 offer
        if (!shouldInitiateCall(participant.socketId)) {
          console.log(`[Video] 我是 callee，等待 ${participant.username} 发起连接`);
          continue;
        }

        try {
          const pc = createPeerConnection(participant.socketId);

          // 创建 offer
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);

          // 发送 offer
          socket.emit('video:offer', {
            targetSocketId: participant.socketId,
            sdp: offer.toJSON()
          });

          console.log(`[Video] 向 ${participant.username} 发送 offer (我是 caller)`);
        } catch (err) {
          console.error(`创建与 ${participant.username} 的连接失败:`, err);
        }
      }
    };

    // 新用户加入视频
    const handleUserJoined = async ({ userId, username, avatarId, socketId: newSocketId }) => {
      if (!localStreamRef.current) return;

      // 无论 caller 还是 callee，都预注册用户信息让 UI 显示占位格
      setRemoteStreams(prev => {
        const updated = new Map(prev);
        if (!updated.has(newSocketId)) {
          updated.set(newSocketId, {
            stream: null,
            userId,
            username,
            avatarId,
            socketId: newSocketId
          });
        }
        return updated;
      });

      // 只有 caller 才主动发 offer，calle 等对方发来 offer 后再回 answer
      if (!shouldInitiateCall(newSocketId)) {
        console.log(`[Video] 我是 callee，等待 ${username} 发起连接`);
        return;
      }

      try {
        const pc = createPeerConnection(newSocketId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit('video:offer', {
          targetSocketId: newSocketId,
          sdp: offer.toJSON()
        });

        console.log(`[Video] 向 ${username} 发送 offer (我是 caller)`);
      } catch (err) {
        console.error(`向 ${username} 发送 offer 失败:`, err);
      }
    };

    // 收到 offer → 创建 answer (作为 callee 响应)
    const handleOffer = async ({ fromSocketId, fromUserId, fromUsername, sdp }) => {
      try {
        console.log(`[Video] 收到 ${fromUsername || '用户'} 的 offer`);
        const pc = createPeerConnection(fromSocketId);
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        // 记录发送者信息
        setRemoteStreams(prev => {
          const updated = new Map(prev);
          if (!updated.has(fromSocketId)) {
            updated.set(fromSocketId, {
              stream: null,
              userId: fromUserId,
              username: fromUsername,
              avatarId: null,
              socketId: fromSocketId
            });
          } else {
            const existing = updated.get(fromSocketId);
            updated.set(fromSocketId, { ...existing, userId: fromUserId, username: fromUsername });
          }
          return updated;
        });

        socket.emit('video:answer', {
          targetSocketId: fromSocketId,
          sdp: answer.toJSON()
        });

        console.log(`[Video] 已向 ${fromUsername || '用户'} 发送 answer (我是 callee)`);
      } catch (err) {
        console.error(`处理 offer 失败:`, err);
      }
    };

    // 收到 answer → 设为远端描述 (caller 收到 callee 的响应)
    const handleAnswer = async ({ fromSocketId, sdp }) => {
      const entry = peerConnectionsRef.current.get(fromSocketId);
      if (entry?.pc) {
        await entry.pc.setRemoteDescription(new RTCSessionDescription(sdp));
        console.log(`[Video] 收到来自 ${fromSocketId} 的 answer，连接协商完成`);
      } else {
        console.warn(`[Video] 收到未知连接的 answer:`, fromSocketId);
      }
    };

    // 收到 ICE 候选
    const handleIceCandidate = async ({ fromSocketId, candidate }) => {
      const entry = peerConnectionsRef.current.get(fromSocketId);
      if (entry?.pc) {
        await entry.pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    };

    // 用户离开视频
    const handleUserLeft = ({ userId: leftUserId, socketId: leftSocketId }) => {
      // 关闭对应的 PeerConnection
      const entry = peerConnectionsRef.current.get(leftSocketId);
      if (entry) {
        entry.pc.close();
        peerConnectionsRef.current.delete(leftSocketId);
      }

      // 移除远程流
      setRemoteStreams(prev => {
        const updated = new Map(prev);
        updated.delete(leftSocketId);
        return updated;
      });
    };

    socket.on('video:room-info', handleRoomInfo);
    socket.on('video:user-joined', handleUserJoined);
    socket.on('video:offer', handleOffer);
    socket.on('video:answer', handleAnswer);
    socket.on('video:ice-candidate', handleIceCandidate);
    socket.on('video:user-left', handleUserLeft);

    return () => {
      socket.off('video:room-info', handleRoomInfo);
      socket.off('video:user-joined', handleUserJoined);
      socket.off('video:offer', handleOffer);
      socket.off('video:answer', handleAnswer);
      socket.off('video:ice-candidate', handleIceCandidate);
      socket.off('video:user-left', handleUserLeft);
    };
  }, [socket, user, createPeerConnection, shouldInitiateCall]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      leaveVideo();
    };
  }, []);

  return {
    localStream: localStreamRef.current,
    remoteStreams,
    isInCall,
    joinVideo,
    leaveVideo,
    toggleCamera,
    toggleMic,
    permissionError,
    isPermissionDenied,
    joinVideoAudioOnly
  };
}

// 主组件：群视频通话室
export default function VideoRoom({ socket, user, onClose }) {
  const {
    localStream,
    remoteStreams,
    isInCall,
    joinVideo,
    leaveVideo,
    toggleCamera,
    toggleMic,
    permissionError,    // 权限错误信息
    isPermissionDenied,  // 是否为权限拒绝
    joinVideoAudioOnly  // 仅音频降级方案
  } = useWebRTC({ socket, user });

  const [isJoined, setIsJoined] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  // 放大查看状态: null 表示未放大，否则为被放大的视频 tile 数据
  const [focusedTile, setFocusedTile] = useState(null);

  // 加入视频
  const handleJoin = async () => {
    const success = await joinVideo();
    if (success) {
      setIsJoined(true);
    }
  };

  // 离开视频
  const handleLeave = () => {
    leaveVideo();
    setIsJoined(false);
    onClose?.();
  };

  // 切换摄像头
  const handleToggleCamera = () => {
    toggleCamera();
    setIsCameraOn(prev => !prev);
  };

  // 切换麦克风
  const handleToggleMic = () => {
    toggleMic();
    setIsMicOn(prev => !prev);
  };

  // 计算总参与人数（自己 + 远程）
  const participantCount = isJoined
    ? 1 + remoteStreams.size
    : 0;

  // 构建视频网格数据：本地 + 所有远程
  const videoTiles = [];

  // 本地视频
  if (isJoined) {
    videoTiles.push({
      key: 'local',
      stream: localStream,
      username: user?.username || '我',
      avatarId: user?.avatarId || 'bear',
      isLocal: true,
      isMuted: !isMicOn,
      isCameraOff: !isCameraOn
    });
  }

  // 远程视频
  for (const [sockId, info] of remoteStreams) {
    videoTiles.push({
      key: sockId,
      stream: info.stream,
      username: info.username || `用户`,
      avatarId: info.avatarId || 'bear',
      isLocal: false,
      isMuted: false,
      isCameraOff: false
    });
  }

  // 未加入时的预览界面
  if (!isJoined) {
    return (
      <div className="video-room" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="video-room-content">
          <div className="video-lobby">
            <Avatar avatarId="group" size={80} />
            <h2>群视频通话</h2>
            <p>开启摄像头，与在线好友面对面聊天</p>

            {/* 权限错误提示面板 */}
            {permissionError && (
              <div className={`permission-error-panel ${permissionError.type}`}>
                <div className="error-icon">
                  {permissionError.hint === 'incognito' ? (
                    // 无痕模式图标
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ff9500" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  ) : permissionError.hint === 'permission' ? (
                    // 权限被拒图标
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ff3b30" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
                      <line x1="12" y1="2" x2="12" y2="6" />
                      <line x1="23" y1="13" x2="17" y2="13" />
                      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10v11h11l4.36-4.36a9 9 0 0 0 4.13-6.64z" />
                    </svg>
                  ) : (
                    // 通用错误图标
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ff9500" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  )}
                </div>
                <h3 className="error-title">{permissionError.title}</h3>
                <div className="error-message">{permissionError.message}</div>

                {/* 针对性解决方案 */}
                {permissionError.hint === 'incognito' && (
                  <div className="error-solution">
                    <div className="solution-steps">
                      <span>解决步骤：</span>
                      <ol>
                        <li>关闭当前无痕/隐私窗口</li>
                        <li>在浏览器<strong>普通窗口</strong>中重新打开本页面</li>
                        <li>点击下方"开启视频"按钮</li>
                      </ol>
                    </div>
                    <div className="browser-tips">
                      <span className="browser-name">Chrome/Edge</span>
                      <code>按 Ctrl+Shift+N 打开的是无痕窗口</code>
                    </div>
                  </div>
                )}

                {permissionError.hint === 'permission' && (
                  <div className="error-solution">
                    <div className="solution-steps">
                      <span>解决步骤：</span>
                      <ol>
                        <li>查看浏览器地址栏左侧是否有摄像头/麦克风 blocked 图标</li>
                        <li><strong>点击该图标</strong> → 选择"允许"</li>
                        <li>刷新本页面后重试</li>
                      </ol>
                    </div>
                  </div>
                )}

                {(permissionError.type === 'device_not_found' || permissionError.type === 'device_busy') && (
                  <div className="error-solution">
                    <button
                      className="retry-without-camera"
                      onClick={() => {
                        setPermissionError(null);
                        // 尝试仅获取音频（降级方案）
                        joinVideoAudioOnly?.();
                      }}
                    >
                      仅使用麦克风加入语音通话
                    </button>
                  </div>
                )}

                <button className="dismiss-error-btn" onClick={() => setPermissionError(null)}>
                  知道了
                </button>
              </div>
            )}

            <button className="video-start-btn" onClick={handleJoin}>
              <Icons.Video size={22} />
              开启视频
            </button>
            <p className="video-hint">需要浏览器授权摄像头和麦克风权限</p>
          </div>
        </div>
      </div>
    );
  }

  // 已加入的视频通话界面
  return (
    <div className="video-room active" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="video-room-content">
        {/* 视频网格 */}
        <div className={`video-grid grid-${Math.min(Math.max(videoTiles.length, 1), 9)}`}>
          {videoTiles.map(tile => (
            <VideoTile
              key={tile.key}
              {...tile}
              onClick={() => setFocusedTile(tile)}
            />
          ))}
        </div>

        {/* 放大查看全屏覆盖层 */}
        {focusedTile && (
          <div className="video-focus-overlay" onClick={() => setFocusedTile(null)}>
            <div className="video-focus-content" onClick={(e) => e.stopPropagation()}>
              {/* 放大的视频 */}
              {focusedTile.stream ? (
                <FocusVideoPlayer
                  stream={focusedTile.stream}
                  username={focusedTile.username}
                  avatarId={focusedTile.avatarId}
                  isLocal={focusedTile.isLocal}
                />
              ) : (
                <div className="focus-no-video">
                  <Avatar avatarId={focusedTile.avatarId} size={120} />
                  <span className="focus-name">{focusedTile.username}</span>
                  <span className="focus-hint">该用户未开启摄像头</span>
                </div>
              )}
              {/* 顶部信息栏 */}
              <div className="focus-header">
                <div className="focus-user-info">
                  <Avatar avatarId={focusedTile.avatarId} size={32} />
                  <span>{focusedTile.username}</span>
                  {focusedTile.isLocal && <span className="focus-badge">我</span>}
                </div>
                <button className="focus-close-btn" onClick={() => setFocusedTile(null)} title="关闭放大">
                  <Icons.Minimize size={18} />
                  还原
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 控制栏 */}
        <VideoControls
          isCameraOn={isCameraOn}
          isMicOn={isMicOn}
          onToggleCamera={handleToggleCamera}
          onToggleMic={handleToggleMic}
          onLeave={handleLeave}
          participantCount={participantCount}
        />
      </div>
    </div>
  );
}
