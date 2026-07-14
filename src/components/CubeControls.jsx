// src/components/CubeControls.jsx
import React from "react";

// Definición de los botones por eje: cada entrada es [índice, dirección, etiqueta].
const AXES = [
  {
    axis: "x",
    title: "Eje X",
    moves: [
      [1, 1, "X+"],
      [1, -1, "X+"],
      [0, 1, "X0"],
      [0, -1, "X0"],
      [-1, 1, "X-"],
      [-1, -1, "X-"],
    ],
  },
  {
    axis: "y",
    title: "Eje Y",
    moves: [
      [1, 1, "Y+"],
      [1, -1, "Y+"],
      [0, 1, "Y0"],
      [0, -1, "Y0"],
      [-1, 1, "Y-"],
      [-1, -1, "Y-"],
    ],
  },
  {
    axis: "z",
    title: "Eje Z",
    moves: [
      [1, 1, "Z+"],
      [1, -1, "Z+"],
      [0, 1, "Z0"],
      [0, -1, "Z0"],
      [-1, 1, "Z-"],
      [-1, -1, "Z-"],
    ],
  },
];

/**
 * Panel de botones para girar cada capa del cubo en los tres ejes.
 */
export default function CubeControls({ onRotate, isMobile }) {
  return (
    <div className={`controls-container ${isMobile ? "mobile" : "desktop"}`}>
      {AXES.map(({ axis, title, moves }) => (
        <div className="axis-section" key={axis}>
          <h3>{title}</h3>
          <div className="button-group">
            {moves.map(([index, dir, label]) => {
              const arrow = dir === 1 ? "↻" : "↺";
              const text = isMobile
                ? `${label} ${arrow}`
                : `Girar ${label} ${arrow}`;
              return (
                <button
                  key={`${label}-${dir}`}
                  className="glass-button"
                  onClick={() => onRotate(axis, index, dir)}
                >
                  {text}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
