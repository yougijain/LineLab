import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export const runtime = "edge";
export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#080b12",
          backgroundImage:
            "radial-gradient(900px 500px at 10% -20%, rgba(52,211,153,0.18), transparent 60%), radial-gradient(800px 500px at 100% 0%, rgba(129,140,248,0.16), transparent 55%)",
          padding: "72px 80px",
          color: "#e2e8f0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="64" height="64" viewBox="0 0 64 64">
            <rect width="64" height="64" rx="14" fill="#0c1018" />
            <path
              d="M12 44 L26 30 L36 38 L52 18"
              fill="none"
              stroke="#34d399"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="52" cy="18" r="5" fill="#34d399" />
            <circle cx="26" cy="30" r="3.5" fill="#818cf8" />
          </svg>
          <div style={{ fontSize: 44, fontWeight: 600, color: "#ffffff" }}>
            {SITE_NAME}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 68,
              fontWeight: 600,
              lineHeight: 1.1,
              color: "#ffffff",
              letterSpacing: "-0.02em",
              maxWidth: 940,
            }}
          >
            Learn the handful of TFT decisions that get you to top 4.
          </div>
          <div style={{ marginTop: 28, fontSize: 30, color: "#94a3b8", maxWidth: 900 }}>
            Fundamentals, a playable Arena with a live coach, and a Monte Carlo solver.
          </div>
        </div>

        <div style={{ display: "flex", gap: 14, fontSize: 24, color: "#34d399" }}>
          <div
            style={{
              border: "1px solid #2a3344",
              borderRadius: 999,
              padding: "8px 20px",
            }}
          >
            Learn
          </div>
          <div
            style={{
              border: "1px solid #2a3344",
              borderRadius: 999,
              padding: "8px 20px",
            }}
          >
            Arena
          </div>
          <div
            style={{
              border: "1px solid #2a3344",
              borderRadius: 999,
              padding: "8px 20px",
            }}
          >
            Solver
          </div>
        </div>
      </div>
    ),
    size,
  );
}
