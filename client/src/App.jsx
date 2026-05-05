import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ref, onValue, push } from 'firebase/database';
import { signInWithPopup, signOut as fbSignOut, onAuthStateChanged } from 'firebase/auth';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { db, auth, googleProvider } from './firebase';
import { detectEmotion } from './utils/emotion';
import { MODES } from './components/PersonalitySelector';
import AnalyticsModal from './components/AnalyticsModal';
import ChatPage from './pages/ChatPage';
import VoicePage from './pages/VoicePage';
import OnboardingPage from './pages/OnboardingPage';
import { useChat } from './hooks/useChat';

const getUserId = () => {
  let id = localStorage.getItem('ira_userId');
  if (!id) {
    id = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('ira_userId', id);
  }
  return id;
};

function App() {
  const [messages, setMessages] = useState([]);
  const { chatState, setChatState, apiError, setApiError, sendMessage } = useChat();
  const [chatMode, setChatMode] = useState('chat'); // 'chat' | 'voice'
  const [personalityMode, setPersonalityMode] = useState(MODES.FRIENDLY);
  const [scenarioMode, setScenarioMode] = useState('None');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [userEmotion, setUserEmotion] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [user, setUser] = useState(null);
  const [localUserId] = useState(getUserId());
  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('ira_profile');
    return saved ? JSON.parse(saved) : null;
  });
  
  const currentUserId = user ? user.uid : localUserId;
  const audioRef = useRef(null);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    // Server Pre-warming on load
    fetch('/api/ping').catch(() => {});

    // Background Keep-alive
    const keepAliveInterval = setInterval(() => {
      if (!document.hidden) {
        fetch('/api/ping').catch(() => {});
      }
    }, 4 * 60 * 1000); // Every 4 minutes

    return () => {
      unsubscribeAuth();
      clearInterval(keepAliveInterval);
    };
  }, []);

  useEffect(() => {
    const chatsRef = ref(db, `users/${currentUserId}/chats`);
    const unsubscribe = onValue(chatsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const now = Date.now();
        const TWELVE_HOURS = 12 * 60 * 60 * 1000;
        
        const messageList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }))
        // Filter out messages older than 12 hours
        .filter(msg => (now - msg.timestamp) < TWELVE_HOURS)
        .sort((a, b) => a.timestamp - b.timestamp);
        
        setMessages(messageList);
      } else {
        setMessages([]);
      }
    });

    return () => unsubscribe();
  }, [currentUserId]);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Auth Error", error);
    }
  };

  const handleSignOut = async () => {
    try {
      if (auth.currentUser) {
        await fbSignOut(auth);
      }
      localStorage.removeItem('ira_profile');
      setUserProfile(null);
    } catch (error) {
      console.error("SignOut Error", error);
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const fallbackSpeakText = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    
    // Remove emojis
    const cleanText = text.replace(/[\u1000-\uFFFF]+/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => 
      v.name.includes('Female') || v.name.includes('Google UK English Female') || v.name.includes('Zira') || v.name.includes('Samantha')
    ) || voices.find(v => v.lang.startsWith('en'));
    
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.rate = 1.0;
    utterance.pitch = 1.1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  };

  const playVoice = async (text, emotion) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    try {
      setIsSpeaking(true);
      const response = await axios.post('/speak', { 
        text, 
        emotion,
        aiGender: userProfile?.aiGender || 'Female' 
      }, { responseType: 'blob' });
      
      const audioUrl = URL.createObjectURL(response.data);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.onerror = () => setIsSpeaking(false);

      await audio.play();
    } catch (err) {
      console.error("ElevenLabs failed, falling back to native TTS.");
      
      if (err.response && err.response.data instanceof Blob) {
        const errText = await err.response.data.text();
        try {
          const errorJson = JSON.parse(errText);
          console.warn("ElevenLabs Error:", errorJson.error);
        } catch(e) {}
      }
      
      // Fallback to browser TTS so the user still hears the voice
      fallbackSpeakText(text);
    }
  };

  const stopVoice = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
  };

  const handleSendMessage = async (text) => {
    if (!text.trim()) return;

    stopVoice();

    const emotion = detectEmotion(text);
    if (emotion !== 'neutral') {
      setUserEmotion(emotion);
    }

    const chatsRef = ref(db, `users/${currentUserId}/chats`);
    await push(chatsRef, {
      text: text,
      sender: 'user',
      emotion: emotion || 'neutral',
      type: 'chat',
      timestamp: Date.now()
    });

    try {
      const data = await sendMessage({ 
        userId: currentUserId,
        userName: userProfile?.name || 'User',
        aiGender: userProfile?.aiGender || 'Female',
        aiName: userProfile?.aiName || 'ira',
        message: text,
        emotion: emotion !== 'neutral' ? emotion : userEmotion,
        mode: chatMode,
        personality: personalityMode,
        scenario: scenarioMode
      });
      
      if (data.shouldSpeak && data.voiceText) {
        // Add a slight realistic delay before voice begins (300ms)
        setTimeout(() => {
          playVoice(data.voiceText, data.emotion);
        }, 300);
      }

      // Process the multi-message sequence
      const replies = data.reply || [];
      for (let i = 0; i < replies.length; i++) {
        const msgText = replies[i];
        
        // Dynamic delay based on length
        let delay = 500;
        if (msgText.length < 20) delay = 400 + Math.random() * 400; // 400-800ms
        else if (msgText.length < 50) delay = 800 + Math.random() * 700; // 800-1500ms
        else delay = 1500 + Math.random() * 1000; // 1500-2500ms

        setIsLoading(true); // Show typing indicator
        await new Promise(r => setTimeout(r, delay));
        
        // Push this chunk to Firebase
        await push(chatsRef, {
          text: msgText,
          sender: 'ai',
          emotion: data.emotion || 'neutral',
          type: chatMode === 'voice' ? 'voice' : 'chat',
          timestamp: Date.now()
        });

        // Small pause between multiple messages, unless it's the last one
        if (i < replies.length - 1) {
          await new Promise(r => setTimeout(r, 400));
        }
      }

    } catch (error) {
      console.error('Chat error:', error);
      // error handling is managed by useChat, which sets apiError
    } finally {
      setChatState('idle');
    }
  };

  // Filter messages for Chat Area (exclude voice messages)
  const chatMessages = messages.filter(m => m.type !== 'voice');

  return (
    <Router>
      <div className={`app-wrapper theme-${theme}`}>
        <Routes>
          <Route path="/" element={
            !userProfile ? (
              <OnboardingPage onComplete={(profile) => setUserProfile(profile)} />
            ) : (
              <ChatPage 
                chatMode={chatMode} 
                setChatMode={setChatMode} 
                isSpeaking={isSpeaking} 
                userEmotion={userEmotion}
                onToggleAnalytics={() => setShowAnalytics(true)}
                personalityMode={personalityMode}
                setPersonalityMode={setPersonalityMode}
                scenarioMode={scenarioMode}
                setScenarioMode={setScenarioMode}
                theme={theme}
                toggleTheme={toggleTheme}
                user={user}
                signIn={handleSignIn}
                signOut={handleSignOut}
                messages={chatMessages}
                chatState={chatState}
                handleSendMessage={handleSendMessage}
                userProfile={userProfile}
                setUserProfile={setUserProfile}
                apiError={apiError}
              />
            )
          } />
          <Route path="/voice" element={
            !userProfile ? (
              <OnboardingPage onComplete={(profile) => setUserProfile(profile)} />
            ) : (
              <VoicePage 
                currentUserId={currentUserId}
                personalityMode={personalityMode}
                theme={theme}
                userProfile={userProfile}
              />
            )
          } />
        </Routes>
        
        <AnalyticsModal 
          isOpen={showAnalytics} 
          onClose={() => setShowAnalytics(false)} 
          messages={messages} 
        />
      </div>
    </Router>
  );
}

export default App;
