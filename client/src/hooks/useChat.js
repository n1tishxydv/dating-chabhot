import { useState } from 'react';
import { fetchWithRetry } from '../utils/fetchWithRetry';

export const useChat = () => {
  const [chatState, setChatState] = useState('idle'); // idle, thinking, connecting, typing
  const [apiError, setApiError] = useState(null);

  const sendMessage = async (payload) => {
    setChatState('thinking');
    setApiError(null);

    // If it takes more than 1.5 seconds, switch to connecting state
    const connectingTimeout = setTimeout(() => {
      setChatState((prev) => (prev === 'thinking' ? 'connecting' : prev));
    }, 1500);

    try {
      const data = await fetchWithRetry('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }, 3, 15000);

      clearTimeout(connectingTimeout);

      // Cache successful response
      if (data && data.reply) {
        localStorage.setItem('ira_last_response', JSON.stringify(data.reply));
      }

      setChatState('typing');
      return data;
    } catch (error) {
      clearTimeout(connectingTimeout);
      setChatState('idle');
      
      // Fallback to cache
      const cached = localStorage.getItem('ira_last_response');
      if (cached) {
        try {
          const cachedReplies = JSON.parse(cached);
          setApiError("Offline mode: showing last response.");
          return { success: true, reply: cachedReplies, emotion: 'neutral', shouldSpeak: false };
        } catch (e) {}
      }

      setApiError(error.message || "Still connecting... give me a moment");
      throw error;
    }
  };

  return { chatState, setChatState, apiError, setApiError, sendMessage };
};
