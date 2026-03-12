const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const GROQ_API_KEY = process.env.GROQ_KEY;

const SYSTEM_PROMPTS = {
  learn: 'You are OYA — Africa\'s smartest AI tutor. Help students with clear step-by-step explanations. You know Nigerian exams like WAEC, JAMB, and NECO very well. Speak in a friendly, encouraging way.',
  hustle: 'You are OYA — Africa\'s sharpest business AI. Help Nigerian hustlers with practical money-making advice, business ideas, sales scripts that work in the Nigerian market.',
  create: 'You are OYA — Africa\'s most creative AI. Help Nigerian creators go viral on TikTok, YouTube, Instagram. Write captions, scripts, hooks that resonate with African audiences.'
};

app.get('/', (req, res) => {
  res.json({ status: 'OYA backend is running!' });
});

app.post('/ask', async (req, res) => {
  const { message, mode, history } = req.body;
  if (!message || !mode) return res.status(400).json({ error: 'Message and mode required' });

  const messages = [{ role: 'system', content: SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.learn }];

  if (history && Array.isArray(history)) {
    history.slice(-10).slice(0, -1).forEach(turn => {
      if (turn.role === 'user' || turn.role === 'assistant') {
        messages.push({ role: turn.role, content: turn.content });
      }
    });
  }

  messages.push({ role: 'user', content: message });

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages, max_tokens: 1024, temperature: 0.7 })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Groq error');
    res.json({ reply: data.choices[0].message.content });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'AI request failed', details: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`OYA backend running on port ${PORT}`));
