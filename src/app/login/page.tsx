/**
 * /login — sign-in / sign-up. Public route.
 *
 * Middleware already redirects authenticated users away from `/login`, so we
 * skip the explicit auth check here and trust the middleware contract.
 */

import { LoginForm, LoginHero } from "./LoginForm";

export const metadata = {
  title: "Sign in · BiteCheck",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr)",
        background: "var(--bc-bg)",
      }}
      className="bc-login-shell"
    >
      <div className="bc-login-hero">
        <LoginHero />
      </div>
      <main
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "48px 32px",
        }}
      >
        <div style={{ width: "100%", maxWidth: 420, margin: "0 auto" }}>
          <LoginForm next={next} />
        </div>
      </main>

      {/* Two-column on >=900px, single column below */}
      <style>{`
        @media (min-width: 900px) {
          .bc-login-shell {
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
          }
        }
        @media (max-width: 899px) {
          .bc-login-hero { display: none; }
        }
      `}</style>
    </div>
  );
}
