export default function ProfileLoading() {
  return (
    <main
      style={{
        maxWidth: 1180,
        margin: '0 auto',
        padding: '28px 20px 56px',
        display: 'grid',
        gap: 24,
      }}
    >
      <div
        style={{
          padding: 26,
          borderRadius: 24,
          background: 'var(--bc-surface)',
          border: '1px solid var(--bc-hairline)',
          boxShadow: 'var(--bc-shadow-sm)',
          display: 'grid',
          gap: 10,
        }}
      >
        <div className="bc-shimmer" style={{ width: 180, height: 14, borderRadius: 6 }} />
        <div className="bc-shimmer" style={{ width: 320, height: 32, borderRadius: 8 }} />
        <div className="bc-shimmer" style={{ width: 500, height: 16, borderRadius: 6 }} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bc-shimmer" style={{ height: 240, borderRadius: 22 }} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bc-shimmer" style={{ height: 160, borderRadius: 22 }} />
        ))}
      </div>
    </main>
  );
}
