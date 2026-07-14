import React from "react";
import RubikCube from "./components/RubikCube";
import CubeTImer from "./components/CubeTImer";
import ProgressIndicator from "./components/ProgressIndicator";
import "./App.css";

function App() {
  return (
    <div className="app-container">
      {/* Glow decorativo */}
      <div className="glow top" />
      <div className="glow bottom" />

      <h1 className="app-title">Cubo de Rubik 3D Interactivo</h1>

      {/* Controles arriba */}
      <div className="controls-wrapper">
        <CubeTImer />
        <ProgressIndicator solved={true} />
      </div>

      {/* Cubo debajo */}
      <div className="cube-wrapper">
        <RubikCube />
      </div>
    </div>
  );
}

export default App;
