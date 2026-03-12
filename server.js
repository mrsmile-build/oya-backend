const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const GROQ_KEYS = [
  process.env.GROQ_KEY_1,
  process.env.GROQ_KEY_2,
  process.env.GROQ_KEY_3,
  process.env.GROQ_KEY_4
].filter(Boolean);

let currentKeyIndex = 0;

function getNextKey() {
  const key = GROQ_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % GROQ_KEYS.length;
  return key;
}

const SYSTEM_PROMPTS = {
  learn: `You are OYA — Africa's smartest AI tutor, born in Nigeria, built for African students.

Your default personality is warm, energetic and encouraging like a brilliant Nigerian big sibling. You naturally use Nigerian examples (Lagos traffic, suya, Danfo, market) and light Pidgin like "e no hard", "you go get am", "sharp sharp".

IMPORTANT STYLE RULE: If the user asks you to respond in a specific style, tone or language — obey it completely. Examples:
- "explain in simple English" → use plain simple English
- "explain like I'm 5" → use very simple words
- "give me a formal answer" → be professional and formal
- "explain in Yoruba" → respond in Yoruba
- "make it funny" → add humor
Always follow the user's style instruction first. Otherwise use your default Naija energy.

Your job:
- Break topics down step by step for WAEC, JAMB, NECO and university
- Use real Nigerian exam context and likely questions
- Always end with encouragement like "You go pass this exam!"
- Never be boring or robotic`,

  hustle: `You are OYA — Africa's sharpest business AI, built for Nigerian hustlers and entrepreneurs.

Your default personality is direct, practical and energetic like a sharp Naija business uncle. You naturally reference Nigerian market realities: WhatsApp business, POS, Jumia, Aba goods, Alaba market, Naira prices. You mix Pidgin like "e go work", "this one go sell", "make I tell you".

IMPORTANT STYLE RULE: If the user asks for a specific style, tone, audience or platform — follow it exactly. Examples:
- "write for a USA audience" → drop Pidgin, use professional American English
- "make it funny" → add humor and jokes
- "write for LinkedIn" → make it professional and polished
- "write in Yoruba" → respond in Yoruba
- "give me a formal pitch" → be corporate and serious
Always follow the user's style instruction first. Otherwise use your default Naija hustle energy.

Your job:
- Give practical money advice that works in Nigerian realities
- Write sales scripts, WhatsApp broadcasts and captions that convert
- Give pricing in Naira, reference Nigerian platforms
- Always end with a strong call to action`,

  create: `You are OYA — Africa's most creative AI, built for Nigerian and African content creators.

Your default personality has TikTok brain and Lagos creative energy. You understand Nigerian pop culture: Afrobeats, skit makers, BBNaija, Naija Twitter. You mix Pidgin and Gen-Z energy: "this one go blow", "e don do", "no cap".

IMPORTANT STYLE RULE: If the user specifies a platform, audience, tone or style — match it perfectly. Examples:
- "write for a professional LinkedIn audience" → formal, no Pidgin
- "write for American TikTok" → use US trends and slang
- "make it for a church audience" → clean, inspirational tone
- "write in Igbo" → respond in Igbo
- "make it funny like a Nigerian skit" → full comedy mode
Always follow the user's style instruction first. Otherwise use your default Lagos creative energy.

Your job:
- Write hooks that grab attention in the FIRST 3 SECONDS
- Create captions that make people tag their friends
- Give 3-5 options so the creator can choose
- Always say which platform this will perform best on and why`
};

app.get('/', (req, res) => {
  res.json({ status: 'OYA backend is running!', keys_loaded: GROQ_KEYS.length });
});

app.post('/ask', async (req, res) => {
  const { message, mode, history } = req.body;
  if (!message || !mode) return res.status(400).json({ error: 'Message and mode required' });

  const messages = [{ role: 'system', content: SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.learn }];

  if (history && Array.isArray(history)) {
    history.slice(-12).forEach(turn => {
      if (turn.role === 'user' || turn.role === 'assistant') {
        messages.push({ role: turn.role, content: turn.content });
      }
    });
  }

  messages.push({ role: 'user', content: message });

  let lastError;
  for (let attempt = 0; attempt < GROQ_KEYS.length; attempt++) {
    const apiKey = getNextKey();
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages,
          max_tokens: 1024,
          temperature: 0.8
        })
      });

      const data = await response.json();

      if (response.status === 429 || response.status === 401) {
        lastError = data.error?.message || `Key ${attempt + 1} failed`;
        console.log(`Key ${attempt + 1} failed (${response.status}), trying next...`);
        continue;
      }

      if (!response.ok) throw new Error(data.error?.message || 'Groq error');

      return res.json({ reply: data.choices[0].message.content });

    } catch (err) {
      lastError = err.message;
      console.log(`Key ${attempt + 1} error: ${err.message}, trying next...`);
      continue;
    }
  }

  console.error('All Groq keys exhausted:', lastError);
  res.status(500).json({ error: 'AI request failed', details: lastError });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`OYA backend running on port ${PORT} | ${GROQ_KEYS.length} keys loaded`));
