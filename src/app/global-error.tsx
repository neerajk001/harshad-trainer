"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#09090b",
            color: "#fafafa",
            padding: "24px",
          }}
        >
          <div style={{ maxWidth: "24rem", textAlign: "center" }}>
            <p style={{ fontSize: "12px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#71717a" }}>
              Harsh Gorul
            </p>
            <h1 style={{ fontSize: "22px", fontWeight: 600, marginTop: "8px" }}>Something went wrong</h1>
            <p style={{ color: "#a1a1aa", fontSize: "14px", marginTop: "8px" }}>
              The app hit an unexpected error. Try again, or reload the page.
            </p>
            <button
              type="button"
              onClick={reset}
              style={{
                marginTop: "20px",
                background: "#fafafa",
                color: "#09090b",
                border: "none",
                borderRadius: "8px",
                padding: "10px 18px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
