// src/components/DifficultySelector.jsx
import React from "react";

const MODES = [
  { id: "easy", label: "Fácil", desc: "Mucha ayuda" },
  { id: "medium", label: "Medio", desc: "Un poco de ayuda" },
  { id: "hard", label: "Difícil", desc: "Sin ayuda" },
];

/**
 * Selector de dificultad: define cuánta ayuda da el juego para resolver.
 */
export default function DifficultySelector({ value, onChange }) {
  return (
    <div className="difficulty-selector">
      {MODES.map((m) => (
        <button
          key={m.id}
          type="button"
          className={`difficulty-btn ${value === m.id ? "active" : ""}`}
          onClick={() => onChange(m.id)}
        >
          <span className="difficulty-label">{m.label}</span>
          <span className="difficulty-desc">{m.desc}</span>
        </button>
      ))}
    </div>
  );
}
