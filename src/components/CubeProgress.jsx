// src/components/CubeProgress.jsx
import React from "react";

/**
 * Barra de progreso del cubo (fracción de stickers en su cara correcta).
 * Siempre refleja el estado real del cubo.
 */
export default function CubeProgress({ progress, solved, everScrambled }) {
  const done = solved && everScrambled;
  return (
    <div className="cube-progress">
      <div className="cube-progress-track">
        <div
          className={`cube-progress-fill ${done ? "done" : ""}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="cube-progress-label">
        {done ? "🎉 ¡Resuelto!" : `🧩 Progreso: ${progress}%`}
      </div>
    </div>
  );
}
