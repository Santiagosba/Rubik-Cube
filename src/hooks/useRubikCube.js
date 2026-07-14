import { useRef, useEffect, useState } from "react";
import * as THREE from "three";

// Tamaño de cada cubelet y separación entre ellos.
const SIZE = 1;
const OFFSET = 1.05;

/**
 * Encapsula toda la lógica de Three.js y la manipulación del cubo de Rubik:
 * creación de la escena, controles de cámara, giros de capas, mezcla y reset.
 *
 * Devuelve la referencia donde montar el canvas junto con el estado y las
 * acciones que la interfaz necesita para controlar el cubo.
 */
export default function useRubikCube() {
  const mountRef = useRef(null);
  const cubeGroupRef = useRef(null);
  const isDragging = useRef(false);
  const animationActive = useRef(true);
  const cubelets = useRef([]);
  const rotating = useRef(false);

  const [isRotating, setIsRotating] = useState(true);
  const [lastMove, setLastMove] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const createCubelets = () => {
    cubelets.current = [];
    const cubeGeometry = new THREE.BoxGeometry(SIZE, SIZE, SIZE);

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

    const planeGeo = new THREE.PlaneGeometry(SIZE, SIZE);

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
      const adjustedPos = pos.map((v) => v * (SIZE / 2 + separation));
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
          cube.position.set(x * OFFSET, y * OFFSET, z * OFFSET);
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
      camera.position.x =
        radius * Math.cos(cameraRotationX) * Math.sin(cameraRotationY);
      camera.position.y = radius * Math.sin(cameraRotationX);
      camera.position.z =
        radius * Math.cos(cameraRotationX) * Math.cos(cameraRotationY);
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

      const clientX =
        event.clientX || (event.touches && event.touches[0].clientX);
      const clientY =
        event.clientY || (event.touches && event.touches[0].clientY);

      const deltaX = clientX - mouseX;
      const deltaY = clientY - mouseY;

      cameraRotationY += deltaX * 0.008;
      cameraRotationX += deltaY * 0.008;

      // Limitar rotación vertical
      cameraRotationX = Math.max(
        -Math.PI / 2.5,
        Math.min(Math.PI / 2.5, cameraRotationX)
      );

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
    renderer.domElement.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    renderer.domElement.addEventListener("wheel", handleWheel, {
      passive: false,
    });

    // Event listeners para touch
    renderer.domElement.addEventListener("touchstart", handleMouseDown, {
      passive: false,
    });
    document.addEventListener("touchmove", handleMouseMove, { passive: false });
    document.addEventListener("touchend", handleMouseUp);

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
      renderer.domElement.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      renderer.domElement.removeEventListener("wheel", handleWheel);
      renderer.domElement.removeEventListener("touchstart", handleMouseDown);
      document.removeEventListener("touchmove", handleMouseMove);
      document.removeEventListener("touchend", handleMouseUp);

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
            Math.round(cube.position.x / OFFSET) * OFFSET,
            Math.round(cube.position.y / OFFSET) * OFFSET,
            Math.round(cube.position.z / OFFSET) * OFFSET
          );

          cube.rotateOnWorldAxis(rotAxis, angle);

          cube.userData = {
            x: Math.round(cube.position.x / OFFSET),
            y: Math.round(cube.position.y / OFFSET),
            z: Math.round(cube.position.z / OFFSET),
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

  return {
    mountRef,
    isRotating,
    lastMove,
    isMobile,
    rotateLayer,
    shuffle,
    resetCube,
    toggleRotation,
  };
}
