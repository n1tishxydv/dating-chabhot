import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';

const OnboardingPage = ({ onComplete }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [aiName, setAiName] = useState('ira');
  const [error, setError] = useState('');
  const [isFading, setIsFading] = useState(false);

  const goToStep2 = () => {
    if (!name.trim()) {
      setError('Please enter your name to continue.');
      return;
    }
    setError('');
    setIsFading(true);
    setTimeout(() => {
      setStep(2);
      setIsFading(false);
    }, 300);
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      setName(user.displayName || 'User');
      setEmail(user.email || '');
      setError('');
      
      // Auto transition to step 2 on successful Google login
      setIsFading(true);
      setTimeout(() => {
        setStep(2);
        setIsFading(false);
      }, 300);
    } catch (err) {
      console.error(err);
      setError('Google sign-in failed. Please try again or continue manually.');
    }
  };

  const handleFinalSubmit = (e) => {
    e.preventDefault();
    if (!aiName.trim()) {
      setError('Please give your AI companion a name.');
      return;
    }

    const userProfile = { 
      name: name.trim(), 
      userEmail: email,
      aiGender: 'Female', // Defaulting to Female for voice mapping
      aiName: aiName.trim() 
    };
    
    localStorage.setItem('ira_profile', JSON.stringify(userProfile));
    
    if (onComplete) {
      onComplete(userProfile);
    }
    navigate('/');
  };

  return (
    <div className="onboarding-wrapper">
      <div className={`onboarding-card ${isFading ? 'fading' : ''}`}>
        
        {step === 1 && (
          <div className="step-content fade-in">
            <h2>Sign in to continue</h2>
            <p className="subtitle">Let's get started.</p>
            
            <button 
              type="button" 
              className="google-btn"
              onClick={handleGoogleSignIn}
            >
              <img 
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                alt="Google" 
                className="google-icon"
              />
              Continue with Google
            </button>

            <div className="divider">
              <span>OR CONTINUE MANUALLY</span>
            </div>

            <div className="onboarding-form">
              <div className="form-group">
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(''); }}
                  placeholder="Enter your name"
                  className="onboarding-input"
                  onKeyDown={(e) => e.key === 'Enter' && goToStep2()}
                />
              </div>
              
              {error && <div className="error-text">{error}</div>}

              <button 
                type="button" 
                onClick={goToStep2}
                className="start-btn premium-btn"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="step-content fade-in">
            <h2>Name your AI companion</h2>
            <p className="subtitle">Choose a name for your assistant</p>
            
            <form onSubmit={handleFinalSubmit} className="onboarding-form">
              <div className="form-group">
                <input 
                  type="text" 
                  value={aiName}
                  onChange={(e) => { setAiName(e.target.value); setError(''); }}
                  placeholder="e.g. ira"
                  className="onboarding-input text-center font-bold"
                  autoFocus
                />
              </div>
              
              {error && <div className="error-text">{error}</div>}

              <button 
                type="submit" 
                className="start-btn premium-btn"
              >
                Start Chatting
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default OnboardingPage;
