import React, { useState, useRef, useEffect } from 'react';
import { Briefcase, Heart, Coffee, ChevronDown, Gamepad2 } from 'lucide-react';

export const SCENARIOS = {
  NONE: 'None',
  INTERVIEW: 'Job Interview',
  DATE: 'First Date',
  CASUAL: 'Casual Chat'
};

const SCENARIO_ICONS = {
  [SCENARIOS.NONE]: <Coffee size={14} />,
  [SCENARIOS.INTERVIEW]: <Briefcase size={14} />,
  [SCENARIOS.DATE]: <Heart size={14} />,
  [SCENARIOS.CASUAL]: <Coffee size={14} />
};

const ScenarioSelector = ({ currentScenario, setScenario }) => {
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
    <div className="scenario-selector" ref={dropdownRef}>
      <button 
        className="scenario-btn" 
        onClick={() => setIsOpen(!isOpen)}
        title="Roleplay Scenario"
      >
        <Gamepad2 size={16} color="var(--primary)" />
        <span className="scenario-text">{currentScenario === SCENARIOS.NONE ? 'Roleplay' : currentScenario}</span>
        <ChevronDown size={14} className={`chevron ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && (
        <div className="scenario-dropdown">
          {Object.values(SCENARIOS).map((scenario) => (
            <button
              key={scenario}
              className={`dropdown-item ${currentScenario === scenario ? 'active' : ''}`}
              onClick={() => {
                setScenario(scenario);
                setIsOpen(false);
              }}
            >
              {SCENARIO_ICONS[scenario]}
              {scenario}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ScenarioSelector;
