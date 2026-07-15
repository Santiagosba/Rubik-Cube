import { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls.js";

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
  // Rotación automática apagada por defecto: con orbit libre el cubo se
  // inspecciona mejor quieto (se puede reactivar con el botón).
  const animationActive = useRef(false);
  const cubelets = useRef([]);
  const rotating = useRef(false);

  const [isRotating, setIsRotating] = useState(false);
  const [lastMove, setLastMove] = useState(null);
  // Se inicializa de forma síncrona para renderizar el layout correcto desde
  // el primer render y evitar que el canvas nazca con tamaño de escritorio.
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth <= 768
  );

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

    // Cuerpo del cubelet: cristal transparente que refracta y refleja el
    // entorno (efecto vidrio/RTX).
    const baseMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x0a0a10,
      metalness: 0.1,
      roughness: 0.25,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      envMapIntensity: 0.6,
      side: THREE.DoubleSide,
    });

    const planeGeo = new THREE.PlaneGeometry(SIZE, SIZE);

    // Paleta viva y luminosa (azul y naranja más claros que los originales).
    const colors = {
      U: 0xffd500, // amarillo
      D: 0xffffff, // blanco
      F: 0xff1e1e, // rojo
      B: 0xff6a00, // naranja
      L: 0x2a6bff, // azul
      R: 0x00d13a, // verde
    };

    function createFace(color, pos, rot) {
      const separation = 0.051;
      const adjustedPos = pos.map((v) => v * (SIZE / 2 + separation));
      // Caras de cristal de color: transmiten la luz y, gracias a la
      // absorción (attenuation), conservan un color rico tipo gema. El
      // clearcoat y el envMap dan los reflejos "RTX".
      // Caras opacas, brillantes y de color intenso (glossy) para que
      // resalten sobre el fondo negro sin verse lavadas. El clearcoat y un
      // toque de reflejo del entorno dan el acabado tipo cristal pulido.
      const mat = new THREE.MeshPhysicalMaterial({
        color,
        metalness: 0,
        roughness: 0.18,
        emissive: new THREE.Color(color),
        emissiveIntensity: 0.12,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
        envMapIntensity: 0.35,
        side: THREE.DoubleSide,
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
    // Fondo negro para que las caras de color resalten al máximo.
    scene.background = new THREE.Color(0x000000);

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
    // Sin tone mapping para que los colores se vean vivos y saturados
    // (ACES lavaba/desaturaba las caras).
    renderer.toneMapping = THREE.NoToneMapping;
    currentMount.appendChild(renderer.domElement);

    // Entorno de reflexión (estudio) para que el cristal refleje la luz.
    // scene.environment se aplica automáticamente a los materiales físicos.
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envMap;

    // TrackballControls: rotación totalmente libre en cualquier dirección
    // (sin bloqueo en los polos, se puede voltear infinitamente en vertical),
    // con zoom por rueda y pellizco en móvil.
    camera.position.set(4.5, 4, 6);
    const controls = new TrackballControls(camera, renderer.domElement);
    controls.rotateSpeed = 3.5;
    controls.zoomSpeed = 1.2;
    controls.noPan = true;
    controls.staticMoving = false;
    controls.dynamicDampingFactor = 0.12;
    controls.minDistance = 3.5;
    controls.maxDistance = 16;
    controls.target.set(0, 0, 0);
    controls.handleResize();
    // Pausar la rotación automática mientras el usuario interactúa.
    controls.addEventListener("start", () => {
      isDragging.current = true;
    });
    controls.addEventListener("end", () => {
      isDragging.current = false;
    });
    controls.update();

    const cubeGroup = new THREE.Group();
    cubeGroupRef.current = cubeGroup;
    scene.add(cubeGroup);

    createCubelets();

    // Iluminación: varios puntos de luz para reflejos vivos en todas las caras
    const pointLight1 = new THREE.PointLight(0xffffff, 3, 100);
    pointLight1.position.set(10, 10, 10);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xffffff, 2.5, 100);
    pointLight2.position.set(-10, 10, -10);
    scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(0xffffff, 2, 100);
    pointLight3.position.set(0, -10, 10);
    scene.add(pointLight3);

    // Relleno inferior para que ninguna cara quede en sombra
    const pointLight4 = new THREE.PointLight(0xffffff, 1.5, 100);
    pointLight4.position.set(0, 8, -12);
    scene.add(pointLight4);

    // Luz ambiental generosa para visibilidad general
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    // Luz de hemisferio: cielo claro / suelo tenue, ilumina de forma uniforme
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x303040, 1.1);
    scene.add(hemiLight);

    // Luz direccional principal
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.6);
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

      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    function onResize() {
      const w = currentMount.clientWidth;
      const h = currentMount.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      // TrackballControls usa coordenadas de pantalla: hay que recalcularlas.
      controls.handleResize();
    }

    window.addEventListener("resize", onResize);

    // Mantener el renderer sincronizado con el tamaño real del contenedor,
    // incluido el cambio de layout escritorio <-> móvil.
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(currentMount);

    // Al hacer scroll, el cubo (sticky en móvil) cambia de posición en
    // pantalla; recalcular las coordenadas para que la rotación sea precisa.
    const onScroll = () => controls.handleResize();
    window.addEventListener("scroll", onScroll, { passive: true });

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
      window.removeEventListener("scroll", onScroll);
      resizeObserver.disconnect();

      controls.dispose();

      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement);
      }
      envMap.dispose();
      pmrem.dispose();
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
