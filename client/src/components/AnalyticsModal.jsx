import React from 'react';
import { X, Activity, MessageCircle, BarChart, Smile } from 'lucide-react';
import { getEmotionColorClass, emotionEmojis } from '../utils/emotion';

const AnalyticsModal = ({ isOpen, onClose, messages }) => {
  if (!isOpen) return null;

  const totalMessages = messages.length;
  const userMessages = messages.filter(m => m.sender === 'user');
  
  const avgLength = userMessages.length > 0 
    ? Math.round(userMessages.reduce((acc, m) => acc + (m.text?.length || 0), 0) / userMessages.length)
    : 0;

  const emotionCounts = userMessages.reduce((acc, m) => {
    if (m.emotion) {
      acc[m.emotion] = (acc[m.emotion] || 0) + 1;
    }
    return acc;
  }, {});

  let dominantEmotion = 'neutral';
  let maxCount = 0;
  for (const [emo, count] of Object.entries(emotionCounts)) {
    if (count > maxCount) {
      maxCount = count;
      dominantEmotion = emo;
    }
  }

  const engagementScore = Math.min(100, Math.round((totalMessages * 2) + (avgLength * 0.5)));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="analytics-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3><BarChart size={18} style={{marginRight: '8px'}} /> Insights</h3>
          <button className="icon-btn" onClick={onClose}><X size={20} /></button>
        </div>
        
        <div className="stats-grid">
          <div className="stat-card">
            <MessageCircle size={24} color="#a78bfa" style={{marginBottom: '8px'}} />
            <div className="stat-value">{totalMessages}</div>
            <div className="stat-label">Total Messages</div>
          </div>
          <div className="stat-card">
            <Activity size={24} color="#4ade80" style={{marginBottom: '8px'}} />
            <div className="stat-value">{avgLength}</div>
            <div className="stat-label">Avg Msg Length</div>
          </div>
          <div className={`stat-card message-bubble ${getEmotionColorClass(dominantEmotion)}`} style={{background: 'rgba(255,255,255,0.05)'}}>
            <Smile size={24} color="#facc15" style={{marginBottom: '8px'}} />
            <div className="stat-value" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}>
              {dominantEmotion} {emotionEmojis[dominantEmotion]}
            </div>
            <div className="stat-label">Dominant Mood</div>
          </div>
          <div className="stat-card">
            <BarChart size={24} color="#f87171" style={{marginBottom: '8px'}} />
            <div className="stat-value">{engagementScore}</div>
            <div className="stat-label">Engagement Score</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsModal;
