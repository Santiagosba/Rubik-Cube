// src/components/CubeTimer.jsx
import React, { useEffect, useState } from "react";
import { usePlayers, formatTime } from "../context/playersContext";

export default function CubeTimer() {
  const { currentPlayer, recordTime } = usePlayers();
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => setTime((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [running]);

  const handleSave = () => {
    if (running || time <= 0 || !currentPlayer) return;
    recordTime(time);
    setTime(0);
    setRunning(false);
  };

  const canSave = !running && time > 0 && !!currentPlayer;

  return (
    <div className="cube-timer">
      <div className="cube-timer-value">⏱ {formatTime(time) === "—" ? "0s" : formatTime(time)}</div>

      <div className="cube-timer-buttons">
        <button
          type="button"
          className={`timer-btn ${running ? "stop" : "start"}`}
          onClick={() => setRunning((r) => !r)}
        >
          {running ? "Pausar" : "Iniciar"}
        </button>
        <button
          type="button"
          className="timer-btn save"
          onClick={handleSave}
          disabled={!canSave}
        >
          Guardar tiempo
        </button>
      </div>

      {currentPlayer ? (
        <div className="cube-timer-best">
          {currentPlayer.name}: mejor {formatTime(currentPlayer.bestTime)}
        </div>
      ) : (
        <div className="cube-timer-hint">
          Crea o elige un jugador para guardar tu tiempo
        </div>
      )}
    </div>
  );
}
