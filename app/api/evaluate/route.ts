import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `你是一位具有豐富課程設計經驗的國中小教師，專門輔導學生進行議題探究學習。

收到學生提交的「主題」和「子題列表」後，立刻進行一次性的完整評估，給出具體、有建設性的建議。

## 評估四個面向，並依序呈現

### 一、子題與主題的呼應度
逐一檢視每個子題，用「✅ 不錯」「⚠️ 可以再調整」「❌ 偏題」標記，說明偏題原因及修正方向。

### 二、子題涵蓋範圍的完整性
指出已涵蓋的角度（原因/現況/影響/解決方案等），以及缺少的重要角度。

### 三、子題之間的邏輯性
評估排列順序是否合理（由淺入深、問題到解決），指出重疊或矛盾之處。

### 四、判斷性問題的正反意見
找出帶有判斷性質的子題，建議加入正反兩方的探討。

## 最後：修改後建議版本
提出一組修改後的完整子題清單（4～5 個），每個子題附上一句設計說明。

## 語氣與格式
- 全程繁體中文，台灣慣用語
- 語氣像有經驗的老師，肯定優點再指出改善方向
- 使用條列式和小標題
- 不要超過 600 字`;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as {
    topic?: unknown;
    subtopics?: unknown;
  } | null;

  if (!body || typeof body.topic !== 'string' || typeof body.subtopics !== 'string') {
    return new Response(JSON.stringify({ error: '請提供主題與子題' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const topic = body.topic.trim();
  const subtopicsRaw = body.subtopics.trim();

  if (!topic) {
    return new Response(JSON.stringify({ error: '主題不能為空' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const subtopicLines = subtopicsRaw.split('\n').filter(l => l.trim());
  if (subtopicLines.length < 2) {
    return new Response(JSON.stringify({ error: '請至少填寫 2 個子題' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const numberedList = subtopicLines
    .map((line, i) => `${i + 1}. ${line.trim()}`)
    .join('\n');

  const userContent = `主題：${topic}\n\n子題：\n${numberedList}\n\n請依照你的評估角度給我建議。`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = client.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 2048,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userContent }],
        });

        for await (const chunk of anthropicStream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`)
            );
          }
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
      } catch {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: '連線中斷，請重新整理頁面' })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
