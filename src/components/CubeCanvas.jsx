// src/components/CubeCanvas.jsx
import React from "react";

const mobileStyle = {
  width: "100%",
  height: "min(72vw, 340px)",
  maxWidth: "420px",
  margin: "0 auto",
  borderRadius: "18px",
  boxShadow: "0 0 30px #0055ff",
  cursor: "grab",
  touchAction: "none",
};

const desktopStyle = {
  width: "600px",
  height: "600px",
  margin: "auto",
  borderRadius: "16px",
  boxShadow: "0 0 25px #0055ff",
  cursor: "grab",
};

/**
 * Contenedor donde se monta el canvas de Three.js gestionado por useRubikCube.
 */
export default function CubeCanvas({ mountRef, isMobile }) {
  return <div ref={mountRef} style={isMobile ? mobileStyle : desktopStyle} />;
}
