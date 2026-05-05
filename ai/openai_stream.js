const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');

const openai = new OpenAI({
    apiKey:'sk-0c00dedb721d4c818b743fb637da092d',
});

router.post('/chat', async (req, res) => {
    try {
        const { prompt } = req.body;
        
        const completion = await openai.chat.completion.create({
            messages: [{ role: "system", content: "你是一个选品达人" }],
            model: "deepseek-v4-pro",
            thinking: { "type": "enabled" },
            reasoning_effort: "high",
            stream: false,
        })

        console.log(completion.choices[0].message.content);

        res.json({
            success: true,
            response: completion.choices[0].message.content,
            usage: completion.usage
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            error: error.message
        })
    }
})


module.exports = router;