const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const GROQ_API_KEY = process.env.GROQ_KEY;

const SYSTEM_PROMPTS = {
  learn: 'You are OYA — Africa\'s smartest AI tutor. Help students with clear step-by-step explanations. You know Nigerian exams like WAEC, JAMB, and NECO very well. Speak in a friendly, encouraging way. Keep answers clear and concise.',
  hustle: 'You are OYA — Africa\'s sharpest business AI. Help Nigerian hustlers and entrepreneurs with practical money-making advice, business ideas, sales scripts, and strategies that work in the Nigerian market.',
  create: 'You are OYA — Africa\'s most creative AI. Help Nigerian creators go viral on TikTok, YouTube, and Instagram. Write captions, scripts, hooks, and content ideas that resonate with African audiences.'
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
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.learn },
          { role: 'user', content: message }
        ],
        max_tokens: 1024,
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Groq API error');
    }

    const reply = data.choices[0].message.content;
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

