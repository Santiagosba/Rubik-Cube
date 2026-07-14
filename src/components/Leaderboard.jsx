// src/components/Leaderboard.jsx
import React from "react";
import { usePlayers, formatTime } from "../context/playersContext";

const MEDALS = ["🥇", "🥈", "🥉"];

/**
 * Tabla de récords: ordena a los jugadores por su mejor tiempo (los que aún
 * no tienen marca van al final) y resalta al jugador activo.
 */
export default function Leaderboard() {
  const { players, currentPlayerId } = usePlayers();

  const ranked = [...players].sort((a, b) => {
    const at = a.bestTime == null ? Infinity : a.bestTime;
    const bt = b.bestTime == null ? Infinity : b.bestTime;
    if (at !== bt) return at - bt;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="leaderboard">
      <h2 className="leaderboard-title">🏆 Récords</h2>

      {ranked.length === 0 ? (
        <p className="leaderboard-empty">
          Aún no hay jugadores. Crea uno para registrar tus tiempos.
        </p>
      ) : (
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th className="col-rank">#</th>
              <th className="col-name">Jugador</th>
              <th className="col-time">Mejor tiempo</th>
              <th className="col-solves">Resueltos</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((p, i) => {
              const hasTime = p.bestTime != null;
              return (
                <tr
                  key={p.id}
                  className={p.id === currentPlayerId ? "row-current" : ""}
                >
                  <td className="col-rank">
                    {hasTime && MEDALS[i] ? MEDALS[i] : i + 1}
                  </td>
                  <td className="col-name">{p.name}</td>
                  <td className="col-time">{formatTime(p.bestTime)}</td>
                  <td className="col-solves">{p.solves || 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
