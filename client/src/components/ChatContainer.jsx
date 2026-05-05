import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';

const ChatContainer = ({ messages, isLoading, userProfile }) => {
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
      
      <div ref={bottomRef} />
    </div>
  );
};

export default ChatContainer;
