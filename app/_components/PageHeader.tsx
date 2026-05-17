interface Props {
  onReset: () => void;
  hasResult: boolean;
}

export default function PageHeader({ onReset, hasResult }: Props) {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: 'linear-gradient(135deg, #4a90d9 0%, #357abd 100%)',
        boxShadow: '0 2px 8px rgba(74,144,217,0.3)',
      }}
    >
      <div
        style={{
          maxWidth: '700px',
          margin: '0 auto',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h1 style={{ color: 'white', fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>
            議題探究小幫手
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem', margin: '3px 0 0' }}>
            主題與子題評估建議
          </p>
        </div>
        {hasResult && (
          <button
            onClick={onReset}
            style={{
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.5)',
              borderRadius: '8px',
              padding: '7px 16px',
              fontSize: '0.875rem',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            重新開始
          </button>
        )}
      </div>
    </header>
  );
}
