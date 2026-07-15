import React, { useState } from "react";
import useRubikCube from "../hooks/useRubikCube";
import CubeCanvas from "./CubeCanvas";
import CubeActionBar from "./CubeActionBar";
import CubeControls from "./CubeControls";
import CubeProgress from "./CubeProgress";
import HintBar from "./HintBar";
import DifficultySelector from "./DifficultySelector";
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
    progress,
    nextHint,
    solved,
    everScrambled,
    rotateLayer,
    shuffle,
    resetCube,
    toggleRotation,
  } = useRubikCube();

  const [difficulty, setDifficulty] = useState("easy");

  // Solo el modo fácil resalta el botón/pestaña de la pista.
  const hintMove = difficulty === "easy" ? nextHint : null;

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

  const progressBar = (
    <CubeProgress
      progress={progress}
      solved={solved}
      everScrambled={everScrambled}
    />
  );

  const hintBar = (
    <HintBar
      difficulty={difficulty}
      nextHint={nextHint}
      solved={solved}
      everScrambled={everScrambled}
    />
  );

  const difficultySelector = (
    <DifficultySelector value={difficulty} onChange={setDifficulty} />
  );

  return (
    <div className="rubik-container">
      {isMobile ? (
        <div className="mobile-layout">
          {/* Fijo arriba: cubo + progreso + pista (siempre visibles al jugar) */}
          <div className="mobile-cube-section">
            <CubeCanvas mountRef={mountRef} isMobile />
            {progressBar}
            {hintBar}
          </div>

          <div className="mobile-controls-section">
            {actionBar}
            {difficultySelector}
            <CubeControls
              onRotate={rotateLayer}
              isMobile
              hintMove={hintMove}
            />
          </div>
        </div>
      ) : (
        <div className="desktop-layout">
          <div className="cube-section">
            <CubeCanvas mountRef={mountRef} isMobile={false} />
            {progressBar}
            {actionBar}
            {hintBar}
            {difficultySelector}
          </div>

          <CubeControls
            onRotate={rotateLayer}
            isMobile={false}
            hintMove={hintMove}
          />
        </div>
      )}
    </div>
  );
}
