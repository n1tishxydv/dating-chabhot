import React, { useState, useRef, useEffect } from 'react';
import { Phone, MoreVertical, MessageSquare, Mic, BarChart2, Moon, Sun, LogIn, LogOut, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PersonalitySelector from './PersonalitySelector';
import ScenarioSelector from './ScenarioSelector';

const emotionEmojis = {
  sad: '😢',
  excited: '🤩',
  angry: '😠',
  confused: '🤔',
  happy: '😊',
  neutral: '😐'
};

const Header = ({ 
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
  userProfile,
  setUserProfile
}) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isGenderMenuOpen, setIsGenderMenuOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const menuRef = useRef(null);
  const genderMenuRef = useRef(null);
  const nameInputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
      if (genderMenuRef.current && !genderMenuRef.current.contains(event.target)) {
        setIsGenderMenuOpen(false);
      }
      if (nameInputRef.current && !nameInputRef.current.contains(event.target)) {
        if (isEditingName) saveName();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isEditingName, tempName]);

  const saveName = () => {
    if (tempName.trim()) {
      const newProfile = { ...userProfile, aiName: tempName.trim() };
      setUserProfile(newProfile);
      localStorage.setItem('ira_profile', JSON.stringify(newProfile));
    }
    setIsEditingName(false);
  };

  const handleEditClick = () => {
    setTempName(userProfile?.aiName || 'ira');
    setIsEditingName(true);
  };

  const handleGenderChange = (gender) => {
    const newProfile = { ...userProfile, aiGender: gender };
    setUserProfile(newProfile);
    localStorage.setItem('ira_profile', JSON.stringify(newProfile));
    setIsGenderMenuOpen(false);
  };

  return (
    <div className="header">
      <div className="header-row-top">
        <div className="profile-section">
          <img 
            src={user?.photoURL || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150"} 
            alt="ira" 
            className="avatar" 
            style={{ animation: isSpeaking ? 'pulse-avatar 1.5s infinite' : 'none' }}
          />
          <div className="profile-info">
            {isEditingName ? (
              <input
                ref={nameInputRef}
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveName()}
                autoFocus
                className="ai-name-input"
                style={{ width: '120px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(138, 43, 226, 0.5)', color: '#fff', borderRadius: '8px', padding: '4px 8px', outline: 'none' }}
              />
            ) : (
              <span className="name" onClick={handleEditClick} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }} title="Click to rename AI">
                {userProfile?.aiName || 'ira'} <span style={{fontSize: '12px', opacity: 0.7}}>✏️</span> {userEmotion && emotionEmojis[userEmotion] && <span title="Current mood" style={{fontSize: '14px', marginLeft: '2px'}}>{emotionEmojis[userEmotion]}</span>}
              </span>
            )}
            <div className="status">
              <span className="status-dot"></span>
              online
            </div>
          </div>
        </div>

        <div className="more-menu-container" ref={menuRef}>
          <button className="icon-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <MoreVertical size={20} />
          </button>
          
          {isMenuOpen && (
            <div className="more-menu-dropdown">
              <button className="dropdown-item" onClick={() => { toggleTheme(); setIsMenuOpen(false); }}>
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />} 
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </button>
              <button className="dropdown-item" onClick={() => { navigate('/voice'); setIsMenuOpen(false); }}>
                <Mic size={16} /> Voice Session
              </button>
              <button className="dropdown-item" onClick={() => { onToggleAnalytics(); setIsMenuOpen(false); }}>
                <BarChart2 size={16} /> Insights
              </button>
              {user ? (
                <button className="dropdown-item text-danger" onClick={() => { signOut(); setIsMenuOpen(false); }}>
                  <LogOut size={16} /> Sign Out
                </button>
              ) : (
                <button className="dropdown-item text-primary" onClick={() => { signIn(); setIsMenuOpen(false); }}>
                  <LogIn size={16} /> Sign In
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="header-row-bottom">
        <div className="scenario-selector" ref={genderMenuRef}>
          <button className="scenario-btn" onClick={() => setIsGenderMenuOpen(!isGenderMenuOpen)}>
            {userProfile?.aiGender || 'Female'} <ChevronDown size={14} className={`chevron ${isGenderMenuOpen ? 'open' : ''}`} />
          </button>
          {isGenderMenuOpen && (
            <div className="scenario-dropdown">
              {['Female', 'Male', 'Neutral'].map((gender) => (
                <button
                  key={gender}
                  className={`dropdown-item ${userProfile?.aiGender === gender ? 'active' : ''}`}
                  onClick={() => handleGenderChange(gender)}
                >
                  {gender}
                </button>
              ))}
            </div>
          )}
        </div>

        <PersonalitySelector currentMode={personalityMode} setPersonalityMode={setPersonalityMode} />
        <ScenarioSelector currentScenario={scenarioMode} setScenario={setScenarioMode} />
      </div>
    </div>
  );
};

export default Header;
