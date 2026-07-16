// src/components/HintBar.jsx
import React, { useState, useEffect } from "react";
import { moveLabel } from "../hooks/useRubikCube";

/**
 * Muestra la ayuda según la dificultad:
 * - Fácil: siempre indica el siguiente giro para resolver.
 * - Medio: botón "Pista" que revela el siguiente giro bajo demanda.
 * - Difícil: sin ayuda.
 * Cuando el cubo se resuelve, muestra el mensaje de victoria.
 */
export default function HintBar({
  difficulty,
  nextHint,
  solved,
  everScrambled,
  cubeSize = 3,
}) {
  const [revealed, setRevealed] = useState(false);

  // Ocultar la pista revelada cada vez que cambia el siguiente movimiento.
  useEffect(() => {
    setRevealed(false);
  }, [nextHint]);

  if (solved) {
    if (!everScrambled) return null;
    return <div className="hint-bar win">🎉 ¡Cubo resuelto! Bien hecho</div>;
  }

  if (difficulty === "hard" || !nextHint) return null;

  if (difficulty === "easy") {
    return (
      <div className="hint-bar easy">
        👉 Gira <b>{moveLabel(nextHint, cubeSize)}</b>
      </div>
    );
  }

  // Medio: ayuda bajo demanda.
  return revealed ? (
    <div className="hint-bar medium">
      💡 Gira <b>{moveLabel(nextHint, cubeSize)}</b>
    </div>
  ) : (
    <button
      type="button"
      className="hint-btn"
      onClick={() => setRevealed(true)}
    >
      💡 Pista
    </button>
  );
}
