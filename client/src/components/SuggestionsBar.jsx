import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { generateSuggestions } from '../utils/suggestions';

const SuggestionsBar = ({ messages, onSendSuggestion, isTyping }) => {
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (messages.length === 0 || isTyping) {
      setSuggestions([]);
      return;
    }

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.sender === 'ai') {
      const options = generateSuggestions(lastMessage.text);
      setSuggestions(options);
    } else {
      setSuggestions([]);
    }
  }, [messages, isTyping]);

  if (suggestions.length === 0) return null;

  return (
    <div className="suggestions-bar">
      <Sparkles size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
      <div className="suggestions-list">
        {suggestions.map((s, idx) => (
          <button key={idx} className="suggestion-chip" onClick={() => onSendSuggestion(s)}>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SuggestionsBar;
