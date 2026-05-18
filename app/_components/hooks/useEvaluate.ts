'use client';

import { useState, useCallback } from 'react';

export function useEvaluate() {
  const [topic, setTopic] = useState('');
  const [subtopics, setSubtopics] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasResult, setHasResult] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const evaluate = useCallback(async () => {
    if (!topic.trim()) {
      setError('請填寫主題');
      return;
    }
    const nonEmptyLines = subtopics.split('\n').filter(l => l.trim());
    if (nonEmptyLines.length < 2) {
      setError('請至少填寫 2 個子題');
      return;
    }

    setError(null);
    setSuggestion('');
    setHasResult(false);
    setIsStreaming(true);

    try {
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), subtopics: subtopics.trim() }),
      });

      if (!response.ok || !response.body) {
        const err = await response.json().catch(() => ({ error: '伺服器錯誤' }));
        setError((err as { error: string }).error ?? '伺服器錯誤');
        setIsStreaming(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6)) as {
              text?: string;
              done?: boolean;
              error?: string;
            };

            if (data.text) {
              fullText += data.text;
              setSuggestion(fullText);
            }
            if (data.done) {
              setHasResult(true);
            }
            if (data.error) {
              setError(data.error);
            }
          } catch {
            // ignore JSON parse errors on incomplete chunks
          }
        }
      }
    } catch {
      setError('連線中斷，請重新整理頁面後再試試看');
    } finally {
      setIsStreaming(false);
    }
  }, [topic, subtopics]);

  const reset = useCallback(() => {
    setTopic('');
    setSubtopics('');
    setSuggestion('');
    setIsStreaming(false);
    setHasResult(false);
    setError(null);
  }, []);

  const dateStr = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };

  const saveTxt = useCallback(() => {
    if (!suggestion) return;
    const d = dateStr();
    let content = `議題探究建議報告\n日期：${d}\n${'='.repeat(40)}\n\n`;
    content += `主題：${topic}\n\n子題：\n${subtopics}\n\n`;
    content += `${'='.repeat(40)}\n\nAI 評估建議：\n\n${suggestion}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `議題探究建議_${d}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [topic, subtopics, suggestion]);

  const saveHtml = useCallback(() => {
    if (!suggestion) return;
    const d = dateStr();

    const bodyHtml = suggestion
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');

    const subtopicLines = subtopics.split('\n').filter(l => l.trim());
    const subtopicHtml = subtopicLines.map((l, i) => `<li>${i + 1}. ${l.trim()}</li>`).join('');

    const html = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>議題探究建議 — ${topic}</title>
<style>
  body { font-family: 'Microsoft JhengHei', Arial, sans-serif; background: #f0f4f8; color: #333; margin: 0; padding: 24px 16px; }
  .card { background: white; border-radius: 16px; max-width: 700px; margin: 0 auto; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
  h1 { font-size: 1.3rem; color: #4a90d9; margin: 0 0 4px; }
  .meta { color: #888; font-size: 0.875rem; margin-bottom: 24px; }
  .section-title { font-weight: 700; color: #555; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; margin: 20px 0 8px; }
  .subtopics { list-style: none; padding: 12px 16px; margin: 0 0 24px; background: #f7f9fc; border-radius: 8px; }
  .subtopics li { padding: 3px 0; }
  hr { border: none; border-top: 1px solid #e0e8f0; margin: 24px 0; }
  .suggestion { line-height: 1.85; }
  .suggestion h2 { font-size: 1rem; color: #2a6bae; margin: 1.2rem 0 0.3rem; }
  .suggestion h3 { font-size: 0.95rem; color: #357abd; margin: 1rem 0 0.2rem; }
  .suggestion li { margin: 0.15rem 0 0.15rem 1.2rem; }
</style>
</head>
<body>
<div class="card">
  <h1>議題探究建議報告</h1>
  <p class="meta">日期：${d}</p>
  <div class="section-title">主題</div>
  <p><strong>${topic}</strong></p>
  <div class="section-title">子題</div>
  <ul class="subtopics">${subtopicHtml}</ul>
  <hr>
  <div class="suggestion"><p>${bodyHtml}</p></div>
</div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `議題探究建議_${d}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [topic, subtopics, suggestion]);

  return {
    topic, setTopic,
    subtopics, setSubtopics,
    suggestion, isStreaming, hasResult, error,
    evaluate, reset, saveTxt, saveHtml,
  };
}
