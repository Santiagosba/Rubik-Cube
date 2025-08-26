// src/components/TrainingModeToggle.jsx
import React from "react";

export default function TrainingModeToggle({ training, onToggle }) {
  return (
    <button
      onClick={onToggle}
      style={{
        padding: "10px 20px",
        margin: "10px",
        borderRadius: "12px",
        background: training ? "#ff6600" : "#444",
        color: "#fff",
        fontWeight: "bold",
        fontSize: "16px",
        border: "none",
        cursor: "pointer",
      }}
    >
      🏋️ {training ? "Modo Entrenamiento ON" : "Modo Entrenamiento OFF"}
    </button>
  );
}
