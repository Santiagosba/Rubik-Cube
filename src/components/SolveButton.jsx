// src/components/SolveButton.jsx
import React from "react";

export default function SolveButton({ onSolve }) {
  return (
    <button
      onClick={onSolve}
      style={{
        padding: "10px 20px",
        margin: "10px",
        borderRadius: "12px",
        background: "#28a745",
        color: "#fff",
        fontWeight: "bold",
        fontSize: "16px",
        border: "none",
        cursor: "pointer",
      }}
    >
      ✅ Resolver Cubo
    </button>
  );
}
