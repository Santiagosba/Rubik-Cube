// src/components/CubeCanvas.jsx
import React from "react";

const mobileStyle = {
  width: "100%",
  height: "280px",
  maxWidth: "380px",
  margin: "0 auto",
  borderRadius: "15px",
  boxShadow: "0 0 30px #0055ff",
  cursor: "grab",
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
