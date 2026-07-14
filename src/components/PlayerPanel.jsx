// src/components/PlayerPanel.jsx
import React, { useState } from "react";
import { usePlayers } from "../context/playersContext";

/**
 * Alta y selección de jugador (solo con el nombre). El jugador activo es a
 * quien se le registran los tiempos de resolución.
 */
export default function PlayerPanel() {
  const { players, currentPlayerId, addPlayer, selectPlayer, removePlayer } =
    usePlayers();
  const [name, setName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    addPlayer(name);
    setName("");
  };

  return (
    <div className="player-panel">
      <form className="player-form" onSubmit={handleSubmit}>
        <input
          className="player-input"
          type="text"
          value={name}
          maxLength={20}
          placeholder="Nombre del jugador"
          aria-label="Nombre del jugador"
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit" className="player-add-btn" disabled={!name.trim()}>
          + Crear
        </button>
      </form>

      {players.length > 0 && (
        <div className="player-list">
          {players.map((p) => {
            const active = p.id === currentPlayerId;
            return (
              <div
                key={p.id}
                className={`player-chip ${active ? "active" : ""}`}
              >
                <button
                  type="button"
                  className="player-chip-name"
                  onClick={() => selectPlayer(p.id)}
                  title={active ? "Jugador activo" : "Elegir jugador"}
                >
                  {active ? "👤 " : ""}
                  {p.name}
                </button>
                <button
                  type="button"
                  className="player-chip-remove"
                  onClick={() => removePlayer(p.id)}
                  aria-label={`Eliminar ${p.name}`}
                  title="Eliminar"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
