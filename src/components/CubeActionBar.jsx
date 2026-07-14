// src/components/CubeActionBar.jsx
import React from "react";

/**
 * Botones principales (rotar/mezclar/resetear) e información de estado.
 * Adapta su presentación entre las variantes móvil y escritorio.
 */
export default function CubeActionBar({
  isRotating,
  lastMove,
  isMobile,
  onToggleRotation,
  onShuffle,
  onReset,
}) {
  const rotationClass = isRotating ? "rotating" : "stopped";

  if (isMobile) {
    return (
      <>
        <div className="mobile-main-buttons">
          <button
            className={`compact-button rotation-button ${rotationClass}`}
            onClick={onToggleRotation}
          >
            {isRotating ? "⏸️ Parar" : "▶️ Rotar"}
          </button>
          <button
            className="compact-button shuffle-button"
            onClick={() => onShuffle(20)}
          >
            🎲 Mezclar
          </button>
          <button className="compact-button reset-button" onClick={onReset}>
            🔄 Reset
          </button>
        </div>

        <div className="mobile-status">
          <div className="last-move-mobile">{lastMove || "—"}</div>
          <div className="drag-hint">✋ Arrastra el cubo para girar la vista</div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="main-buttons">
        <button
          className={`main-button rotation-button ${rotationClass}`}
          onClick={onToggleRotation}
        >
          {isRotating ? "Detener rotación" : "Reanudar rotación"}
        </button>
        <button
          className="main-button shuffle-button"
          onClick={() => onShuffle(20)}
        >
          Mezclar cubo
        </button>
        <button className="main-button reset-button" onClick={onReset}>
          Resetear cubo
        </button>
      </div>

      <div className="status-info">
        <div className="last-move">Último movimiento: {lastMove || "—"}</div>
        <div className="keyboard-info">
          Teclas para rotar: Q/A/Z/W/S/X (X), E/D/C/R/F/V (Y), T/G/B/Y/H/N (Z)
        </div>
      </div>
    </>
  );
}
