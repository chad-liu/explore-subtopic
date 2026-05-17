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

  const saveSuggestion = useCallback(() => {
    if (!suggestion) return;

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    let content = `議題探究建議報告\n日期：${dateStr}\n${'='.repeat(40)}\n\n`;
    content += `主題：${topic}\n\n子題：\n${subtopics}\n\n`;
    content += `${'='.repeat(40)}\n\nAI 評估建議：\n\n${suggestion}`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `議題探究建議_${dateStr}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [topic, subtopics, suggestion]);

  return {
    topic, setTopic,
    subtopics, setSubtopics,
    suggestion, isStreaming, hasResult, error,
    evaluate, reset, saveSuggestion,
  };
}
