import React from 'react';
import { useSettings } from '../context/SettingsContext';
import './SettingsMenu.css';

function ChatsMenu({ onClose }) {
  const { chatSettings, updateChatSetting } = useSettings();

  return (
    <div className="settings-modal-overlay" onClick={onClose}>
      <div className="settings-modal-content" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <button className="settings-back-btn" onClick={onClose}>
            ←
          </button>
          <h2 className="settings-title">Chats</h2>
        </div>

        <div className="settings-list">
          <div className="settings-group">
            <div className="settings-group-title">Chat settings</div>
            <div className="settings-group-box">
              <div className="settings-group-item">
                <div className="settings-item-row">
                  <div className="settings-item-text">
                    <div className="settings-item-title">Enter is send</div>
                    <div className="settings-item-subtitle">Enter key will send your message</div>
                  </div>
                  <input 
                    type="checkbox" 
                    className="settings-toggle" 
                    checked={chatSettings?.enterToSend !== false} 
                    onChange={(e) => updateChatSetting('enterToSend', e.target.checked)} 
                  />
                </div>
              </div>

              <div className="settings-group-item">
                <div className="settings-item-row">
                  <div className="settings-item-text">
                    <div className="settings-item-title">Media visibility</div>
                    <div className="settings-item-subtitle">Show newly downloaded media in gallery</div>
                  </div>
                  <input 
                    type="checkbox" 
                    className="settings-toggle" 
                    checked={chatSettings?.mediaAutoDownload !== false} 
                    onChange={(e) => updateChatSetting('mediaAutoDownload', e.target.checked)} 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="settings-group">
            <div className="settings-group-title">Display & Theme</div>
            <div className="settings-group-box">
              <div className="settings-group-item">
                <div className="settings-item-title">Font size</div>
                <div className="settings-item-subtitle">Medium</div>
              </div>
              <div className="settings-group-item">
                <div className="settings-item-title">Chat wallpaper</div>
                <div className="settings-item-subtitle">Standard default pattern</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatsMenu;
