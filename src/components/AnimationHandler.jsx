// src/components/AnimationHandler.jsx
import { useEffect } from "react";
import * as THREE from "three";

export default function AnimationHandler({ renderer, scene, camera, controls, cubeGroupRef, isRotating }) {
  useEffect(() => {
    let lastTime = performance.now();

    function animate() {
      requestAnimationFrame(animate);
      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      if (isRotating && cubeGroupRef.current) {
        const speed = Math.PI / 8;
        cubeGroupRef.current.rotation.x += speed * delta;
        cubeGroupRef.current.rotation.y += speed * delta;
      }

      controls?.update();
      renderer?.render(scene, camera);
    }

    animate();
  }, [renderer, scene, camera, controls, cubeGroupRef, isRotating]);

  return null;
}
