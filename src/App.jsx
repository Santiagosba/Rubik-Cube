import React from "react";
import RubikCube from "./components/RubikCube";
import CubeTImer from "./components/CubeTImer";
import PlayerPanel from "./components/PlayerPanel";
import Leaderboard from "./components/Leaderboard";
import "./App.css";
import "./styles/players.css";

function App() {
  return (
    <div className="app-container">
      {/* Glow decorativo */}
      <div className="glow top" />
      <div className="glow bottom" />

      <h1 className="app-title">Cubo de Rubik 3D Interactivo</h1>

      {/* Jugadores + tiempo arriba */}
      <div className="controls-wrapper">
        <PlayerPanel />
        <CubeTImer />
      </div>

      {/* Cubo debajo */}
      <div className="cube-wrapper">
        <RubikCube />
      </div>

      {/* Tabla de récords */}
      <Leaderboard />
    </div>
  );
}

export default App;
