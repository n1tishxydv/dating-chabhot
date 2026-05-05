import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic } from 'lucide-react';
import Header from '../components/Header';
import ChatContainer from '../components/ChatContainer';
import InputBar from '../components/InputBar';
import SuggestionsBar from '../components/SuggestionsBar';

const ChatPage = ({
  chatMode,
  setChatMode,
  isSpeaking,
  userEmotion,
  onToggleAnalytics,
  personalityMode,
  setPersonalityMode,
  scenarioMode,
  setScenarioMode,
  theme,
  toggleTheme,
  user,
  signIn,
  signOut,
  messages,
  chatState,
  handleSendMessage,
  userProfile,
  setUserProfile,
  apiError
}) => {
  const navigate = useNavigate();

  return (
    <div className="chat-app">
      <Header 
        chatMode={chatMode} 
        setChatMode={setChatMode} 
        isSpeaking={isSpeaking} 
        userEmotion={userEmotion}
        onToggleAnalytics={onToggleAnalytics}
        personalityMode={personalityMode}
        setPersonalityMode={setPersonalityMode}
        scenarioMode={scenarioMode}
        setScenarioMode={setScenarioMode}
        theme={theme}
        toggleTheme={toggleTheme}
        user={user}
        signIn={signIn}
        signOut={signOut}
        userProfile={userProfile}
        setUserProfile={setUserProfile}
      />
      <ChatContainer messages={messages} chatState={chatState} userProfile={userProfile} apiError={apiError} />
      
      <SuggestionsBar 
        messages={messages} 
        isTyping={chatState !== 'idle'} 
        onSendSuggestion={handleSendMessage} 
      />
      <InputBar onSendMessage={handleSendMessage} isLoading={chatState !== 'idle'} chatMode={chatMode} />
    </div>
  );
};

export default ChatPage;
