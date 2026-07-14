// src/context/playersStore.js
// Contexto, hook y helpers (sin componentes) para el sistema de jugadores.
import { createContext, useContext } from "react";

export const PlayersContext = createContext(null);

export function usePlayers() {
  const ctx = useContext(PlayersContext);
  if (!ctx) {
    throw new Error("usePlayers debe usarse dentro de <PlayersProvider>");
  }
  return ctx;
}

// Formatea segundos a "m:ss" o "Ns"; null/0 -> "—".
export function formatTime(seconds) {
  if (seconds == null || seconds <= 0) return "—";
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
