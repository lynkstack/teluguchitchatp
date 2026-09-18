import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { Send, Image as ImageIcon, Smile, Sticker } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { encryptMessage } from '../utils/crypto';

const STICKERS = [
  'https://media.giphy.com/media/l4pTfx2qLszoacZRS/giphy.gif',
  'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif',
  'https://media.giphy.com/media/xT0xeJpnrWC4XWblEk/giphy.gif',
  'https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif',
  'https://media.giphy.com/media/mlvseq9yvZhba/giphy.gif',
  'https://media.giphy.com/media/3o6Zt481isNVuQI1l6/giphy.gif',
  'https://media.giphy.com/media/13CoXDiaCcCoyk/giphy.gif',
  'https://media.giphy.com/media/BzyTuYCmvSORqs1Q/giphy.gif',
  'https://media.giphy.com/media/26AHONQ79FdWZhAI0/giphy.gif',
  'https://media.giphy.com/media/VbnUQpnihPSIgIXuZv/giphy.gif',
  'https://media.giphy.com/media/Ge86XF8AVY1KE/giphy.gif',
  'https://media.giphy.com/media/ICOgUNjpvO0PC/giphy.gif',
  'https://media.giphy.com/media/V80llXf734WzK/giphy.gif',
  'https://media.giphy.com/media/11s7Ke7jcNxCHS/giphy.gif',
  'https://media.giphy.com/media/l0ExhcMymdL6TrZ84/giphy.gif',
  'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif',
  'https://media.giphy.com/media/3o72FkiK6GcvpgyaJi/giphy.gif',
  'https://media.giphy.com/media/QvBoMEcQ7DQXK/giphy.gif'
];

const MessageInput = ({ socket, activeChat, isGroup, activeGroup, onInitiateCall, replyingTo, onClearReply, otherUser, onOptimisticMessage }) => {
  const { user, token } = useAuth();
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const fileInputRef = useRef(null);

  const isRestrictedByAdmin = isGroup && activeGroup?.send_messages_permission === 'admins_only' && activeGroup?.myRole !== 'admin';

  const handleSendText = () => {
    if (!text.trim() || isRestrictedByAdmin) return;
    sendMessage({ text: text.trim() });
    setText('');
  };

  const sendMessage = async (content) => {
    if (isRestrictedByAdmin) return;
    let messageText = content.text;
    
    // Encrypt private messages if otherUser has a public key
    if (!isGroup && activeChat !== 'home' && otherUser?.public_key && messageText) {
      try {
        messageText = await encryptMessage(messageText, otherUser.public_key);
      } catch (err) {
        console.error("Encryption failed:", err);
        alert("Failed to encrypt message. Please try again.");
        return;
      }
    }

    const tempId = 'temp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    const baseData = {
      id: tempId,
      tempId,
      sender: user ? user.username : `Guest-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      ...(replyingTo && { reply_to: replyingTo }),
      ...content,
      text: messageText
    };

    if (onClearReply) onClearReply();

    let room = 'home_chat';
    let recipientId = null;
    if (activeChat === 'home') {
      room = 'home_chat';
    } else if (isGroup) {
      room = activeChat;
    } else {
      const isStranger = activeChat.startsWith('stranger_');
      room = isStranger ? activeChat : [user?.id || user?._id, activeChat].sort().join('_');
      recipientId = isStranger ? null : activeChat;
    }

    const payload = {
      ...baseData,
      room,
      senderId: user?.id || user?._id,
      recipientId
    };

    // 1. Instant Optimistic UI Update for sender
    if (onOptimisticMessage) {
      onOptimisticMessage(payload, activeChat);
    }

    // 2. Realtime socket emission & broadcast
    if (socket) {
      if (activeChat === 'home') {
        socket.emit('send_message', payload);
      } else if (isGroup) {
        if (user) socket.emit('send_group_message', payload);
      } else {
        if (user) socket.emit('send_private_message', payload);
      }
    }

    // 3. HTTP POST to guarantee database persistence
    if (token && user && !room.startsWith('stranger_')) {
      axios.post('/api/messages', payload, {
        headers: { 'x-auth-token': token }
      }).catch(err => {
        console.warn('REST message delivery notice:', err.message);
      });
    }
  };

  const { chatSettings } = useSettings();
  const enterToSend = chatSettings?.enterToSend !== false;

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (enterToSend) {
        e.preventDefault();
        handleSendText();
      }
    }
  };

  const handleImageClick = () => {
    if (!user || isRestrictedByAdmin) return;
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || isRestrictedByAdmin) return;

    const isViewOnce = window.confirm("Send this image as 'View Once'?");

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await axios.post('/api/media/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'x-auth-token': token
        }
      });
      sendMessage({ imageUrl: res.data.imageUrl, viewOnce: isViewOnce });
    } catch (err) {
      console.error('Upload failed', err);
      alert('Failed to upload image.');
    }
    e.target.value = '';
  };

  const handleGifClick = () => {
    if (!user || isRestrictedByAdmin) return;
    const url = prompt('Paste the direct URL of the GIF:');
    if (url) {
      sendMessage({ gifUrl: url });
    }
  };

  const handleEmojiToggle = () => {
    if (!user || isRestrictedByAdmin) return;
    setShowEmojiPicker(!showEmojiPicker);
    setShowStickerPicker(false);
  };

  const onEmojiClick = (emojiObject) => {
    setText(prev => prev + emojiObject.emoji);
  };

  const handleStickerClick = () => {
    if (!user || isRestrictedByAdmin) return;
    setShowStickerPicker(!showStickerPicker);
    setShowEmojiPicker(false);
  };

  const onStickerSelect = (url) => {
    sendMessage({ stickerUrl: url });
    setShowStickerPicker(false);
  };

  const isGuestInPrivate = !user && activeChat !== 'home';

  if (isRestrictedByAdmin) {
    return (
      <div style={{
        width: '100%', padding: '14px 20px', background: 'rgba(32, 44, 51, 0.95)',
        color: '#8696a0', textAlign: 'center', fontSize: '0.88rem', borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', gap: '8px'
      }}>
        <span>🔒 Only admins can send messages to this group</span>
      </div>
    );
  }

  return (
    <div className="input-area">
      <div className="input-wrapper">
        <button 
          type="button"
          className="action-btn-inline" 
          disabled={!user} 
          onClick={handleEmojiToggle}
          title={!user ? "Login to send Emojis" : "Emoji"}
        >
          <Smile size={20} />
        </button>

        <input 
          type="text" 
          className="chat-input" 
          placeholder={isGuestInPrivate ? "Login to chat privately" : "Type a message..."} 
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isGuestInPrivate}
        />
        
        <input 
          type="file" 
          accept="image/*" 
          style={{ display: 'none' }} 
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        
        <button 
          type="button"
          className="action-btn-inline" 
          disabled={!user} 
          onClick={handleImageClick}
          title={!user ? "Login to send images" : "Send Image"}
        >
          <ImageIcon size={20} />
        </button>

        <button 
          type="button"
          className="action-btn-inline" 
          disabled={!user} 
          onClick={handleStickerClick}
          title={!user ? "Login to send Stickers" : "Send Sticker"}
        >
          <Sticker size={20} />
        </button>
      </div>

      <button 
        type="button"
        className={`send-btn ${text.trim() ? 'has-text' : ''}`} 
        onClick={handleSendText} 
        disabled={isGuestInPrivate || !text.trim()}
        title="Send Message"
      >
        <Send size={18} />
      </button>

      {showEmojiPicker && (
        <div className="picker-container">
          <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" />
        </div>
      )}

      {showStickerPicker && (
        <div className="picker-container sticker-picker">
          <div className="sticker-grid">
            {STICKERS.map((url, i) => (
              <img key={i} src={url} alt="sticker" onClick={() => onStickerSelect(url)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageInput;
