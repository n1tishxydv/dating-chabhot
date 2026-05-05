import { useState, useEffect } from 'react';
import { emotionEmojis, getEmotionColorClass } from '../utils/emotion';

const MessageBubble = ({ message }) => {
  const { text, sender, timestamp, emotion } = message;
  const [displayedText, setDisplayedText] = useState('');

  // Check if message is fresh (created within the last 2 seconds)
  const isFresh = Date.now() - timestamp < 2000;

  useEffect(() => {
    if (sender === 'ai' && isFresh) {
      let i = 0;
      setDisplayedText('');
      const interval = setInterval(() => {
        setDisplayedText(text.slice(0, i + 1));
        i++;
        if (i >= text.length) clearInterval(interval);
      }, 25); // 25ms per character

      return () => clearInterval(interval);
    } else {
      setDisplayedText(text);
    }
  }, [text, sender, isFresh]);

  const formattedTime = new Date(timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  const emotionClass = sender === 'ai' && emotion ? getEmotionColorClass(emotion) : '';

  return (
    <div className={`message-wrapper ${sender}`}>
      <div className={`message-bubble ${emotionClass}`}>
        <div className="message-text">
          {displayedText}
          {sender === 'ai' && isFresh && displayedText.length < text.length && (
            <span className="typewriter-cursor">|</span>
          )}
        </div>
        <div className="message-footer">
          {sender === 'ai' && emotion && emotionEmojis[emotion] && (
            <span className="emotion-icon" title={emotion}>{emotionEmojis[emotion]}</span>
          )}
          <span className="timestamp">{formattedTime}</span>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
