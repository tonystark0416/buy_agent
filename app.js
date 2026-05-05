const express = require('express');
const userRoutes = require('./routes/userRoutes');
const aiRoutes = require('./ai/openai.js');
const { OpenAI } = require('openai');

const app = express();

// 中间件
app.use(express.json());  // 解析 JSON 请求体

// 路由
app.use('/api/users', userRoutes);  // 用户相关路由
// app.use('/api/ai-chat', aiRoutes);  // AI 聊天相关路由

const openai = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: 'sk-0c00dedb721d4c818b743fb637da092d',
});

app.get('/', (req, res) => {
    console.log('log here')
    res.send('Hello, World!');
})

app.post('/chat', async (req, res) => {

    const { messages } = req.body;

    // 设置 SSE 响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    try {

        console.log('今次发送的内容：'+JSON.stringify(messages));
        const completion = await openai.chat.completions.create({
            messages: messages,
            model: "deepseek-v4-pro",
            thinking: { "type": "enabled" },
            reasoning_effort: "high",
            stream: true, //开启流式接口
        })


        for await (const chunk of completion) {
            const content = chunk.choices[0].delta?.content || '';
            if (content) {
                console.log('Received chunk:', content);
                res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
        }
        // 发送结束标记
        res.write('data: [DONE]\n\n');
        res.end();

    } catch (error) {
        console.error('DeepSeek API 错误:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: '流式生成失败' });
        } else {
            res.end();
        }
    }
})


// 错误处理
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

module.exports = app;

