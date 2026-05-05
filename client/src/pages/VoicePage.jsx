import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, X, Activity } from 'lucide-react';
import CircularVisualizer from '../components/CircularVisualizer';
import { audioManager } from '../utils/audioManager';
import axios from 'axios';
import { detectEmotion } from '../utils/emotion';
import { ref, push } from 'firebase/database';
import { db } from '../firebase';

const VoicePage = ({ currentUserId, personalityMode, theme, userProfile }) => {
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [statusText, setStatusText] = useState('Tap Mic to Start');

  const recognitionRef = useRef(null);
  const silenceTimeoutRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    // Session Timer
    timerRef.current = setInterval(() => {
      setSessionTime((prev) => prev + 1);
    }, 1000);

    // Initialize Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setStatusText('Listening...');
      };

      recognition.onresult = (event) => {
        clearTimeout(silenceTimeoutRef.current);
        
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
          handleVoiceInput(finalTranscript);
          recognition.stop();
        } else {
          // Restart silence timeout if still interim
          silenceTimeoutRef.current = setTimeout(() => {
            recognition.stop();
          }, 3000); // 3 seconds of silence stops listening
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        if (event.error !== 'no-speech') {
          setIsListening(false);
          setStatusText('Error listening. Try again.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        if (!isSpeaking) {
           setStatusText('Tap Mic to Speak');
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      clearInterval(timerRef.current);
      clearTimeout(silenceTimeoutRef.current);
      if (recognitionRef.current) recognitionRef.current.stop();
      audioManager.stop();
    };
  }, []);

  const toggleListen = () => {
    if (isSpeaking) return; // Prevent listening while AI speaks
    
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
      } catch (e) {
        console.error("Mic start error", e);
      }
    }
  };

  const handleVoiceInput = async (text) => {
    if (!text.trim()) return;
    
    setStatusText('ira is thinking...');
    setIsSpeaking(false);
    
    const emotion = detectEmotion(text);

    // Save user message to Firebase
    const chatsRef = ref(db, `users/${currentUserId}/chats`);
    await push(chatsRef, {
      text: text,
      sender: 'user',
      emotion: emotion,
      type: 'voice',
      timestamp: Date.now()
    });

    try {
      const response = await axios.post('/chat', { 
        userId: currentUserId,
        userName: userProfile?.name || 'User',
        aiGender: userProfile?.aiGender || 'Female',
        message: text,
        emotion: emotion,
        mode: 'voice',
        personality: personalityMode
      });
      
      if (response.data.shouldSpeak && response.data.voiceText) {
        setStatusText('ira is speaking...');
        setIsSpeaking(true);
        
        try {
          const speakRes = await fetch('/speak', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              text: response.data.voiceText,
              emotion: emotion
            })
          });

          if (!speakRes.ok) {
            throw new Error('Failed to fetch audio');
          }

          const blob = await speakRes.blob();
          const audioUrl = URL.createObjectURL(blob);

          // Use AudioManager to play safely
          await audioManager.play(audioUrl, () => {
            URL.revokeObjectURL(audioUrl);
            setIsSpeaking(false);
            setStatusText('Listening...');
            // Auto-resume listening loop
            setTimeout(() => {
              try {
                recognitionRef.current?.start();
              } catch(e) {}
            }, 500);
          }, (err) => {
            URL.revokeObjectURL(audioUrl);
            setIsSpeaking(false);
            setStatusText('Error playing audio.');
          });
        } catch (err) {
          console.error("Audio Playback Error:", err);
          setIsSpeaking(false);
          setStatusText('Error playing audio.');
        }
      }
    } catch (error) {
      console.error('Failed to get response:', error);
      setStatusText('Connection error.');
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleEndSession = () => {
    audioManager.stop();
    if (recognitionRef.current) recognitionRef.current.stop();
    navigate('/');
  };

  return (
    <div className={`voice-page-wrapper theme-${theme}`}>
      <div className="voice-header">
        <div className="timer">
          <Activity size={16} /> Session: {formatTime(sessionTime)}
        </div>
        <button className="end-btn" onClick={handleEndSession}>
          <X size={20} /> End Session
        </button>
      </div>

      <div className="voice-center">
        <CircularVisualizer isSpeaking={isSpeaking} isListening={isListening} />
        <div className="status-text">{statusText}</div>
      </div>

      <div className="voice-controls">
        <button 
          className={`mic-btn ${isListening ? 'listening' : ''}`}
          onClick={toggleListen}
          disabled={isSpeaking}
        >
          {isListening ? <MicOff size={32} /> : <Mic size={32} />}
        </button>
      </div>
    </div>
  );
};

export default VoicePage;
