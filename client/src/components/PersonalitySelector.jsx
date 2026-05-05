import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Zap, Heart, Brain, ChevronDown } from 'lucide-react';

export const MODES = {
  FRIENDLY: 'Friendly',
  SAVAGE: 'Savage',
  ROMANTIC: 'Romantic',
  MENTOR: 'Mentor'
};

const MODE_ICONS = {
  [MODES.FRIENDLY]: <Sparkles size={16} />,
  [MODES.SAVAGE]: <Zap size={16} />,
  [MODES.ROMANTIC]: <Heart size={16} />,
  [MODES.MENTOR]: <Brain size={16} />
};

const PersonalitySelector = ({ currentMode, setPersonalityMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="personality-selector" ref={dropdownRef}>
      <button 
        className="mode-btn" 
        onClick={() => setIsOpen(!isOpen)}
        title="Change AI Personality"
      >
        {MODE_ICONS[currentMode]}
        <span className="mode-text">{currentMode}</span>
        <ChevronDown size={14} className={`chevron ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && (
        <div className="mode-dropdown">
          {Object.values(MODES).map((mode) => (
            <button
              key={mode}
              className={`dropdown-item ${currentMode === mode ? 'active' : ''}`}
              onClick={() => {
                setPersonalityMode(mode);
                setIsOpen(false);
              }}
            >
              {MODE_ICONS[mode]}
              {mode}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PersonalitySelector;
