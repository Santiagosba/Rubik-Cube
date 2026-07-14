// src/context/PlayersContext.jsx
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { PlayersContext } from "./playersStore";

const STORAGE_KEY = "rubik_players_v1";
const CURRENT_KEY = "rubik_current_player_v1";

function loadPlayers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Provee el estado de jugadores y sus récords, persistido en localStorage.
 * Cada jugador: { id, name, bestTime, solves, createdAt }.
 */
export function PlayersProvider({ children }) {
  const [players, setPlayers] = useState(loadPlayers);
  const [currentPlayerId, setCurrentPlayerId] = useState(
    () => localStorage.getItem(CURRENT_KEY) || null
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    if (currentPlayerId) localStorage.setItem(CURRENT_KEY, currentPlayerId);
    else localStorage.removeItem(CURRENT_KEY);
  }, [currentPlayerId]);

  // Crea un jugador por nombre (o selecciona el existente si ya está) y lo
  // deja como jugador activo.
  const addPlayer = useCallback(
    (name) => {
      const clean = (name || "").trim();
      if (!clean) return;
      const existing = players.find(
        (p) => p.name.toLowerCase() === clean.toLowerCase()
      );
      if (existing) {
        setCurrentPlayerId(existing.id);
        return;
      }
      const player = {
        id: uid(),
        name: clean,
        bestTime: null,
        solves: 0,
        createdAt: Date.now(),
      };
      setPlayers((prev) => [...prev, player]);
      setCurrentPlayerId(player.id);
    },
    [players]
  );

  const selectPlayer = useCallback((id) => setCurrentPlayerId(id), []);

  const removePlayer = useCallback((id) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
    setCurrentPlayerId((prev) => (prev === id ? null : prev));
  }, []);

  // Registra un tiempo (en segundos) para el jugador activo: suma una
  // resolución y actualiza su mejor marca.
  const recordTime = useCallback(
    (seconds) => {
      if (!currentPlayerId || !(seconds > 0)) return;
      setPlayers((prev) =>
        prev.map((p) => {
          if (p.id !== currentPlayerId) return p;
          const bestTime =
            p.bestTime == null ? seconds : Math.min(p.bestTime, seconds);
          return { ...p, bestTime, solves: (p.solves || 0) + 1 };
        })
      );
    },
    [currentPlayerId]
  );

  const currentPlayer = useMemo(
    () => players.find((p) => p.id === currentPlayerId) || null,
    [players, currentPlayerId]
  );

  const value = useMemo(
    () => ({
      players,
      currentPlayer,
      currentPlayerId,
      addPlayer,
      selectPlayer,
      removePlayer,
      recordTime,
    }),
    [
      players,
      currentPlayer,
      currentPlayerId,
      addPlayer,
      selectPlayer,
      removePlayer,
      recordTime,
    ]
  );

  return (
    <PlayersContext.Provider value={value}>{children}</PlayersContext.Provider>
  );
}
