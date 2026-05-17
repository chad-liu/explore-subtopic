export default function LoadingDots() {
  return (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', height: '20px' }}>
      {[0, 1, 2].map(i => (
        <span
          key={i}
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#4a90d9',
            display: 'inline-block',
            animation: 'typingBounce 1.2s ease infinite',
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  );
}
