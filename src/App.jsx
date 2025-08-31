import React, { useRef } from "react";
import RubikCube from "./components/RubikCube";
import CubeTImer from "./components/CubeTImer";
import ProgressIndicator from "./components/ProgressIndicator";
import "./App.css";

function App() {
  const cubeRef = useRef();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #29686bff 0%, #89abb3ff 100%)",
        padding: "4rem 2rem",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
      }}
    >
      {/* Glow decorativo al fondo */}
      <div
        style={{
          position: "absolute",
          top: "-20%",
          left: "-10%",
          width: "300px",
          height: "300px",
          background: "radial-gradient(circle, #3abbbb88, transparent 70%)",
          filter: "blur(80px)",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-20%",
          right: "-10%",
          width: "300px",
          height: "300px",
          background: "radial-gradient(circle, #4c6d8b88, transparent 70%)",
          filter: "blur(80px)",
          zIndex: 0,
        }}
      />

      <h1
        style={{
          color: "#00f0ff",
          fontSize: "3rem",
          textShadow: "0 0 8px rgba(0, 255, 255, 0.3)",
          marginBottom: "2rem",
          zIndex: 1,
        }}
      >
        Cubo de Rubik 3D Interactivo
      </h1>

      <div
        style={{
          background: "rgba(61, 112, 187, 0.25)",
          border: "1px solid rgba(255, 255, 255, 0.5)",
          boxShadow:
            "0 12px 30px rgba(26, 70, 70, 0.25), inset 0 0 8px rgba(255,255,255,0.3)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          borderRadius: "2rem",
          padding: "2.5rem",
          width: "100%",
          maxWidth: "960px",
          zIndex: 1,
          position: "relative",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          alignItems: "center",
        }}
      >
        <CubeTImer />
        <ProgressIndicator solved={true} />
        <RubikCube ref={cubeRef} />
      </div>
    </div>
  );
}

export default App;
