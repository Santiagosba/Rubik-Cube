// src/components/PyraControls.jsx
import React from "react";
import { PYRA_VERTEX_COLORS } from "../logic/pyraminx.js";

const LABELS = ["A", "B", "C", "D"];
const hex = (c) => `#${c.toString(16).padStart(6, "0")}`;

/**
 * Controles del Pyraminx: un giro de 120° (↻ / ↺) por cada uno de los 4
 * vértices. Cada tarjeta muestra los 3 colores que se encuentran en ese
 * vértice para poder localizarlo en la pirámide. Si hay pista (modo fácil)
 * resalta el botón a pulsar.
 */
export default function PyraControls({ onRotate, hintMove }) {
  return (
    <div className="controls-container pyra">
      {LABELS.map((label, v) => (
        <div className="axis-section pyra-vertex" key={v}>
          <h3>Vértice {label}</h3>
          <div className="pyra-swatches" aria-hidden="true">
            {PYRA_VERTEX_COLORS[v].map((c, i) => (
              <span
                key={i}
                className="pyra-swatch"
                style={{ background: hex(c) }}
              />
            ))}
          </div>
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
                  aria-label={`Vértice ${label} ${
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
