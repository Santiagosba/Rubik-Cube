import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls";

export default function RubikCube() {
  const mountRef = useRef(null);
  const cubeGroupRef = useRef(null);
  const isDragging = useRef(false);
  const animationActive = useRef(true);
  const [isRotating, setIsRotating] = useState(true);
  const cubelets = useRef([]);
  const rotating = useRef(false);
  const [lastMove, setLastMove] = useState(null);

  const size = 1;
  const offset = 1.05;

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

    const controls = new TrackballControls(camera, renderer.domElement);
    controls.dynamicDampingFactor = 0.1;
    controls.rotateSpeed = 8;
    controls.zoomSpeed = 2;
    controls.panSpeed = 1;

    controls.addEventListener("start", () => (isDragging.current = true));
    controls.addEventListener("end", () => (isDragging.current = false));

    const cubeGroup = new THREE.Group();
    cubeGroupRef.current = cubeGroup;
    scene.add(cubeGroup);

    createCubelets();

    const pointLight = new THREE.PointLight(0xffffff, 3, 100);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    const ambientLight = new THREE.AmbientLight(0x909090, 2.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(-10, 10, 5);
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

      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    function onResize() {
      camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
      controls.handleResize();
    }

    window.addEventListener("resize", onResize);

    // Teclado para control de rotaciones
    function handleKeyDown(e) {
      if (rotating.current) return;

      const keyMap = {
        // eje, índice, dirección
        // X axis
        KeyQ: ["x", 1, 1],
        KeyA: ["x", 0, 1],
        KeyZ: ["x", -1, 1],
        KeyW: ["x", 1, -1],
        KeyS: ["x", 0, -1],
        KeyX: ["x", -1, -1],

        // Y axis
        KeyE: ["y", 1, 1],
        KeyD: ["y", 0, 1],
        KeyC: ["y", -1, 1],
        KeyR: ["y", 1, -1],
        KeyF: ["y", 0, -1],
        KeyV: ["y", -1, -1],

        // Z axis
        KeyT: ["z", 1, 1],
        KeyG: ["z", 0, 1],
        KeyB: ["z", -1, 1],
        KeyY: ["z", 1, -1],
        KeyH: ["z", 0, -1],
        KeyN: ["z", -1, -1],
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
      currentMount.removeChild(renderer.domElement);
      renderer.dispose();
      controls.dispose();
    };
  }, []);

  const rotateLayer = (axis, index, direction) => {
    if (rotating.current) return;
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

  // Mezclar cubo con movimientos aleatorios
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

  // Reset cubo: elimina cubo actual y vuelve a crear desde el estado inicial
  const resetCube = () => {
    if (rotating.current) return;
    rotating.current = true;

    // Quitar cubos actuales
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

  return (
    <div style={{ textAlign: "center" }}>
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
      <button
        onClick={toggleRotation}
        style={{
          margin: "20px",
          padding: "10px 30px",
          borderRadius: "12px",
          background: isRotating ? "#00ff99" : "#cc0000",
          color: "black",
          fontWeight: "bold",
          fontSize: "16px",
          cursor: "pointer",
        }}
      >
        {isRotating ? "Detener rotación" : "Reanudar rotación"}
      </button>
      <button
        onClick={() => shuffle(20)}
        style={{
          margin: "20px",
          padding: "10px 30px",
          borderRadius: "12px",
          background: "#0055ff",
          color: "white",
          fontWeight: "bold",
          fontSize: "16px",
          cursor: "pointer",
        }}
      >
        Mezclar cubo
      </button>
      <button
        onClick={resetCube}
        style={{
          margin: "20px",
          padding: "10px 30px",
          borderRadius: "12px",
          background: "#ff5500",
          color: "white",
          fontWeight: "bold",
          fontSize: "16px",
          cursor: "pointer",
        }}
      >
        Resetear cubo
      </button>
      <div
        style={{
          marginTop: "20px",
          color: "#ccc",
          fontWeight: "bold",
          fontSize: "18px",
          height: "24px",
          fontFamily: "monospace",
        }}
      >
        Último movimiento: {lastMove || "—"}
      </div>
      <div
        style={{
          marginTop: "10px",
          color: "#777",
          fontSize: "14px",
          fontFamily: "monospace",
        }}
      >
        Teclas para rotar: Q/A/Z/W/S/X (X), E/D/C/R/F/V (Y), T/G/B/Y/H/N (Z)
      </div>

      <div className="controls-container">
        {/* Eje X */}
        <div className="axis-section">
          <h3>Eje X</h3>
          <div className="button-group">
            <button
              className="glass-button"
              onClick={() => rotateLayer("x", 1, 1)}
            >
              Girar X+ ↻
            </button>
            <button
              className="glass-button"
              onClick={() => rotateLayer("x", 1, -1)}
            >
              Girar X+ ↺
            </button>
            <button
              className="glass-button"
              onClick={() => rotateLayer("x", 0, 1)}
            >
              Girar X0 ↻
            </button>
            <button
              className="glass-button"
              onClick={() => rotateLayer("x", 0, -1)}
            >
              Girar X0 ↺
            </button>
            <button
              className="glass-button"
              onClick={() => rotateLayer("x", -1, 1)}
            >
              Girar X- ↻
            </button>
            <button
              className="glass-button"
              onClick={() => rotateLayer("x", -1, -1)}
            >
              Girar X- ↺
            </button>
          </div>
        </div>

        {/* Eje Y */}
        <div className="axis-section">
          <h3>Eje Y</h3>
          <div className="button-group">
            <button
              className="glass-button"
              onClick={() => rotateLayer("y", 1, 1)}
            >
              Girar Y+ ↻
            </button>
            <button
              className="glass-button"
              onClick={() => rotateLayer("y", 1, -1)}
            >
              Girar Y+ ↺
            </button>
            <button
              className="glass-button"
              onClick={() => rotateLayer("y", 0, 1)}
            >
              Girar Y0 ↻
            </button>
            <button
              className="glass-button"
              onClick={() => rotateLayer("y", 0, -1)}
            >
              Girar Y0 ↺
            </button>
            <button
              className="glass-button"
              onClick={() => rotateLayer("y", -1, 1)}
            >
              Girar Y- ↻
            </button>
            <button
              className="glass-button"
              onClick={() => rotateLayer("y", -1, -1)}
            >
              Girar Y- ↺
            </button>
          </div>
        </div>

        {/* Eje Z */}
        <div className="axis-section">
          <h3>Eje Z</h3>
          <div className="button-group">
            <button
              className="glass-button"
              onClick={() => rotateLayer("z", 1, 1)}
            >
              Girar Z+ ↻
            </button>
            <button
              className="glass-button"
              onClick={() => rotateLayer("z", 1, -1)}
            >
              Girar Z+ ↺
            </button>
            <button
              className="glass-button"
              onClick={() => rotateLayer("z", 0, 1)}
            >
              Girar Z0 ↻
            </button>
            <button
              className="glass-button"
              onClick={() => rotateLayer("z", 0, -1)}
            >
              Girar Z0 ↺
            </button>
            <button
              className="glass-button"
              onClick={() => rotateLayer("z", -1, 1)}
            >
              Girar Z- ↻
            </button>
            <button
              className="glass-button"
              onClick={() => rotateLayer("z", -1, -1)}
            >
              Girar Z- ↺
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
