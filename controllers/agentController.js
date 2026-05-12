// controllers/agentController.js

const aiService = require('../services/aiService');

exports.chat = async (req, res) => {

    const { messages } = req.body;
    console.log('今次发送的内容：' + JSON.stringify(messages));

    //发送事件
    const sendEvent = (event, data) => {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    // 基础校验
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        sendEvent('error', { message: '请提供合法的 messages 数组' });
        return res.end();
    }

    // 设置 SSE 响应头
    res.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
    });

    try {
        // 流式调用 AI，每得到一个 token 就通过 SSE 推送
        await aiService.aiChat(messages, (token) => {
            console.log('Received token:', token);
            sendEvent('token', { content: token });
        });
        // 完成
        sendEvent('done', { message: '回复完成' });
    } catch (error) {
        console.error('DeepSeek API 错误:', error);
        sendEvent('error', { message: err.message || '服务器内部错误' });
    } finally {
        res.end();
    }
}