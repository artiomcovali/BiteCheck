export default function DashboardLoading() {
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
      <section
        style={{
          display: 'grid',
          gap: 10,
          padding: 26,
          borderRadius: 24,
          background: 'var(--bc-surface)',
          border: '1px solid var(--bc-hairline)',
          boxShadow: 'var(--bc-shadow-sm)',
        }}
      >
        <div className="bc-shimmer" style={{ width: 160, height: 24, borderRadius: 999 }} />
        <div className="bc-shimmer" style={{ width: 300, height: 32, borderRadius: 8 }} />
        <div className="bc-shimmer" style={{ width: 240, height: 16, borderRadius: 6 }} />
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bc-shimmer" style={{ height: 140, borderRadius: 20 }} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bc-shimmer" style={{ height: 200, borderRadius: 20 }} />
        ))}
      </div>
    </main>
  );
}
