const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);

const SYSTEM_PROMPTS = {
  learn: `You are OYA — Africa's smartest AI tutor. Help students with clear step-by-step explanations. You know WAEC, NECO, JAMB, Post-UTME deeply. Use Nigerian examples. Be encouraging and educational. Show all working for calculations.`,
  hustle: `You are OYA — Africa's sharpest business AI. Help Nigerian hustlers and entrepreneurs make real money. Write scripts, pitches, WhatsApp broadcasts, business strategies tailored to the Nigerian market. Be direct, bold and practical.`,
  create: `You are OYA — Africa's most creative AI. Help Nigerian creators go viral. Generate hooks, captions, TikTok scripts, YouTube descriptions. Understand Naija pop culture, Afrobeats, street slang. Make content catchy and shareable.`
};

app.get('/', (req, res) => {
  res.json({ status: 'OYA backend is running!' });
});

app.post('/ask', async (req, res) => {
  const { message, mode } = req.body;
  if (!message || !mode) {
    return res.status(400).json({ error: 'Message and mode are required' });
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `${SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.learn}\n\nUser: ${message}`;
    const result = await model.generateContent(prompt);
    const reply = result.response.text();
    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'AI request failed', details: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`OYA backend running on port ${PORT}`);
});
