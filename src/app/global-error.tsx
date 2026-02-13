"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "system-ui, sans-serif",
            padding: "1rem",
            background: "#fafafa",
          }}
        >
          <div style={{ textAlign: "center", maxWidth: "400px" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                margin: "0 auto 16px",
                borderRadius: "50%",
                background: "#fee2e2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
              }}
            >
              !
            </div>
            <h2 style={{ fontSize: "18px", fontWeight: 600, margin: "0 0 8px" }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 24px" }}>
              {error.message === "fetch failed"
                ? "Unable to connect. Please check your internet connection."
                : "An unexpected error occurred. Please try again."}
            </p>
            <button
              onClick={reset}
              style={{
                padding: "8px 20px",
                fontSize: "14px",
                fontWeight: 500,
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                background: "#111",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Try Again
            </button>
            {error.digest && (
              <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: "16px" }}>
                Error ID: {error.digest}
              </p>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
