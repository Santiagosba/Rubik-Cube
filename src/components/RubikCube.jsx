import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";

export default function RubikCube() {
  const mountRef = useRef(null);
  const cubeGroupRef = useRef(null);
  const isDragging = useRef(false);
  const animationActive = useRef(true);
  const [isRotating, setIsRotating] = useState(true);
  const cubelets = useRef([]);
  const rotating = useRef(false);
  const [lastMove, setLastMove] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  const size = 1;
  const offset = 1.05;

  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const createCubelets = () => {
    cubelets.current = [];
    const cubeGeometry = new THREE.BoxGeometry(size, size, size);

    const baseMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0,
      roughness: 0,
      transmission: 0.9,
      thickness: 0.8,
      transparent: true,
      opacity: 0.9,
      clearcoat: 1,
      clearcoatRoughness: 0,
      reflectivity: 0.8,
      side: THREE.DoubleSide,
    });

    const planeGeo = new THREE.PlaneGeometry(size, size);

    const colors = {
      U: 0xffff00,
      D: 0xffffff,
      F: 0xff0000,
      B: 0xff8000,
      L: 0x0000ff,
      R: 0x00ff00,
    };

    function createFace(color, pos, rot) {
      const separation = 0.051;
      const adjustedPos = pos.map((v) => v * (size / 2 + separation));
      const mat = new THREE.MeshPhysicalMaterial({
        color,
        metalness: 0.5,
        roughness: 0.1,
        transmission: 0.5,
        thickness: 0.5,
        clearcoat: 1,
        clearcoatRoughness: 0,
        transparent: true,
        opacity: 0.95,
        side: THREE.DoubleSide,
        reflectivity: 0.8,
      });
      const mesh = new THREE.Mesh(planeGeo, mat);
      mesh.position.set(...adjustedPos);
      mesh.rotation.set(...rot);
      return mesh;
    }

    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          const cube = new THREE.Mesh(cubeGeometry, baseMaterial.clone());
          cube.position.set(x * offset, y * offset, z * offset);
          cube.userData = { x, y, z };

          if (x === 1)
            cube.add(createFace(colors.R, [1, 0, 0], [0, Math.PI / 2, 0]));
          if (x === -1)
            cube.add(createFace(colors.L, [-1, 0, 0], [0, -Math.PI / 2, 0]));
          if (y === 1)
            cube.add(createFace(colors.U, [0, 1, 0], [-Math.PI / 2, 0, 0]));
          if (y === -1)
            cube.add(createFace(colors.D, [0, -1, 0], [Math.PI / 2, 0, 0]));
          if (z === 1) cube.add(createFace(colors.F, [0, 0, 1], [0, 0, 0]));
          if (z === -1)
            cube.add(createFace(colors.B, [0, 0, -1], [0, Math.PI, 0]));

          cubeGroupRef.current.add(cube);
          cubelets.current.push(cube);
        }
      }
    }
  };

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);

    const camera = new THREE.PerspectiveCamera(
      75,
      currentMount.clientWidth / currentMount.clientHeight,
      0.1,
      1000
    );
    camera.position.set(3, 3, 5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    currentMount.appendChild(renderer.domElement);

    // Controles de cámara personalizados
    let isMouseDown = false;
    let mouseX = 0;
    let mouseY = 0;
    let cameraRotationX = 0.3;
    let cameraRotationY = 0.8;

    const updateCameraPosition = () => {
      const radius = 7;
      camera.position.x = radius * Math.cos(cameraRotationX) * Math.sin(cameraRotationY);
      camera.position.y = radius * Math.sin(cameraRotationX);
      camera.position.z = radius * Math.cos(cameraRotationX) * Math.cos(cameraRotationY);
      camera.lookAt(0, 0, 0);
    };

    const handleMouseDown = (event) => {
      isMouseDown = true;
      isDragging.current = true;
      mouseX = event.clientX || (event.touches && event.touches[0].clientX);
      mouseY = event.clientY || (event.touches && event.touches[0].clientY);
    };

    const handleMouseMove = (event) => {
      if (!isMouseDown) return;
      event.preventDefault();
      
      const clientX = event.clientX || (event.touches && event.touches[0].clientX);
      const clientY = event.clientY || (event.touches && event.touches[0].clientY);
      
      const deltaX = clientX - mouseX;
      const deltaY = clientY - mouseY;
      
      cameraRotationY += deltaX * 0.008;
      cameraRotationX += deltaY * 0.008;
      
      // Limitar rotación vertical
      cameraRotationX = Math.max(-Math.PI/2.5, Math.min(Math.PI/2.5, cameraRotationX));
      
      updateCameraPosition();
      
      mouseX = clientX;
      mouseY = clientY;
    };

    const handleMouseUp = () => {
      isMouseDown = false;
      isDragging.current = false;
    };

    const handleWheel = (event) => {
      event.preventDefault();
      const radius = camera.position.length();
      const newRadius = Math.max(3, Math.min(12, radius + event.deltaY * 0.01));
      camera.position.normalize().multiplyScalar(newRadius);
    };

    // Event listeners para mouse
    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('wheel', handleWheel, { passive: false });

    // Event listeners para touch
    renderer.domElement.addEventListener('touchstart', handleMouseDown, { passive: false });
    document.addEventListener('touchmove', handleMouseMove, { passive: false });
    document.addEventListener('touchend', handleMouseUp);

    // Inicializar posición de cámara
    updateCameraPosition();

    const cubeGroup = new THREE.Group();
    cubeGroupRef.current = cubeGroup;
    scene.add(cubeGroup);

    createCubelets();

    // Iluminación simple pero efectiva
    const pointLight1 = new THREE.PointLight(0xffffff, 2, 100);
    pointLight1.position.set(10, 10, 10);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xffffff, 1.5, 100);
    pointLight2.position.set(-10, 10, -10);
    scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(0xffffff, 1, 100);
    pointLight3.position.set(0, -10, 10);
    scene.add(pointLight3);

    // Luz ambiental para visibilidad
    const ambientLight = new THREE.AmbientLight(0x404040, 1.2);
    scene.add(ambientLight);

    // Luz direccional principal
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 5);
    scene.add(directionalLight);

    let lastTime = performance.now();

    function animate() {
      requestAnimationFrame(animate);
      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      if (animationActive.current && !isDragging.current) {
        const speed = Math.PI / 8;
        cubeGroup.rotation.x += speed * delta;
        cubeGroup.rotation.y += speed * delta;
      }

      renderer.render(scene, camera);
    }
    animate();

    function onResize() {
      camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    }

    window.addEventListener("resize", onResize);

    // Teclado para control de rotaciones
    function handleKeyDown(e) {
      if (rotating.current) return;

      const keyMap = {
        KeyQ: ["x", 1, 1], KeyA: ["x", 0, 1], KeyZ: ["x", -1, 1],
        KeyW: ["x", 1, -1], KeyS: ["x", 0, -1], KeyX: ["x", -1, -1],
        KeyE: ["y", 1, 1], KeyD: ["y", 0, 1], KeyC: ["y", -1, 1],
        KeyR: ["y", 1, -1], KeyF: ["y", 0, -1], KeyV: ["y", -1, -1],
        KeyT: ["z", 1, 1], KeyG: ["z", 0, 1], KeyB: ["z", -1, 1],
        KeyY: ["z", 1, -1], KeyH: ["z", 0, -1], KeyN: ["z", -1, -1],
      };

      const command = keyMap[e.code];
      if (command) {
        const [axis, index, dir] = command;
        rotateLayer(axis, index, dir);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", handleKeyDown);
      
      // Limpiar event listeners
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('wheel', handleWheel);
      renderer.domElement.removeEventListener('touchstart', handleMouseDown);
      document.removeEventListener('touchmove', handleMouseMove);
      document.removeEventListener('touchend', handleMouseUp);
      
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  const rotateLayer = (axis, index, direction) => {
    if (rotating.current || !cubeGroupRef.current) return;
    rotating.current = true;

    setLastMove(`${axis.toUpperCase()}${index} ${direction === 1 ? "↻" : "↺"}`);

    const layer = cubelets.current.filter(
      (c) => Math.round(c.userData[axis]) === index
    );

    const group = new THREE.Group();
    layer.forEach((cube) => {
      cubeGroupRef.current.remove(cube);
      group.add(cube);
    });

    cubeGroupRef.current.add(group);

    const rotAxis = new THREE.Vector3(
      axis === "x" ? 1 : 0,
      axis === "y" ? 1 : 0,
      axis === "z" ? 1 : 0
    );

    const angle = (Math.PI / 2) * direction;
    const duration = 300;
    const start = performance.now();

    function animateRotation(now) {
      const t = Math.min((now - start) / duration, 1);
      group.rotation[axis] = angle * t;
      if (t < 1) {
        requestAnimationFrame(animateRotation);
      } else {
        group.rotation[axis] = angle;
        group.updateMatrixWorld();

        layer.forEach((cube) => {
          cube.position.applyAxisAngle(rotAxis, angle);
          cube.position.set(
            Math.round(cube.position.x / offset) * offset,
            Math.round(cube.position.y / offset) * offset,
            Math.round(cube.position.z / offset) * offset
          );

          cube.rotateOnWorldAxis(rotAxis, angle);

          cube.userData = {
            x: Math.round(cube.position.x / offset),
            y: Math.round(cube.position.y / offset),
            z: Math.round(cube.position.z / offset),
          };

          cube.updateMatrixWorld(true);
          cubeGroupRef.current.add(cube);
        });

        cubeGroupRef.current.remove(group);
        rotating.current = false;
      }
    }

    requestAnimationFrame(animateRotation);
  };

  const shuffle = (moves = 20) => {
    if (rotating.current) return;
    const axes = ["x", "y", "z"];
    let i = 0;

    function doMove() {
      if (i >= moves) return;
      const axis = axes[Math.floor(Math.random() * 3)];
      const index = [-1, 0, 1][Math.floor(Math.random() * 3)];
      const direction = Math.random() < 0.5 ? 1 : -1;
      rotateLayer(axis, index, direction);
      i++;
      setTimeout(doMove, 400);
    }
    doMove();
  };

  const resetCube = () => {
    if (rotating.current || !cubeGroupRef.current) return;
    rotating.current = true;

    cubelets.current.forEach((cube) => {
      cubeGroupRef.current.remove(cube);
    });

    cubelets.current = [];
    createCubelets();

    rotating.current = false;
    setLastMove("Reseteado");
  };

  const toggleRotation = () => {
    animationActive.current = !animationActive.current;
    setIsRotating(animationActive.current);
  };

  const ControlButtons = () => (
    <div className={`controls-container ${isMobile ? 'mobile' : 'desktop'}`}>
      {/* Eje X */}
      <div className="axis-section">
        <h3>Eje X</h3>
        <div className="button-group">
          <button className="glass-button" onClick={() => rotateLayer("x", 1, 1)}>
            {isMobile ? "X+ ↻" : "Girar X+ ↻"}
          </button>
          <button className="glass-button" onClick={() => rotateLayer("x", 1, -1)}>
            {isMobile ? "X+ ↺" : "Girar X+ ↺"}
          </button>
          <button className="glass-button" onClick={() => rotateLayer("x", 0, 1)}>
            {isMobile ? "X0 ↻" : "Girar X0 ↻"}
          </button>
          <button className="glass-button" onClick={() => rotateLayer("x", 0, -1)}>
            {isMobile ? "X0 ↺" : "Girar X0 ↺"}
          </button>
          <button className="glass-button" onClick={() => rotateLayer("x", -1, 1)}>
            {isMobile ? "X- ↻" : "Girar X- ↻"}
          </button>
          <button className="glass-button" onClick={() => rotateLayer("x", -1, -1)}>
            {isMobile ? "X- ↺" : "Girar X- ↺"}
          </button>
        </div>
      </div>

      {/* Eje Y */}
      <div className="axis-section">
        <h3>Eje Y</h3>
        <div className="button-group">
          <button className="glass-button" onClick={() => rotateLayer("y", 1, 1)}>
            {isMobile ? "Y+ ↻" : "Girar Y+ ↻"}
          </button>
          <button className="glass-button" onClick={() => rotateLayer("y", 1, -1)}>
            {isMobile ? "Y+ ↺" : "Girar Y+ ↺"}
          </button>
          <button className="glass-button" onClick={() => rotateLayer("y", 0, 1)}>
            {isMobile ? "Y0 ↻" : "Girar Y0 ↻"}
          </button>
          <button className="glass-button" onClick={() => rotateLayer("y", 0, -1)}>
            {isMobile ? "Y0 ↺" : "Girar Y0 ↺"}
          </button>
          <button className="glass-button" onClick={() => rotateLayer("y", -1, 1)}>
            {isMobile ? "Y- ↻" : "Girar Y- ↻"}
          </button>
          <button className="glass-button" onClick={() => rotateLayer("y", -1, -1)}>
            {isMobile ? "Y- ↺" : "Girar Y- ↺"}
          </button>
        </div>
      </div>

      {/* Eje Z */}
      <div className="axis-section">
        <h3>Eje Z</h3>
        <div className="button-group">
          <button className="glass-button" onClick={() => rotateLayer("z", 1, 1)}>
            {isMobile ? "Z+ ↻" : "Girar Z+ ↻"}
          </button>
          <button className="glass-button" onClick={() => rotateLayer("z", 1, -1)}>
            {isMobile ? "Z+ ↺" : "Girar Z+ ↺"}
          </button>
          <button className="glass-button" onClick={() => rotateLayer("z", 0, 1)}>
            {isMobile ? "Z0 ↻" : "Girar Z0 ↻"}
          </button>
          <button className="glass-button" onClick={() => rotateLayer("z", 0, -1)}>
            {isMobile ? "Z0 ↺" : "Girar Z0 ↺"}
          </button>
          <button className="glass-button" onClick={() => rotateLayer("z", -1, 1)}>
            {isMobile ? "Z- ↻" : "Girar Z- ↻"}
          </button>
          <button className="glass-button" onClick={() => rotateLayer("z", -1, -1)}>
            {isMobile ? "Z- ↺" : "Girar Z- ↺"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="rubik-container">
      <style>{`
        .rubik-container {
          text-align: center;
          padding: 10px;
          min-height: 100vh;
          background: linear-gradient(135deg, 
            #0a0a1a 0%, 
            #1a1a2e 25%, 
            #16213e 50%, 
            #0f2027 75%, 
            #2c5364 100%);
          position: relative;
          overflow: hidden;
        }

        .rubik-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 80%, rgba(0, 255, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(0, 170, 255, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(0, 85, 255, 0.06) 0%, transparent 50%);
          pointer-events: none;
          z-index: 1;
        }

        .mobile-layout, .desktop-layout {
          position: relative;
          z-index: 2;
        }

        .mobile-layout {
          height: 100vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .mobile-cube-section {
          flex-shrink: 0;
          padding: 20px;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(25px);
          border-bottom: 2px solid rgba(0, 255, 255, 0.3);
          position: sticky;
          top: 0;
          z-index: 10;
          box-shadow: 
            0 8px 32px rgba(0, 85, 255, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            inset 0 -1px 0 rgba(0, 0, 0, 0.1);
          border-radius: 0 0 25px 25px;
        }

        .mobile-controls-section {
          flex: 1;
          overflow-y: auto;
          padding: 20px 10px;
          background: rgba(15, 15, 35, 0.8);
          backdrop-filter: blur(15px);
        }

        .desktop-layout {
          max-width: 1200px;
          margin: 0 auto;
          padding: 30px;
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(20px);
          border-radius: 30px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 
            0 20px 60px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .cube-section {
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
        }

        .mobile-main-buttons {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin: 20px 0 15px 0;
          flex-wrap: wrap;
        }

        .compact-button {
          padding: 12px 20px;
          border-radius: 30px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          font-weight: bold;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
          min-width: 90px;
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(20px);
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            inset 0 -1px 0 rgba(0, 0, 0, 0.1);
          position: relative;
          overflow: hidden;
        }

        .compact-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.6s;
        }

        .compact-button:hover::before {
          left: 100%;
        }

        .compact-button:active {
          transform: scale(0.95);
          box-shadow: 
            0 4px 16px rgba(0, 0, 0, 0.3),
            inset 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .mobile-status {
          text-align: center;
          margin-top: 15px;
        }

        .last-move-mobile {
          color: #00ffcc;
          font-weight: bold;
          font-size: 16px;
          font-family: 'Segoe UI', monospace;
          background: rgba(0, 255, 204, 0.08);
          backdrop-filter: blur(15px);
          padding: 10px 25px;
          border-radius: 25px;
          display: inline-block;
          border: 1px solid rgba(0, 255, 204, 0.2);
          box-shadow: 
            0 8px 32px rgba(0, 255, 204, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .main-buttons {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 20px;
          margin: 40px 0;
        }

        .main-button {
          padding: 18px 35px;
          border-radius: 25px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          font-weight: bold;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
          min-width: 160px;
          background: rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(25px);
          box-shadow: 
            0 12px 40px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            inset 0 -1px 0 rgba(0, 0, 0, 0.1);
          position: relative;
          overflow: hidden;
        }

        .main-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
          transition: left 0.6s;
        }

        .main-button:hover {
          transform: translateY(-4px);
          box-shadow: 
            0 20px 60px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }

        .main-button:hover::before {
          left: 100%;
        }

        .rotation-button {
          background: ${isRotating 
            ? 'linear-gradient(135deg, rgba(0, 255, 153, 0.2), rgba(0, 255, 153, 0.1))' 
            : 'linear-gradient(135deg, rgba(204, 0, 0, 0.2), rgba(204, 0, 0, 0.1))'};
          border-color: ${isRotating ? 'rgba(0, 255, 153, 0.3)' : 'rgba(204, 0, 0, 0.3)'};
          color: ${isRotating ? '#00ff99' : '#ff6666'};
          text-shadow: 0 0 10px currentColor;
        }

        .shuffle-button {
          background: linear-gradient(135deg, rgba(0, 85, 255, 0.2), rgba(0, 85, 255, 0.1));
          border-color: rgba(0, 85, 255, 0.3);
          color: #0055ff;
          text-shadow: 0 0 10px currentColor;
        }

        .reset-button {
          background: linear-gradient(135deg, rgba(255, 85, 0, 0.2), rgba(255, 85, 0, 0.1));
          border-color: rgba(255, 85, 0, 0.3);
          color: #ff5500;
          text-shadow: 0 0 10px currentColor;
        }

        .status-info {
          margin: 30px 0;
        }

        .last-move {
          color: #ccffff;
          font-weight: bold;
          font-size: 18px;
          height: auto;
          font-family: 'Segoe UI', monospace;
          margin-bottom: 20px;
          background: rgba(204, 255, 255, 0.05);
          backdrop-filter: blur(15px);
          padding: 12px 25px;
          border-radius: 20px;
          display: inline-block;
          border: 1px solid rgba(204, 255, 255, 0.15);
          box-shadow: 
            0 8px 32px rgba(204, 255, 255, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .keyboard-info {
          color: #66aaff;
          font-size: 14px;
          font-family: 'Segoe UI', monospace;
          margin-bottom: 25px;
          background: rgba(102, 170, 255, 0.06);
          backdrop-filter: blur(15px);
          padding: 15px 20px;
          border-radius: 15px;
          border: 1px solid rgba(102, 170, 255, 0.15);
          box-shadow: 
            0 8px 32px rgba(102, 170, 255, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .controls-container {
          display: flex;
          flex-direction: column;
          gap: 25px;
          margin-top: 40px;
        }

        .controls-container.desktop {
          flex-direction: row;
          justify-content: center;
          flex-wrap: wrap;
          gap: 30px;
        }

        .controls-container.mobile {
          max-width: 100%;
          gap: 20px;
        }

        .axis-section {
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(25px);
          border-radius: 25px;
          padding: 25px;
          margin: 15px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 
            0 20px 60px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            inset 0 -1px 0 rgba(0, 0, 0, 0.1);
          position: relative;
          overflow: hidden;
        }

        .axis-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, 
            rgba(255, 255, 255, 0.02) 0%, 
            transparent 50%, 
            rgba(0, 255, 255, 0.02) 100%);
          pointer-events: none;
        }

        .axis-section h3 {
          color: #ffffff;
          margin: 0 0 20px 0;
          font-size: 22px;
          font-weight: 600;
          text-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
          position: relative;
          z-index: 1;
        }

        .button-group {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          position: relative;
          z-index: 1;
        }

        .desktop .button-group {
          grid-template-columns: repeat(3, 1fr);
        }

        .glass-button {
          background: rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 20px;
          color: #ffffff;
          padding: 18px 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
          font-size: 13px;
          min-height: 55px;
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            inset 0 -1px 0 rgba(0, 0, 0, 0.1);
          position: relative;
          overflow: hidden;
          text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
        }

        .glass-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.6s;
        }

        .desktop .glass-button {
          font-size: 14px;
          padding: 20px 15px;
        }

        .glass-button:hover {
          background: rgba(255, 255, 255, 0.12);
          transform: translateY(-3px);
          box-shadow: 
            0 15px 50px rgba(0, 85, 255, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
          border-color: rgba(0, 255, 255, 0.4);
          color: #00ffff;
          text-shadow: 0 0 15px #00ffff;
        }

        .glass-button:hover::before {
          left: 100%;
        }

        .glass-button:active {
          transform: scale(0.95);
          background: rgba(0, 255, 255, 0.15);
          box-shadow: 
            0 8px 25px rgba(0, 255, 255, 0.3),
            inset 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        @media (max-width: 768px) {
          .rubik-container {
            padding: 0;
          }

          .axis-section {
            margin: 10px;
            padding: 20px;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(0, 255, 255, 0.2);
          }

          .axis-section h3 {
            font-size: 18px;
            margin-bottom: 15px;
            color: #00ffcc;
            text-shadow: 0 0 15px #00ffcc;
          }

          .glass-button {
            background: rgba(0, 255, 255, 0.08);
            border: 1px solid rgba(0, 255, 255, 0.25);
            backdrop-filter: blur(15px);
            font-size: 12px;
            padding: 15px 10px;
            min-height: 50px;
            color: #ccffff;
          }

          .glass-button:active {
            background: rgba(0, 255, 255, 0.2);
            transform: scale(0.95);
            box-shadow: 
              0 8px 25px rgba(0, 255, 255, 0.4),
              inset 0 2px 4px rgba(0, 0, 0, 0.2);
          }
        }

        @media (max-width: 480px) {
          .glass-button {
            font-size: 11px;
            padding: 12px 8px;
            min-height: 45px;
          }

          .compact-button {
            font-size: 12px;
            padding: 10px 15px;
            min-width: 75px;
          }
        }
      `}</style>

      {isMobile ? (
        <div className="mobile-layout">
          <div className="mobile-cube-section">
            <div
              ref={mountRef}
              style={{
                width: "100%",
                height: "280px",
                maxWidth: "380px",
                margin: "0 auto",
                borderRadius: "15px",
                boxShadow: "0 0 30px #0055ff",
                cursor: "grab",
              }}
            />
            
            <div className="mobile-main-buttons">
              <button className="compact-button rotation-button" onClick={toggleRotation}>
                {isRotating ? "⏸️ Parar" : "▶️ Rotar"}
              </button>
              <button className="compact-button shuffle-button" onClick={() => shuffle(20)}>
                🎲 Mezclar
              </button>
              <button className="compact-button reset-button" onClick={resetCube}>
                🔄 Reset
              </button>
            </div>

            <div className="mobile-status">
              <div className="last-move-mobile">
                {lastMove || "—"}
              </div>
            </div>
          </div>

          <div className="mobile-controls-section">
            <ControlButtons />
          </div>
        </div>
      ) : (
        <div className="desktop-layout">
          <div className="cube-section">
            <div
              ref={mountRef}
              style={{
                width: "600px",
                height: "600px",
                margin: "auto",
                borderRadius: "16px",
                boxShadow: "0 0 25px #0055ff",
                cursor: "grab",
              }}
            />
            
            <div className="main-buttons">
              <button className="main-button rotation-button" onClick={toggleRotation}>
                {isRotating ? "Detener rotación" : "Reanudar rotación"}
              </button>
              <button className="main-button shuffle-button" onClick={() => shuffle(20)}>
                Mezclar cubo
              </button>
              <button className="main-button reset-button" onClick={resetCube}>
                Resetear cubo
              </button>
            </div>

            <div className="status-info">
              <div className="last-move">
                Último movimiento: {lastMove || "—"}
              </div>
              <div className="keyboard-info">
                Teclas para rotar: Q/A/Z/W/S/X (X), E/D/C/R/F/V (Y), T/G/B/Y/H/N (Z)
              </div>
            </div>
          </div>

          <ControlButtons />
        </div>
      )}
    </div>
  );
}