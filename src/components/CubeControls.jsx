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

// Capas de un eje para un cubo N×N×N, de arriba (N-1) a abajo (0).
function axisLayers(axis, N) {
  const layers = [];
  for (let g = N - 1; g >= 0; g--) {
    layers.push({ index: g, label: `${axis.toUpperCase()}${layerLabel(g, N)}` });
  }
  return layers;
}

function isHinted(hintMove, axis, index, dir) {
  return (
    hintMove &&
    hintMove.axis === axis &&
    hintMove.index === index &&
    hintMove.direction === dir
  );
}

// Lista de capas de un eje: cada fila es una capa con sus dos giros (↻ / ↺).
function LayerRows({ axis, N, onRotate, hintMove }) {
  return (
    <div className="layer-list">
      {axisLayers(axis, N).map(({ index, label }) => (
        <div className="layer-row" key={label}>
          <span className="layer-label">{label}</span>
          <div className="button-group">
            {[1, -1].map((dir) => {
              const hinted = isHinted(hintMove, axis, index, dir);
              return (
                <button
                  key={dir}
                  className={`glass-button ${hinted ? "hint" : ""}`}
                  onClick={() => onRotate(axis, index, dir)}
                  aria-label={`Girar ${label} ${
                    dir === 1 ? "horario" : "antihorario"
                  }`}
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

/**
 * Panel de botones para girar cada capa del cubo (2×2 … 5×5). Cada capa es una
 * fila con su etiqueta y sus dos sentidos de giro.
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
          <LayerRows
            axis={current.axis}
            N={cubeSize}
            onRotate={onRotate}
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
          <LayerRows
            axis={axis}
            N={cubeSize}
            onRotate={onRotate}
            hintMove={hintMove}
          />
        </div>
      ))}
    </div>
  );
}
