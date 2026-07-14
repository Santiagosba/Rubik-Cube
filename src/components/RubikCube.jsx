import React from "react";
import useRubikCube from "../hooks/useRubikCube";
import CubeCanvas from "./CubeCanvas";
import CubeActionBar from "./CubeActionBar";
import CubeControls from "./CubeControls";
import "../styles/rubik.css";

/**
 * Orquesta la escena 3D (useRubikCube) y la interfaz del cubo, eligiendo el
 * layout móvil o de escritorio según el ancho de pantalla.
 */
export default function RubikCube() {
  const {
    mountRef,
    isRotating,
    lastMove,
    isMobile,
    rotateLayer,
    shuffle,
    resetCube,
    toggleRotation,
  } = useRubikCube();

  const actionBar = (
    <CubeActionBar
      isRotating={isRotating}
      lastMove={lastMove}
      isMobile={isMobile}
      onToggleRotation={toggleRotation}
      onShuffle={shuffle}
      onReset={resetCube}
    />
  );

  return (
    <div className="rubik-container">
      {isMobile ? (
        <div className="mobile-layout">
          <div className="mobile-cube-section">
            <CubeCanvas mountRef={mountRef} isMobile />
            {actionBar}
          </div>

          <div className="mobile-controls-section">
            <CubeControls onRotate={rotateLayer} isMobile />
          </div>
        </div>
      ) : (
        <div className="desktop-layout">
          <div className="cube-section">
            <CubeCanvas mountRef={mountRef} isMobile={false} />
            {actionBar}
          </div>

          <CubeControls onRotate={rotateLayer} isMobile={false} />
        </div>
      )}
    </div>
  );
}
