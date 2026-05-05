import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';

const ChatContainer = ({ messages, isLoading, userProfile, apiError }) => {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="chat-container">
      {messages.length === 0 ? (
        <div className="welcome-message">
          Hi {userProfile?.name || 'there'}, I'm {userProfile?.aiName || 'ira'}. Let's chat!
        </div>
      ) : (
        messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))
      )}
      
      {isLoading && (
        <div className="message-wrapper ai">
          <div className="typing-indicator">
            <span className="typing-text">ira is typing</span>
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        </div>
      )}
      
      {apiError && (
        <div className="error-banner" style={{
          backgroundColor: 'rgba(255, 59, 48, 0.1)',
          color: '#ff3b30',
          padding: '10px 15px',
          borderRadius: '12px',
          margin: '10px 20px',
          textAlign: 'center',
          fontSize: '0.9rem',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 59, 48, 0.2)'
        }}>
          {apiError}
        </div>
      )}
      
      <div ref={bottomRef} />
    </div>
  );
};

export default ChatContainer;
