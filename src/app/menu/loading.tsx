export default function MenuLoading() {
  return (
    <div style={{ minHeight: 'calc(100vh - 58px)' }}>
      <main
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '28px 20px 56px',
          display: 'grid',
          gap: 24,
        }}
      >
        <section style={{ display: 'grid', gap: 10 }}>
          <div className="bc-shimmer" style={{ width: 200, height: 24, borderRadius: 999 }} />
          <div className="bc-shimmer" style={{ width: 420, height: 32, borderRadius: 8 }} />
          <div className="bc-shimmer" style={{ width: 320, height: 16, borderRadius: 6 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="bc-shimmer" style={{ width: 80, height: 24, borderRadius: 999 }} />
            <div className="bc-shimmer" style={{ width: 120, height: 24, borderRadius: 999 }} />
            <div className="bc-shimmer" style={{ width: 80, height: 24, borderRadius: 999 }} />
          </div>
        </section>

        <section
          style={{
            display: 'grid',
            gap: 16,
            padding: 20,
            borderRadius: 20,
            background: 'var(--bc-surface)',
            border: '1px solid var(--bc-hairline)',
            boxShadow: 'var(--bc-shadow-sm)',
          }}
        >
          <div className="bc-shimmer" style={{ width: '100%', height: 42, borderRadius: 14 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="bc-shimmer"
                style={{ width: 90, height: 28, borderRadius: 999 }}
              />
            ))}
          </div>
        </section>

        <div style={{ display: 'grid', gap: 16 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bc-shimmer"
              style={{ width: '100%', height: 180, borderRadius: 20 }}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
