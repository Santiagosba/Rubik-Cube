// src/components/CubeTimer.jsx
import React, { useEffect, useState } from "react";

export default function CubeTimer() {
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const [highscore, setHighscore] = useState(() => {
    return localStorage.getItem("rubik_best_time") || null;
  });

  useEffect(() => {
    let interval;
    if (running) {
      interval = setInterval(() => setTime((t) => t + 1), 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [running]);

  const handleReset = () => {
    if (!running && time > 0) {
      if (!highscore || time < highscore) {
        localStorage.setItem("rubik_best_time", time);
        setHighscore(time);
      }
      setTime(0);
    }
  };

  return (
    <div style={{ color: "#00ffff", textAlign: "center", marginBottom: "1rem" }}>
      <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
        ⏱ Tiempo: {time}s
      </div>
      <button
        onClick={() => setRunning(!running)}
        style={{
          marginRight: "10px",
          padding: "6px 16px",
          background: running ? "#cc0000" : "#00ff99",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        {running ? "Pausar" : "Iniciar"}
      </button>
      <button
        onClick={handleReset}
        disabled={running}
        style={{
          padding: "6px 16px",
          background: "#444",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        Guardar tiempo
      </button>
      {highscore && (
        <div style={{ marginTop: "0.5rem", color: "#aaa" }}>
          🏆 Mejor tiempo: {highscore}s
        </div>
      )}
    </div>
  );
}
