import { useRef } from "react";

export default function IOSNativeVideoCapture({ onPick, disabled }) {
  const inputRef = useRef(null);

  // iOS Safari/WebView: native capture is the most reliable
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        capture="user"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files && e.target.files[0];
          if (f) onPick(f);
          e.target.value = ""; // allow re-pick same file
        }}
      />
      <button
        disabled={disabled}
        onClick={() => inputRef.current && inputRef.current.click()}
        style={{
          padding: "28px 20px",
          borderRadius: 16,
          border: "2px dashed rgba(22,163,74,0.3)",
          background: "linear-gradient(135deg, rgba(22,163,74,0.04), rgba(22,163,74,0.08))",
          cursor: disabled ? "not-allowed" : "pointer",
          textAlign: "center",
          width: "100%"
        }}
      >
        <span style={{ fontSize: 36, display: "block", marginBottom: 8 }}>🎥</span>
        <span style={{ fontSize: 15, fontWeight: 800, display: "block" }}>Record Video (iPhone Safe)</span>
        <span style={{ fontSize: 12, opacity: 0.7 }}>Uses native Camera app · Max 2 minutes</span>
      </button>
    </>
  );
}
