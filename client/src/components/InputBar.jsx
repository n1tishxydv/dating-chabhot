import { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Smile, Mic, MicOff } from 'lucide-react';

const InputBar = ({ onSendMessage, isLoading, chatMode }) => {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const onSendMessageRef = useRef(onSendMessage);

  // Keep ref up to date to avoid stale closure in onresult
  useEffect(() => {
    onSendMessageRef.current = onSendMessage;
  }, [onSendMessage]);

  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        setText(finalTranscript || interimTranscript);
        
        if (finalTranscript) {
          onSendMessageRef.current(finalTranscript);
          setText('');
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListen = () => {
    if (chatMode === 'chat') return; // Just in case
    
    if (!recognitionRef.current) {
      alert("Your browser doesn't support Speech Recognition. Please use Chrome or Edge.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setText('');
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error("Microphone start error:", e);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim() && !isLoading) {
      onSendMessage(text);
      setText('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form className="input-section" onSubmit={handleSubmit}>
      <div className={`input-container ${isListening ? 'listening' : ''}`}>
        <button type="button" className="icon-btn text-secondary" style={{ marginRight: '8px' }}>
          <ImageIcon size={20} />
        </button>
        
        <input
          ref={inputRef}
          type="text"
          className="chat-input"
          placeholder={isListening ? "Listening..." : "Message ira..."}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading || isListening}
        />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '8px' }}>
          {isListening ? (
            <button 
              type="button" 
              className="icon-btn recording-active"
              onClick={toggleListen}
              disabled={isLoading}
            >
              <MicOff size={20} color="var(--primary)" />
            </button>
          ) : (
            <button 
              type="button" 
              className="icon-btn text-secondary"
              onClick={toggleListen}
              disabled={isLoading}
            >
              <Mic size={20} />
            </button>
          )}

          <button type="button" className="icon-btn text-secondary">
            <Smile size={20} />
          </button>

          <button type="submit" className={`send-btn ${text.trim() ? 'active' : ''}`} disabled={isLoading || !text.trim()}>
            <Send size={16} />
          </button>
        </div>
      </div>
    </form>
  );
};

export default InputBar;
