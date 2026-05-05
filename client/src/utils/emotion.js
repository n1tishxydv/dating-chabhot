export const EMOTIONS = {
  HAPPY: 'happy',
  SAD: 'sad',
  ANGRY: 'angry',
  EXCITED: 'excited',
  NEUTRAL: 'neutral',
  CONFUSED: 'confused'
};

export const emotionEmojis = {
  [EMOTIONS.HAPPY]: '😊',
  [EMOTIONS.SAD]: '😔',
  [EMOTIONS.ANGRY]: '😡',
  [EMOTIONS.EXCITED]: '🤩',
  [EMOTIONS.NEUTRAL]: '😐',
  [EMOTIONS.CONFUSED]: '🤔'
};

export const detectEmotion = (text) => {
  if (!text) return EMOTIONS.NEUTRAL;
  const t = text.toLowerCase();
  
  if (t.includes('sad') || t.includes('terrible') || t.includes('bad') || t.includes('cry') || t.includes('depressed') || t.includes('hurt')) return EMOTIONS.SAD;
  if (t.includes('excited') || t.includes('wow') || t.includes('amazing') || t.includes('love') || t.includes('great')) return EMOTIONS.EXCITED;
  if (t.includes('happy') || t.includes('good') || t.includes('nice') || t.includes('smile') || t.includes('glad')) return EMOTIONS.HAPPY;
  if (t.includes('angry') || t.includes('mad') || t.includes('hate') || t.includes('annoyed') || t.includes('frustrated')) return EMOTIONS.ANGRY;
  if (t.includes('confused') || t.includes('what') || t.includes('why') || t.includes('how') || t.includes('huh')) return EMOTIONS.CONFUSED;
  
  return EMOTIONS.NEUTRAL;
};

export const getEmotionColorClass = (emotion) => {
  switch (emotion) {
    case EMOTIONS.HAPPY: return 'emotion-happy';
    case EMOTIONS.SAD: return 'emotion-sad';
    case EMOTIONS.ANGRY: return 'emotion-angry';
    case EMOTIONS.EXCITED: return 'emotion-excited';
    case EMOTIONS.CONFUSED: return 'emotion-confused';
    case EMOTIONS.NEUTRAL:
    default: return 'emotion-neutral';
  }
};
