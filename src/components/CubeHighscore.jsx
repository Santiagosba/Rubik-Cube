// src/components/CubeHighscore.jsx
import React, { useEffect, useState } from "react";

export default function CubeHighscore({ latestTime }) {
  const [highscore, setHighscore] = useState(() => {
    const saved = localStorage.getItem("cubeHighscore");
    return saved ? parseFloat(saved) : null;
  });

  useEffect(() => {
    if (latestTime && (highscore === null || latestTime < highscore)) {
      setHighscore(latestTime);
      localStorage.setItem("cubeHighscore", latestTime.toFixed(2));
    }
  }, [latestTime]);

  const formatTime = (t) => {
    const minutes = Math.floor(t / 60);
    const seconds = Math.floor(t % 60);
    const ms = Math.floor((t % 1) * 100);
    return `${minutes}:${seconds.toString().padStart(2, "0")}.${ms
      .toString()
      .padStart(2, "0")}`;
  };

  if (highscore === null) return null;

  return (
    <div style={{ fontSize: "18px", color: "#ffd700", fontWeight: "bold", marginBottom: "10px" }}>
      Mejor tiempo: {formatTime(highscore)}
    </div>
  );
}
