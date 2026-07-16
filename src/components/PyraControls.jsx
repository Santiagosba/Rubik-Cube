// src/components/PyraControls.jsx
import React from "react";

const LABELS = ["A", "B", "C", "D"];

/**
 * Controles del Pyraminx: un giro de 120° (↻ / ↺) por cada uno de los 4
 * vértices. Si hay pista (modo fácil) resalta el botón a pulsar.
 */
export default function PyraControls({ onRotate, hintMove }) {
  return (
    <div className="controls-container pyra">
      {LABELS.map((label, v) => (
        <div className="axis-section" key={v}>
          <h3>Vértice {label}</h3>
          <div className="button-group">
            {[1, -1].map((dir) => {
              const hinted =
                hintMove &&
                hintMove.vertex === v &&
                hintMove.direction === dir;
              return (
                <button
                  key={dir}
                  className={`glass-button ${hinted ? "hint" : ""}`}
                  onClick={() => onRotate(v, dir)}
                >
                  {label} {dir === 1 ? "↻" : "↺"}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
