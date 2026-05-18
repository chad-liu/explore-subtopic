import LoadingDots from './LoadingDots';

interface Props {
  suggestion: string;
  isStreaming: boolean;
  hasResult: boolean;
  onSaveTxt: () => void;
  onSaveHtml: () => void;
}

function parseMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(
      /^### (.+)$/gm,
      '<span style="display:block;font-weight:700;color:#357abd;font-size:1rem;margin-top:1rem;margin-bottom:0.2rem">$1</span>'
    )
    .replace(
      /^## (.+)$/gm,
      '<span style="display:block;font-weight:700;color:#2a6bae;font-size:1.05rem;margin-top:1.2rem;margin-bottom:0.25rem">$1</span>'
    )
    .replace(
      /^- (.+)$/gm,
      '<span style="display:block;padding-left:1.2em;position:relative">• $1</span>'
    )
    .replace(/\n/g, '<br>');
}

export default function SuggestionPanel({ suggestion, isStreaming, hasResult, onSaveTxt, onSaveHtml }: Props) {
  return (
    <div
      style={{
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        padding: '24px',
        animation: 'fadeIn 0.3s ease',
      }}
    >
      <h2
        style={{
          fontWeight: '700',
          color: '#333',
          fontSize: '1.05rem',
          margin: '0 0 16px',
        }}
      >
        🤖 AI 評估建議
      </h2>

      {suggestion ? (
        <div
          style={{ lineHeight: '1.85', color: '#333', fontSize: '0.95rem' }}
          dangerouslySetInnerHTML={{ __html: parseMarkdown(suggestion) }}
        />
      ) : (
        <div style={{ color: '#888', fontSize: '0.95rem' }}>正在分析中...</div>
      )}

      {isStreaming && (
        <div style={{ marginTop: '16px' }}>
          <LoadingDots />
        </div>
      )}

      {hasResult && !isStreaming && (
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            onClick={onSaveTxt}
            style={{
              background: '#5cb85c',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '9px 22px',
              fontSize: '0.9rem',
              fontWeight: '600',
              fontFamily: 'inherit',
              cursor: 'pointer',
            }}
          >
            📄 文字檔
          </button>
          <button
            onClick={onSaveHtml}
            style={{
              background: '#4a90d9',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '9px 22px',
              fontSize: '0.9rem',
              fontWeight: '600',
              fontFamily: 'inherit',
              cursor: 'pointer',
            }}
          >
            🌐 網頁
          </button>
        </div>
      )}
    </div>
  );
}
