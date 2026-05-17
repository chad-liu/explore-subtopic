interface Props {
  topic: string;
  subtopics: string;
  onTopicChange: (v: string) => void;
  onSubtopicsChange: (v: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  error: string | null;
}

export default function InputPanel({
  topic,
  subtopics,
  onTopicChange,
  onSubtopicsChange,
  onSubmit,
  disabled,
  error,
}: Props) {
  const inputBase: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    border: '1.5px solid #c0ccd8',
    borderRadius: '8px',
    fontSize: '1rem',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
    background: disabled ? '#f7f9fc' : 'white',
    color: '#333',
    transition: 'border-color 0.2s',
  };

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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* 主題 */}
        <div>
          <label
            style={{
              display: 'block',
              fontWeight: '600',
              color: '#333',
              marginBottom: '8px',
              fontSize: '0.95rem',
            }}
          >
            主題
          </label>
          <input
            type="text"
            value={topic}
            onChange={e => onTopicChange(e.target.value)}
            placeholder="例：氣候變遷、台灣的飲食文化、網路霸凌..."
            disabled={disabled}
            style={inputBase}
          />
        </div>

        {/* 子題 */}
        <div>
          <label
            style={{
              display: 'block',
              fontWeight: '600',
              color: '#333',
              marginBottom: '8px',
              fontSize: '0.95rem',
            }}
          >
            子題{' '}
            <span style={{ fontWeight: '400', color: '#888', fontSize: '0.875rem' }}>
              （每行填寫一個，建議 4～5 個）
            </span>
          </label>
          <textarea
            value={subtopics}
            onChange={e => onSubtopicsChange(e.target.value)}
            rows={6}
            placeholder={'子題 1\n子題 2\n子題 3\n子題 4'}
            disabled={disabled}
            style={{
              ...inputBase,
              resize: 'vertical',
              lineHeight: '1.7',
            }}
          />
        </div>

        {error && (
          <p style={{ color: '#e74c3c', fontSize: '0.875rem', margin: 0 }}>{error}</p>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onSubmit}
            disabled={disabled}
            style={{
              background: disabled ? '#a0b8d0' : '#4a90d9',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 28px',
              fontSize: '1rem',
              fontWeight: '600',
              fontFamily: 'inherit',
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {disabled ? '評估中...' : '取得建議'}
          </button>
        </div>
      </div>
    </div>
  );
}
