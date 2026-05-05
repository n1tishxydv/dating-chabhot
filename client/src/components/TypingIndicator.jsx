import React from 'react';

const TypingIndicator = ({ state, aiName }) => {
  if (state === 'idle') return null;

  let text = `${aiName} is typing`;
  if (state === 'thinking') text = `${aiName} is thinking`;
  if (state === 'connecting') text = `Connecting`;

  return (
    <div className="message-wrapper ai fade-in">
      <div className="typing-indicator">
        <span className="typing-text">{text}</span>
        <span className="dot"></span>
        <span className="dot"></span>
        <span className="dot"></span>
      </div>
    </div>
  );
};

export default TypingIndicator;
