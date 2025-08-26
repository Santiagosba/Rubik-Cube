// src/components/ShuffleButton.jsx
import React from "react";

export default function ShuffleButton({ onShuffle }) {
  return (
    <button
      onClick={onShuffle}
      style={{
        padding: "10px 20px",
        margin: "10px",
        borderRadius: "12px",
        background: "#007bff",
        color: "#fff",
        fontWeight: "bold",
        fontSize: "16px",
        border: "none",
        cursor: "pointer",
      }}
    >
      🎲 Mezclar Cubo
    </button>
  );
}
