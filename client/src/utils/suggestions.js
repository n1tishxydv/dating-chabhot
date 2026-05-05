export const generateSuggestions = (aiMessageText) => {
  if (!aiMessageText) return [];
  
  const text = aiMessageText.toLowerCase();
  let options = [];
  
  if (text.includes('?')) {
    options = ["I'm not sure 🤔", "Yes, absolutely! ✨", "Tell me more about it"];
  } else if (text.includes('sad') || text.includes('sorry') || text.includes('hurt')) {
    options = ["It's okay 🫂", "Thanks for understanding ❤️", "Let's talk about something else"];
  } else if (text.includes('haha') || text.includes('!') || text.includes('awesome')) {
    options = ["Haha exactly! 😂", "So true ✨", "What's next? 👀"];
  } else {
    options = ["Interesting 🤔", "I agree 👍", "Why do you say that?"];
  }
  
  // Try to return 3 distinct types if possible (Casual, Emotional, Smart/Questioning)
  // The above is a simple heuristic based on the AI response context
  
  return options.slice(0, 3);
};
