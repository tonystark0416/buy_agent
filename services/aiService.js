
const { OpenAI } = require('openai');
const vipService = require('./platforms/vipService');

const tools = [
    {
        type: "function",
        function: {
            name: "search_vip_goods",
            description: "搜索唯品会商品，根据用户购物意图查找相关商品信息",
            parameters: {
                type: "object",
                properties: {
                    keyword: { type: "string", description: "搜索关键词" },
                    page: { type: "number", description: "页码，默认1" },
                    pageSize: { type: "number", description: "每页数量，默认10" }
                },
                required: ["keyword"]
            }
        }
    }
];




/**
 * 带工具调用的流式对话
 * @param {Array} messages - 对话历史
 * @param {Function} onEvent - 事件回调 (eventType, data)
 *   eventType: 'token' | 'tool_calls' | 'done' | 'error'
 */
async function aiChat(messages, onEvent) {
    console.log(messages)
    console.log('----')
    const openai = new OpenAI({
        baseURL: 'https://api.deepseek.com',
        apiKey: 'sk-0c00dedb721d4c818b743fb637da092d',
    });

    const completion = await openai.chat.completions.create({
        messages: messages,
        model: "deepseek-v4-pro",
        tools: tools,
        tool_choice: "auto",                //工具调用
        stream: true, //开启流式接口
    })

    // 收集流式片段
    let fullContent = '';
    let reasoningContent = '';
    let toolCalls = [];
    let currentToolCall = null;


    for await (const chunk of completion) {
        const delta = chunk.choices?.[0]?.delta;

        // ✅ 收集 reasoning_content（思考过程）
        if (delta?.reasoning_content) {
            reasoningContent += delta.reasoning_content;
        }

        // 普通文本 token
        if (delta?.content) {
            fullContent += delta.content;
            onEvent('token', { content: delta.content });   // 立即通知外部
        }

        // 工具调用信息（可能跨多个 chunk）
        if (delta?.tool_calls) {
            console.log(delta.tool_calls)
            for (const tc of delta.tool_calls) {
                // 通过 id 识别不同工具调用
                if (tc.id) {
                    // 已有 id，说明是新工具调用开始，直接存入
                    currentToolCall = {
                        id: tc.id,
                        type: 'function',
                        function: { name: '', arguments: '' }
                    };
                    toolCalls.push(currentToolCall);
                }

                if (tc.function?.name && !currentToolCall.function.name) {
                    currentToolCall.function.name = tc.function.name;
                }

                if (tc.function?.arguments) {
                    currentToolCall.function.arguments += tc.function.arguments;
                }
            }
        }
    }

    // 如果 AI 要求调用工具
    if (toolCalls.length > 0) {
        console.log('最终函数名:', toolCalls[0].function.name);
        console.log('最终参数:', toolCalls[0].function.arguments);
        try {
            const testParse = JSON.parse(toolCalls[0].function.arguments);
            console.log('参数解析成功:', testParse);
        } catch (e) {
            console.error('参数仍非法:', toolCalls[0].function.arguments);
        }

        onEvent('tool_calls', { tool_calls: toolCalls });

        onEvent('status', { message: '正在唯品会搜索...' });

        // 构建助手消息（包含 tool_calls）
        const assistantMsg = {
            role: 'assistant',
            content: fullContent || null,
            tool_calls: toolCalls.map(tc => ({
                id: tc.id,
                type: 'function',
                function: tc.function
            }))
        };

        // ✅ 如果有思考内容，必须带上
        if (reasoningContent) {
            assistantMsg.reasoning_content = reasoningContent;
        }
        const newMessages = [...messages, assistantMsg];

        // 执行工具并添加结果
        for (const tc of toolCalls) {

            const funcName = tc.function.name;
            // console.log(funcName)
            // console.log('-----')
            if (funcName === 'search_vip_goods') {
                try {
                    let args = JSON.parse(tc.function.arguments);
                    args.page = 1
                    args.openid = '123123'
                    args.chanTag = '213213213'
                    // console.log(args)
                    
                    const goods = await vipService.searchGoods(args);
                    // console.log(goods)
                    newMessages.push({
                        role: 'tool',
                        tool_call_id: tc.id,
                        content: JSON.stringify(goods)  // 商品数据作为工具结果
                    });
                    onEvent('status', { message: `已搜索到 ${goods.length} 件商品` });
                } catch (err) {
                    newMessages.push({
                        role: 'tool',
                        tool_call_id: tc.id,
                        content: JSON.stringify({ error: err.message })
                    });
                }
            } else {
                // 未知工具也必须添加一条 tool 消息，否则 API 报错
                newMessages.push({
                    role: 'tool',
                    tool_call_id: tc.id,
                    content: JSON.stringify({ error: 'unknown tool' }),
                });
            }
        }

        // 第二次请求：将工具结果发给 AI，流式输出最终答案
        const finalResponse = await openai.chat.completions.create({
            model: 'deepseek-v4-pro',
            messages: newMessages,
            stream: true,
        });

        for await (const chunk of finalResponse) {
            const content = chunk.choices?.[0]?.delta?.content;
            if (content) {
                onEvent('token', { content });
            }
        }
    }


    console.log('本次对话结束')
    onEvent('done', { message: '对话结束' });

    return fullContent;     // 可选：返回完整文本供后续处理

}

module.exports = { aiChat };