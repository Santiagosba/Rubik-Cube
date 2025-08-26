// src/components/ProgressIndicator.jsx
import React from "react";

export default function ProgressIndicator({ progress }) {
  return (
    <div
      style={{
        color: "#00ffff",
        textAlign: "center",
        fontSize: "18px",
        margin: "10px auto",
        fontFamily: "monospace",
        background: "rgba(0, 255, 255, 0.1)",
        borderRadius: "10px",
        padding: "10px 20px",
        width: "fit-content",
        boxShadow: "0 4px 12px rgba(0, 255, 255, 0.3)",
        backdropFilter: "blur(6px)",
      }}
    >
      🧠 Progreso: {progress ?? 0}%
    </div>
  );
}
