const { Router } = require('express');
const app = Router();
const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

app.post('/chatgpt/chat', async (req, res) => {
    console.log('apiKey: ', process.env.OPENAI_API_KEY);
    const data = req.body;
    const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
            {
                role: 'system',
                content: 'Tu eres un buen asistente de negocios.'
            },
            {
                role: 'user',
                content: data.message
            }
        ],
        temperature: 0,
        max_tokens: 256,
    });

    res.status(200).json(response);
});

module.exports = app;