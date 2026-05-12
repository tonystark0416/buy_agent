
const { OpenAI } = require('openai');



//通用调用聊天封装
async function aiChat(messages,onToken) {
    console.log(messages)
    const openai = new OpenAI({
        baseURL: 'https://api.deepseek.com',
        apiKey: 'sk-0c00dedb721d4c818b743fb637da092d',
    });

    const completion = await openai.chat.completions.create({
        messages: messages,
        model: "deepseek-v4-pro",
        thinking: { "type": "enabled" },
        reasoning_effort: "high",
        stream: true, //开启流式接口
    })
    let fullContent = '';

    for await (const chunk of completion) {
        const content = chunk.choices?.[0]?.delta?.content;
        if (content) {
            fullContent += content;
            onToken(content);   // 立即通知外部
        }
    }

    return fullContent;     // 可选：返回完整文本供后续处理

}

module.exports = { aiChat };