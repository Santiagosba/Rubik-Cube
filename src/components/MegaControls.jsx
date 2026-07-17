// src/components/MegaControls.jsx
import React from "react";
import { MEGA_COLORS, MEGA_FACE_LABELS } from "../logic/megaminx.js";

const hex = (c) => `#${c.toString(16).padStart(6, "0")}`;

/**
 * Controles del Megaminx: un giro de 72° (↻ / ↺) por cada una de las 12 caras.
 * Cada cara se identifica por su color. Si hay pista (modo fácil) resalta el
 * botón a pulsar.
 */
export default function MegaControls({ onRotate, hintMove }) {
  return (
    <div className="controls-container mega">
      {MEGA_FACE_LABELS.map((label, f) => (
        <div className="axis-section mega-face" key={f}>
          <h3>
            <span
              className="mega-swatch"
              style={{ background: hex(MEGA_COLORS[f]) }}
            />
            {label}
          </h3>
          <div className="button-group">
            {[1, -1].map((dir) => {
              const hinted =
                hintMove && hintMove.face === f && hintMove.direction === dir;
              return (
                <button
                  key={dir}
                  className={`glass-button ${hinted ? "hint" : ""}`}
                  onClick={() => onRotate(f, dir)}
                >
                  {dir === 1 ? "↻" : "↺"}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
