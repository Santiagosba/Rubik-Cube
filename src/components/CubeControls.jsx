// src/components/CubeControls.jsx
import React, { useState, useEffect } from "react";

const AXES = [
  { axis: "x", title: "Eje X" },
  { axis: "y", title: "Eje Y" },
  { axis: "z", title: "Eje Z" },
];

// Etiqueta de la capa: +/0/- en cubos pequeños, número en los grandes.
function layerLabel(index, N) {
  if (N <= 3) {
    if (index === N - 1) return "+";
    if (index === 0) return "-";
    return "0";
  }
  return String(index + 1);
}

// Movimientos de un eje para un cubo N×N×N: capas de arriba (N-1) a abajo (0),
// cada una en los dos sentidos. Devuelve [gridIndex, dir, label].
function axisMoves(axis, N) {
  const moves = [];
  for (let g = N - 1; g >= 0; g--) {
    const label = `${axis.toUpperCase()}${layerLabel(g, N)}`;
    moves.push([g, 1, label]);
    moves.push([g, -1, label]);
  }
  return moves;
}

function isHinted(hintMove, axis, index, dir) {
  return (
    hintMove &&
    hintMove.axis === axis &&
    hintMove.index === index &&
    hintMove.direction === dir
  );
}

function AxisButtons({ axis, N, onRotate, isMobile, hintMove }) {
  return (
    <div className="button-group">
      {axisMoves(axis, N).map(([index, dir, label]) => {
        const arrow = dir === 1 ? "↻" : "↺";
        const text = isMobile ? `${label} ${arrow}` : `Girar ${label} ${arrow}`;
        const hinted = isHinted(hintMove, axis, index, dir);
        return (
          <button
            key={`${label}-${dir}`}
            className={`glass-button ${hinted ? "hint" : ""}`}
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
 * Panel de botones para girar cada capa del cubo (2×2 o 3×3).
 *
 * En escritorio muestra los tres ejes lado a lado; en móvil usa pestañas para
 * mostrar un solo eje a la vez. Si hay pista (modo fácil) resalta el botón a
 * pulsar y abre automáticamente su pestaña.
 */
export default function CubeControls({ onRotate, isMobile, hintMove, cubeSize = 3 }) {
  const [activeAxis, setActiveAxis] = useState("x");

  useEffect(() => {
    if (hintMove) setActiveAxis(hintMove.axis);
  }, [hintMove]);

  if (isMobile) {
    const current = AXES.find((a) => a.axis === activeAxis) ?? AXES[0];
    return (
      <div className="controls-container mobile">
        <div className="axis-tabs">
          {AXES.map((a) => {
            const isHintAxis = hintMove && hintMove.axis === a.axis;
            return (
              <button
                key={a.axis}
                className={`axis-tab ${a.axis === activeAxis ? "active" : ""} ${
                  isHintAxis ? "hint" : ""
                }`}
                onClick={() => setActiveAxis(a.axis)}
              >
                {a.title}
              </button>
            );
          })}
        </div>

        <div className="axis-section">
          <AxisButtons
            axis={current.axis}
            N={cubeSize}
            onRotate={onRotate}
            isMobile
            hintMove={hintMove}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="controls-container desktop">
      {AXES.map(({ axis, title }) => (
        <div className="axis-section" key={axis}>
          <h3>{title}</h3>
          <AxisButtons
            axis={axis}
            N={cubeSize}
            onRotate={onRotate}
            isMobile={false}
            hintMove={hintMove}
          />
        </div>
      ))}
    </div>
  );
}
