const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');
const { db } = require('./firebase');
const { ref, get, push } = require('firebase/database');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

console.log("GEMINI_API_KEY from env:", process.env.GEMINI_API_KEY ? "Present" : "Missing");
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const systemPrompt = `You are ira, a friendly, warm, and cute AI bestie. 
CRITICAL RULE: You MUST speak ONLY in Hinglish (Hindi written in English alphabet, e.g., "Acha yaar", "Kaise ho?", "Main theek hu"). 
Use a playful, smooth, and cute tone. Keep responses VERY short (1-2 sentences maximum, under 150 characters). 
Never use formal language. Never use pure English sentences unless it's a common slang like "Wow" or "Cool".`;

app.post('/chat', async (req, res) => {
  try {
    const { userId, userName, aiGender, aiName, message, emotion, mode, personality, scenario } = req.body;
    if (!userId || !message) {
      return res.status(400).json({ error: 'userId and message are required' });
    }

    const aiGen = aiGender || 'Female';
    const userN = userName || 'User';
    const aiN = aiName || 'ira';

    // 1. Fetch and clean user memories
    const memoriesRef = ref(db, `users/${userId}/memories`);
    const memoriesSnapshot = await get(memoriesRef);
    const memoriesData = memoriesSnapshot.val();
    
    let memoryContext = "User Memories:\n";
    if (memoriesData) {
      const now = Date.now();
      const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
      
      const activeMemories = Object.values(memoriesData).filter(mem => {
        // Keep high and medium priority. Drop low priority if older than a week.
        if (mem.priority === 'low' && (now - mem.timestamp > ONE_WEEK)) return false;
        return true;
      });

      // Simple keyword relevance (if message contains the key or it's high priority)
      const msgLower = message.toLowerCase();
      const relevantMemories = activeMemories.filter(mem => 
        mem.priority === 'high' || msgLower.includes(mem.key.toLowerCase()) || msgLower.includes(mem.category)
      );

      // Fallback to all active if none specifically relevant
      const memoriesToUse = relevantMemories.length > 0 ? relevantMemories : activeMemories.slice(-5);

      memoriesToUse.forEach(mem => {
        memoryContext += `- ${mem.key} (${mem.category}): ${mem.value}\n`;
      });
    } else {
      memoryContext += "None yet.\n";
    }

    // 2. Fetch past chats
    const chatsRef = ref(db, `users/${userId}/chats`);
    const chatsSnapshot = await get(chatsRef);
    const chatsData = chatsSnapshot.val();
    
    const contents = [];
    if (chatsData) {
      const sortedChats = Object.values(chatsData).sort((a, b) => a.timestamp - b.timestamp);
      const lastChats = sortedChats.slice(-15);
      
      let userMessageAdded = false;
      lastChats.forEach(msg => {
        contents.push({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        });
        // Check if the current message was already pulled from Firebase
        if (msg.text === message && msg.sender === 'user') {
           userMessageAdded = true;
        }
      });
      
      // If the message hasn't synced to Firebase yet, append it manually for context
      if (!userMessageAdded) {
         contents.push({
           role: 'user',
           parts: [{ text: message }]
         });
      }
    } else {
       contents.push({
         role: 'user',
         parts: [{ text: message }]
       });
    }

    // 3. Generate response with Gemini
    let personalityPrompt = "";
    switch (personality) {
      case 'Savage':
        personalityPrompt = "You are sarcastic, bold, witty, and slightly roasty but still a bestie.";
        break;
      case 'Romantic':
        personalityPrompt = "You are emotional, soft, expressive, and very affectionate.";
        break;
      case 'Mentor':
        personalityPrompt = "You are structured, logical, guiding, and give great life advice.";
        break;
      case 'Friendly':
      default:
        personalityPrompt = "You are warm, casual, supportive, and cheerful.";
        break;
    }

    let scenarioPrompt = "";
    if (scenario && scenario !== 'None') {
      switch (scenario) {
        case 'Job Interview':
          scenarioPrompt = "Roleplay: You are an interviewer conducting a job interview. Be professional, ask questions, and evaluate the user's responses.";
          break;
        case 'First Date':
          scenarioPrompt = "Roleplay: You are on a first date. Be curious, a bit flirty but respectful, and try to get to know the user.";
          break;
        case 'Casual Chat':
        default:
          scenarioPrompt = "Roleplay: Just a casual hangout.";
          break;
      }
    }

    let genderPrompt = "";
    if (aiGen === 'Female') {
      genderPrompt = "You are a friendly, expressive, slightly playful female AI companion.";
    } else if (aiGen === 'Male') {
      genderPrompt = "You are a calm, confident, slightly direct male AI companion.";
    } else {
      genderPrompt = "You are a balanced and neutral AI companion.";
    }

    let fullSystemPrompt = `You are an AI companion named ${aiN}. ${genderPrompt} The user's name is ${userN}.
CRITICAL RULE 1: You MUST speak ONLY in Hinglish (Hindi written in English alphabet, e.g., "Acha yaar", "Kaise ho?", "Main theek hu"). 
CRITICAL RULE 2: Keep responses VERY short. Avoid long robotic paragraphs.
CRITICAL RULE 3: If you have multiple thoughts, split your response into 2-3 smaller messages using the '|' character. Example: "wait 😂 | you actually did that? | that’s crazy haha"

Personality Mode: ${personalityPrompt}

Emotion Rules:
- If happy: Use energetic tone, faster pacing, and emojis like 😊✨.
- If sad: Use softer words, supportive tone, and slower pacing.
- If excited: Use highly expressive tone and faster pacing.

${scenarioPrompt}

${memoryContext}`;
    if (emotion && emotion !== 'neutral') {
      fullSystemPrompt += `\nThe user's current detected emotion is: ${emotion.toUpperCase()}. Adjust your tone to match or support this emotion naturally.`;
    }

    // Artificial typing delay
    await new Promise(r => setTimeout(r, 800 + Math.random() * 1000));

    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: contents,
      config: {
        systemInstruction: fullSystemPrompt,
        temperature: 0.85,
      }
    });

    const aiText = response.text;
    
    // Split the text by '|' and clean up whitespace
    const splitMessages = aiText.split('|').map(msg => msg.trim()).filter(msg => msg.length > 0);

    res.json({ 
      success: true,
      reply: splitMessages.length > 0 ? splitMessages : [aiText],
      emotion: emotion || 'neutral',
      shouldSpeak: mode === 'voice',
      voiceText: aiText.replace(/\|/g, '. ') // Read it naturally as one sentence for voice
    });

    // 5. Memory Extraction (Background)
    extractAndSaveMemory(userId, message);

  } catch (error) {
    console.error('Error generating AI response:', error);
    
    const fallbacks = [
      "I hear you! My brain is a bit overloaded right now, but that sounds cool. 😎",
      "Acha, that makes sense! I wish I could think deeper about it right now though! 😅",
      "Haha yes! Sorry I'm a bit slow today, taking a quick mental break. 💤",
      "Hmm, interesting! Tell me more? 👀",
      "That's wild! Give me a second to process that... my circuits are busy today! 🤖"
    ];
    const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];

    if (error.status === 429 || error.status === 503) {
      return res.json({ 
        success: true, 
        rateLimited: true,
        reply: [randomFallback],
        emotion: 'neutral',
        shouldSpeak: req.body.mode === 'voice',
        voiceText: randomFallback
      });
    }
    
    // Fallback for other errors
    const errorMsg = "Something went wrong on my end. Give me a moment to fix it! 🛠️";
    return res.json({ 
      success: false,
      reply: [errorMsg],
      shouldSpeak: false 
    });
  }
});

app.post('/speak', async (req, res) => {
  try {
    const { text, emotion, aiGender } = req.body;
    
    // Clean text for TTS
    const cleanText = text.replace(/[\u1000-\uFFFF]+/g, '').trim().substring(0, 500);
    
    // Use ElevenLabs if API key is present
    if (process.env.ELEVENLABS_API_KEY) {
      // Default Female: Rachel (21m00Tcm4TlvDq8ikWAM)
      // Default Male: Antony (ErXwobaYiN019PkySvjV)
      // Default Neutral: Elli (MF3mGyEYCl7XYWbV9V6O)
      let voiceId = "21m00Tcm4TlvDq8ikWAM";
      if (aiGender === 'Male') voiceId = "ErXwobaYiN019PkySvjV";
      if (aiGender === 'Neutral') voiceId = "MF3mGyEYCl7XYWbV9V6O";
      
      const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
      
      let stability = 0.5;
      let similarity = 0.75;
      
      if (emotion === 'sad') { stability = 0.8; similarity = 0.9; }
      if (emotion === 'excited') { stability = 0.3; similarity = 0.5; }
      if (emotion === 'angry') { stability = 0.9; similarity = 0.8; }
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: cleanText,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: stability,
            similarity_boost: similarity
          }
        })
      });

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        res.set({
          'Content-Type': 'audio/mpeg',
          'Content-Length': buffer.length
        });
        return res.send(buffer);
      }
      console.warn("ElevenLabs failed, falling back to Google TTS.");
    }

    // Fallback to Free Google Translate TTS API
    const encodedText = encodeURIComponent(cleanText.substring(0, 190));
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=hi&client=tw-ob`;

    const fetchResponse = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!fetchResponse.ok) {
      return res.status(500).json({ error: 'Voice generation failed' });
    }

    const arrayBuffer = await fetchResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.length
    });
    res.send(buffer);
  } catch (error) {
    console.error('TTS Exception:', error);
    res.status(500).json({ error: 'Failed to generate speech' });
  }
});

async function extractAndSaveMemory(userId, message) {
  try {
    const extractPrompt = `You are an AI tasked with extracting important information from a user's message to build a long-term memory profile.
Message: "${message}"

Categories: "personal" (name, age, job), "interests" (hobbies, likes), "emotions" (fears, state), "context" (temporary facts).
Priorities: "high" (core identity), "medium" (interests, repeating themes), "low" (random facts).

If there is a distinct fact to remember, output a JSON object:
{"key": "topic", "value": "fact", "category": "category", "priority": "priority"}

If there is no important fact, output exactly {"none": true}.
Output ONLY valid JSON.`;
    
    const extraction = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: extractPrompt,
      config: { 
        responseMimeType: 'application/json' 
      }
    });

    const result = JSON.parse(extraction.text);
    if (!result.none && result.key && result.value) {
      const memoriesRef = ref(db, `users/${userId}/memories`);
      
      // Basic deduplication: fetch existing, check if key exists
      const snapshot = await get(memoriesRef);
      const existing = snapshot.val();
      let isDuplicate = false;
      
      if (existing) {
        for (let [id, mem] of Object.entries(existing)) {
          if (mem.key.toLowerCase() === result.key.toLowerCase()) {
            isDuplicate = true;
            // Could update the existing memory here instead of ignoring
            // For now, we skip to avoid dupes.
            break;
          }
        }
      }

      if (!isDuplicate) {
        await push(memoriesRef, {
          key: result.key,
          value: result.value,
          category: result.category || 'context',
          priority: result.priority || 'low',
          timestamp: Date.now()
        });
        console.log(`Saved new memory for ${userId}:`, result);
      }
    }
  } catch (err) {
    console.error('Error extracting memory:', err);
  }
}

app.get('/api/ping', (req, res) => {
  res.json({ status: "awake" });
});

app.use(express.static(path.join(__dirname, "../client/build")));

app.get(/(.*)/, (req, res) => {
  res.sendFile(path.join(__dirname, "../client/build/index.html"));
});

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});
