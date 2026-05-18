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

    const applyInline = (text: string) =>
      text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    const convertTable = (tableLines: string[]): string => {
      const isSeparator = (l: string) => /^\|[\s\-:|]+\|$/.test(l.trim());
      const parseRow = (l: string) => l.split('|').slice(1, -1).map(c => c.trim());
      const dataLines = tableLines.filter(l => !isSeparator(l));
      if (dataLines.length === 0) return '';
      const [head, ...body] = dataLines;
      const thead = `<thead><tr>${parseRow(head).map(h => `<th>${applyInline(h)}</th>`).join('')}</tr></thead>`;
      const tbody = body.map(l => `<tr>${parseRow(l).map(c => `<td>${applyInline(c)}</td>`).join('')}</tr>`).join('');
      return `<table>${thead}<tbody>${tbody}</tbody></table>`;
    };

    const markdownToHtml = (md: string): string => {
      const lines = md.split('\n');
      const out: string[] = [];
      let i = 0;
      while (i < lines.length) {
        const line = lines[i];
        const trimmed = line.trim();
        if (/^# (.+)$/.test(line))       { out.push(`<h1>${applyInline(line.slice(2))}</h1>`); i++; continue; }
        if (/^## (.+)$/.test(line))      { out.push(`<h2>${applyInline(line.slice(3))}</h2>`); i++; continue; }
        if (/^### (.+)$/.test(line))     { out.push(`<h3>${applyInline(line.slice(4))}</h3>`); i++; continue; }
        if (/^---+$/.test(trimmed))      { out.push('<hr>'); i++; continue; }
        if (trimmed.startsWith('|')) {
          const rows: string[] = [];
          while (i < lines.length && lines[i].trim().startsWith('|')) { rows.push(lines[i]); i++; }
          out.push(convertTable(rows)); continue;
        }
        if (/^- (.+)$/.test(line)) {
          const items: string[] = [];
          while (i < lines.length && /^- (.+)$/.test(lines[i])) { items.push(`<li>${applyInline(lines[i].slice(2))}</li>`); i++; }
          out.push(`<ul>${items.join('')}</ul>`); continue;
        }
        if (trimmed === '') { out.push('<br>'); i++; continue; }
        out.push(`<p>${applyInline(line)}</p>`);
        i++;
      }
      return out.join('\n');
    };

    const bodyHtml = markdownToHtml(suggestion);
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
  .suggestion h1 { font-size: 1.2rem; color: #1a5fa8; margin: 1.4rem 0 0.4rem; }
  .suggestion h2 { font-size: 1rem; color: #2a6bae; margin: 1.2rem 0 0.3rem; }
  .suggestion h3 { font-size: 0.95rem; color: #357abd; margin: 1rem 0 0.2rem; }
  .suggestion ul { padding-left: 1.4rem; margin: 0.4rem 0; }
  .suggestion li { margin: 0.2rem 0; }
  .suggestion p { margin: 0.4rem 0; }
  .suggestion table { border-collapse: collapse; width: 100%; margin: 1rem 0; font-size: 0.9rem; }
  .suggestion th { background: #4a90d9; color: white; padding: 8px 12px; text-align: left; }
  .suggestion td { padding: 7px 12px; border-bottom: 1px solid #e0e8f0; }
  .suggestion tr:nth-child(even) td { background: #f7f9fc; }
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
  <div class="suggestion">${bodyHtml}</div>
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
