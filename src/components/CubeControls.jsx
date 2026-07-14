// src/components/CubeControls.jsx
import React, { useState } from "react";

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

function AxisButtons({ moves, axis, onRotate, isMobile }) {
  return (
    <div className="button-group">
      {moves.map(([index, dir, label]) => {
        const arrow = dir === 1 ? "↻" : "↺";
        const text = isMobile ? `${label} ${arrow}` : `Girar ${label} ${arrow}`;
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
  );
}

/**
 * Panel de botones para girar cada capa del cubo.
 *
 * En escritorio muestra los tres ejes lado a lado; en móvil usa pestañas para
 * mostrar un solo eje a la vez, con botones grandes y sin scroll interminable.
 */
export default function CubeControls({ onRotate, isMobile }) {
  const [activeAxis, setActiveAxis] = useState("x");

  if (isMobile) {
    const current = AXES.find((a) => a.axis === activeAxis) ?? AXES[0];
    return (
      <div className="controls-container mobile">
        <div className="axis-tabs">
          {AXES.map((a) => (
            <button
              key={a.axis}
              className={`axis-tab ${a.axis === activeAxis ? "active" : ""}`}
              onClick={() => setActiveAxis(a.axis)}
            >
              {a.title}
            </button>
          ))}
        </div>

        <div className="axis-section">
          <AxisButtons
            moves={current.moves}
            axis={current.axis}
            onRotate={onRotate}
            isMobile
          />
        </div>
      </div>
    );
  }

  return (
    <div className="controls-container desktop">
      {AXES.map(({ axis, title, moves }) => (
        <div className="axis-section" key={axis}>
          <h3>{title}</h3>
          <AxisButtons
            moves={moves}
            axis={axis}
            onRotate={onRotate}
            isMobile={false}
          />
        </div>
      ))}
    </div>
  );
}
