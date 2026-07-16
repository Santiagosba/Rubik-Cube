// src/components/CubeOptions.jsx
import React from "react";
import { SKINS } from "../hooks/useRubikCube";

const TYPES = [
  { size: 2, label: "2×2", desc: "Pocket" },
  { size: 3, label: "3×3", desc: "Clásico" },
  { size: 4, label: "4×4", desc: "Venganza" },
  { size: 5, label: "5×5", desc: "Profesor" },
];

/**
 * Selectores de tipo de cubo (2×2 / 3×3) y de skin (material).
 */
export default function CubeOptions({ cubeSize, onCubeSize, skin, onSkin }) {
  return (
    <div className="cube-options">
      <div className="option-group">
        <span className="option-title">Cubo</span>
        <div className="option-row">
          {TYPES.map((t) => (
            <button
              key={t.size}
              type="button"
              className={`option-btn ${cubeSize === t.size ? "active" : ""}`}
              onClick={() => onCubeSize(t.size)}
            >
              <span className="option-label">{t.label}</span>
              <span className="option-desc">{t.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="option-group">
        <span className="option-title">Skin</span>
        <div className="option-row">
          {SKINS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`option-btn skin ${skin === s.id ? "active" : ""}`}
              onClick={() => onSkin(s.id)}
              title={s.label}
            >
              <span className="option-emoji">{s.emoji}</span>
              <span className="option-desc">{s.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
