import { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { buildPyraminx, PYRA_FACES } from "../logic/pyraminx.js";

// Tamaño de cada cubelet y separación entre ellos.
const SIZE = 1;
const OFFSET = 1.05;

// Paleta de las caras (viva y luminosa).
const FACE_COLORS = {
  U: 0xffd500, // amarillo (arriba,  +y)
  D: 0xffffff, // blanco   (abajo,   -y)
  F: 0xff1e1e, // rojo     (frente,  +z)
  B: 0xff6a00, // naranja  (detrás,  -z)
  L: 0x2a6bff, // azul     (izq,     -x)
  R: 0x00d13a, // verde    (der,     +x)
};

// Color que debería mostrar cada dirección del cubo resuelto.
const SOLVED_COLOR_BY_DIR = {
  "1,0,0": FACE_COLORS.R,
  "-1,0,0": FACE_COLORS.L,
  "0,1,0": FACE_COLORS.U,
  "0,-1,0": FACE_COLORS.D,
  "0,0,1": FACE_COLORS.F,
  "0,0,-1": FACE_COLORS.B,
};

// Etiqueta de la capa según su índice (0..N-1). En cubos pequeños (N<=3)
// usa +/0/- (arriba/medio/abajo); en cubos grandes usa el número de capa
// para que cada una sea inequívoca.
export function layerLabel(index, N) {
  if (N <= 3) {
    if (index === N - 1) return "+";
    if (index === 0) return "-";
    return "0";
  }
  return String(index + 1);
}

// Etiqueta legible de un movimiento, p.ej. "X+ ↻" o "X2 ↻".
export function moveLabel(move, N = 3) {
  if (!move) return "";
  const arrow = move.direction === 1 ? "↻" : "↺";
  return `${move.axis.toUpperCase()}${layerLabel(move.index, N)} ${arrow}`;
}

// ===== Skins (materiales del cubo) =====
// Cada skin devuelve el material del cuerpo y una fábrica de material de cara.
export const SKINS = [
  { id: "glass", label: "Cristal", emoji: "💎" },
  { id: "classic", label: "Clásico", emoji: "🧱" },
  { id: "neon", label: "Neón", emoji: "🌈" },
  { id: "metal", label: "Metal", emoji: "⚙️" },
];

function makeSkinMaterials(skin) {
  if (skin === "classic") {
    // Plástico mate: muy rugoso, sin reflejos ni brillo, colores algo
    // apagados como un cubo real.
    return {
      body: new THREE.MeshStandardMaterial({
        color: 0x121216,
        roughness: 1,
        metalness: 0,
        envMapIntensity: 0.1,
      }),
      face: (c) => {
        const col = new THREE.Color(c).lerp(new THREE.Color(0x2a2a2a), 0.18);
        return new THREE.MeshStandardMaterial({
          color: col,
          roughness: 0.95,
          metalness: 0,
          envMapIntensity: 0.1,
          side: THREE.DoubleSide,
        });
      },
    };
  }
  if (skin === "neon") {
    // Neón: cuerpo negro y caras que emiten luz con fuerza (el bloom añade
    // el halo de brillo).
    return {
      body: new THREE.MeshStandardMaterial({
        color: 0x000000,
        roughness: 0.55,
        metalness: 0.1,
      }),
      face: (c) =>
        new THREE.MeshStandardMaterial({
          color: 0x000000,
          emissive: new THREE.Color(c),
          emissiveIntensity: 1.1,
          roughness: 0.5,
          metalness: 0,
          side: THREE.DoubleSide,
        }),
    };
  }
  if (skin === "metal") {
    return {
      body: new THREE.MeshStandardMaterial({
        color: 0x15151b,
        roughness: 0.3,
        metalness: 1,
        envMapIntensity: 1.2,
      }),
      face: (c) =>
        new THREE.MeshStandardMaterial({
          color: c,
          roughness: 0.18,
          metalness: 1,
          envMapIntensity: 1.5,
          side: THREE.DoubleSide,
        }),
    };
  }
  // glass (por defecto): cristal de alta calidad con dispersión (RTX).
  return {
    body: new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0,
      roughness: 0,
      transmission: 1,
      ior: 1.5,
      thickness: 0.7,
      transparent: true,
      clearcoat: 1,
      clearcoatRoughness: 0,
      specularIntensity: 1,
      envMapIntensity: 1.6,
      dispersion: 2,
      side: THREE.DoubleSide,
    }),
    face: (c) =>
      new THREE.MeshPhysicalMaterial({
        color: c,
        metalness: 0,
        roughness: 0.03,
        transmission: 1,
        ior: 1.5,
        thickness: 1.4,
        attenuationColor: new THREE.Color(c),
        attenuationDistance: 0.35,
        emissive: new THREE.Color(c),
        emissiveIntensity: 0.22,
        clearcoat: 1,
        clearcoatRoughness: 0.03,
        specularIntensity: 1,
        envMapIntensity: 1.6,
        dispersion: 3.5,
        transparent: true,
        side: THREE.DoubleSide,
      }),
  };
}

// ¿Son a y b movimientos inversos (misma capa, sentido opuesto)?
function isInverse(a, b) {
  return a.axis === b.axis && a.index === b.index && a.direction === -b.direction;
}

// Fondo con degradado oscuro (casi negro): el cristal necesita algo que
// refractar/reflejar, pero mantiene la escena oscura para que resalten los
// colores.
function makeDarkBackground() {
  const canvas = document.createElement("canvas");
  canvas.width = 16;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, "#20242f"); // arriba: gris azulado muy oscuro
  grad.addColorStop(0.6, "#111318");
  grad.addColorStop(1, "#050507"); // abajo: casi negro
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 16, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

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
  // Pila de solución (movimientos que resuelven el cubo) para las pistas.
  const solutionRef = useRef([]);
  // ¿Se ha mezclado el cubo? (para mostrar la victoria solo tras jugar).
  const everScrambledRef = useRef(false);
  // Tamaño del cubo (N) y skin actuales (en refs para usarlos al crear).
  const sizeRef = useRef(3);
  const skinRef = useRef("glass");
  // Tipo de puzzle: "cube" (N×N×N) o "pyra" (Pyraminx).
  const puzzleRef = useRef("cube");
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const composerRef = useRef(null); // post-proceso (bloom) para el skin neón
  const matsRef = useRef(null); // materiales compartidos del skin actual

  const [isRotating, setIsRotating] = useState(false);
  const [lastMove, setLastMove] = useState(null);
  const [progress, setProgress] = useState(100);
  const [nextHint, setNextHint] = useState(null);
  const [solved, setSolved] = useState(true);
  const [everScrambled, setEverScrambled] = useState(false);
  const [cubeSize, setCubeSizeState] = useState(3);
  const [skin, setSkinState] = useState("glass");
  const [puzzle, setPuzzleState] = useState("cube");
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

  // Construye (y cachea) los materiales compartidos del skin actual,
  // liberando los anteriores.
  const buildMaterials = () => {
    if (matsRef.current) matsRef.current.dispose();
    const { body, face } = makeSkinMaterials(skinRef.current);
    const faceCache = {};
    const getFace = (c) => (faceCache[c] ||= face(c));
    matsRef.current = {
      body,
      getFace,
      dispose() {
        body.dispose();
        Object.values(faceCache).forEach((m) => m.dispose());
      },
    };
    return matsRef.current;
  };

  // Encuadra la cámara según el tamaño del cubo (los 2×2 son más pequeños).
  const frameCamera = () => {
    const cam = cameraRef.current;
    const ctr = controlsRef.current;
    if (!cam) return;
    const dist =
      puzzleRef.current === "pyra" ? 6 : 4.2 + sizeRef.current * 1.4;
    cam.position.setLength(dist);
    if (ctr) {
      ctr.target.set(0, 0, 0);
      ctr.update();
    }
  };

  // Crea la geometría del puzzle actual (cubo o Pyraminx).
  const createCubelets = () => {
    cubelets.current = [];

    // Pyraminx (Fase 1: geometría, sin giros todavía).
    if (puzzleRef.current === "pyra") {
      const { stickers } = buildPyraminx(cubeGroupRef.current, { scale: 1.75 });
      // Guardamos los stickers en cubelets.current para el cálculo de
      // progreso (cada sticker apunta a su cara).
      cubelets.current = stickers;
      return;
    }

    const N = sizeRef.current;
    const half = (N - 1) / 2;
    const cubeGeometry = new THREE.BoxGeometry(SIZE, SIZE, SIZE);
    const planeGeo = new THREE.PlaneGeometry(SIZE, SIZE);
    const { body: bodyMat, getFace } = buildMaterials();
    const colors = FACE_COLORS;

    function createFace(color, pos, rot) {
      const separation = 0.051;
      const adjustedPos = pos.map((v) => v * (SIZE / 2 + separation));
      const mesh = new THREE.Mesh(planeGeo, getFace(color));
      mesh.position.set(...adjustedPos);
      mesh.rotation.set(...rot);
      // Guardamos la dirección exterior y el color del sticker para calcular
      // el progreso (qué fracción de stickers apunta a su cara correcta).
      mesh.userData = { isSticker: true, dir: pos, color };
      return mesh;
    }

    // Recorremos la rejilla 0..N-1; la posición se centra restando half.
    for (let gx = 0; gx < N; gx++) {
      for (let gy = 0; gy < N; gy++) {
        for (let gz = 0; gz < N; gz++) {
          const cube = new THREE.Mesh(cubeGeometry, bodyMat);
          cube.position.set(
            (gx - half) * OFFSET,
            (gy - half) * OFFSET,
            (gz - half) * OFFSET
          );
          cube.userData = { x: gx, y: gy, z: gz };

          if (gx === N - 1)
            cube.add(createFace(colors.R, [1, 0, 0], [0, Math.PI / 2, 0]));
          if (gx === 0)
            cube.add(createFace(colors.L, [-1, 0, 0], [0, -Math.PI / 2, 0]));
          if (gy === N - 1)
            cube.add(createFace(colors.U, [0, 1, 0], [-Math.PI / 2, 0, 0]));
          if (gy === 0)
            cube.add(createFace(colors.D, [0, -1, 0], [Math.PI / 2, 0, 0]));
          if (gz === N - 1) cube.add(createFace(colors.F, [0, 0, 1], [0, 0, 0]));
          if (gz === 0)
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
    // Fondo oscuro con degradado para que el cristal tenga contexto que
    // refractar/reflejar sin perder el aspecto oscuro.
    scene.background = makeDarkBackground();

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
    // Neutral tone mapping (pensado para visualización de producto): da un
    // resultado realista sin lavar/desaturar los colores del cristal.
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1.15;
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
    cameraRef.current = camera;
    controlsRef.current = controls;

    // Post-proceso con bloom (solo se usa al render para el skin neón).
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(
      new UnrealBloomPass(
        new THREE.Vector2(
          currentMount.clientWidth,
          currentMount.clientHeight
        ),
        0.55, // fuerza
        0.4, // radio
        0.22 // umbral
      )
    );
    composer.addPass(new OutputPass());
    composerRef.current = composer;

    const cubeGroup = new THREE.Group();
    cubeGroupRef.current = cubeGroup;
    scene.add(cubeGroup);

    createCubelets();
    frameCamera();

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
      if (skinRef.current === "neon" && composerRef.current) {
        composerRef.current.render();
      } else {
        renderer.render(scene, camera);
      }
    }
    animate();

    function onResize() {
      const w = currentMount.clientWidth;
      const h = currentMount.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composerRef.current?.setSize(w, h);
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

    // Teclado para control de rotaciones. Las teclas usan la capa lógica
    // (1=superior, 0=media, -1=inferior) y se traduce al índice de rejilla
    // del tamaño actual.
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
      if (!command) return;
      const [axis, layerPos, dir] = command;
      const N = sizeRef.current;
      // layerPos: 1 -> capa superior (N-1), -1 -> inferior (0), 0 -> media.
      let gi = null;
      if (layerPos === 1) gi = N - 1;
      else if (layerPos === -1) gi = 0;
      else if (N === 3) gi = 1;
      if (gi !== null) rotateLayer(axis, gi, dir);
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
      matsRef.current?.dispose();
      composerRef.current?.dispose();
      envMap.dispose();
      pmrem.dispose();
      renderer.dispose();
    };
  }, []);

  // Progreso real: fracción de stickers que apuntan a su cara correcta.
  const computeProgress = () => {
    const v = new THREE.Vector3();
    let total = 0;
    let correct = 0;

    if (puzzleRef.current === "pyra") {
      // Pyraminx: cada sticker se compara con la normal de cara más cercana.
      cubelets.current.forEach((st) => {
        const d = st.userData;
        if (!d || !d.isSticker) return;
        total++;
        v.set(d.normal[0], d.normal[1], d.normal[2]).applyQuaternion(
          st.quaternion
        );
        let best = -2;
        let bestColor = null;
        PYRA_FACES.forEach((f) => {
          const dot =
            v.x * f.normal[0] + v.y * f.normal[1] + v.z * f.normal[2];
          if (dot > best) {
            best = dot;
            bestColor = f.color;
          }
        });
        if (bestColor === d.color) correct++;
      });
      return total ? (correct / total) * 100 : 100;
    }

    cubelets.current.forEach((cube) => {
      cube.children.forEach((child) => {
        const d = child.userData;
        if (!d || !d.isSticker) return;
        total++;
        v.set(d.dir[0], d.dir[1], d.dir[2]).applyQuaternion(cube.quaternion);
        const key = `${Math.round(v.x)},${Math.round(v.y)},${Math.round(v.z)}`;
        if (SOLVED_COLOR_BY_DIR[key] === d.color) correct++;
      });
    });
    return total ? (correct / total) * 100 : 100;
  };

  // Actualiza la pila de solución al aplicar un movimiento (la solución es el
  // inverso del historial) y refresca la siguiente pista.
  const pushMove = (axis, index, direction) => {
    const inv = { axis, index, direction: -direction };
    const S = solutionRef.current;
    solutionRef.current =
      S.length && isInverse(inv, S[0]) ? S.slice(1) : [inv, ...S];
    setNextHint(solutionRef.current[0] || null);
  };

  // Recalcula progreso y estado "resuelto" a partir del cubo 3D real.
  const refreshProgress = () => {
    const p = computeProgress();
    setProgress(Math.round(p));
    const isSolved = p >= 99.999;
    setSolved(isSolved);
    if (isSolved) {
      setNextHint(null);
    } else if (!everScrambledRef.current) {
      // Cualquier movimiento que desordene el cubo cuenta como "jugado",
      // para poder mostrar la victoria al volver a resolverlo.
      everScrambledRef.current = true;
      setEverScrambled(true);
    }
  };

  const rotateLayer = (axis, index, direction) => {
    // El Pyraminx (Fase 1) aún no tiene giros implementados.
    if (puzzleRef.current === "pyra") return;
    if (rotating.current || !cubeGroupRef.current) return;
    rotating.current = true;

    const N = sizeRef.current;
    const half = (N - 1) / 2;

    setLastMove(moveLabel({ axis, index, direction }, N));
    pushMove(axis, index, direction);

    const layer = cubelets.current.filter((c) => c.userData[axis] === index);

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
          // Encaje a la rejilla N: grid = round(pos/OFFSET + half) en 0..N-1.
          const gx = Math.round(cube.position.x / OFFSET + half);
          const gy = Math.round(cube.position.y / OFFSET + half);
          const gz = Math.round(cube.position.z / OFFSET + half);
          cube.position.set(
            (gx - half) * OFFSET,
            (gy - half) * OFFSET,
            (gz - half) * OFFSET
          );

          cube.rotateOnWorldAxis(rotAxis, angle);

          cube.userData = { x: gx, y: gy, z: gz };

          cube.updateMatrixWorld(true);
          cubeGroupRef.current.add(cube);
        });

        cubeGroupRef.current.remove(group);
        rotating.current = false;
        refreshProgress();
      }
    }

    requestAnimationFrame(animateRotation);
  };

  const shuffle = (moves = 20) => {
    // El Pyraminx (Fase 1) todavía no se puede mezclar.
    if (puzzleRef.current === "pyra") return;
    if (rotating.current) return;
    everScrambledRef.current = true;
    setEverScrambled(true);
    const axes = ["x", "y", "z"];
    let i = 0;

    const N = sizeRef.current;
    function doMove() {
      if (i >= moves) return;
      const axis = axes[Math.floor(Math.random() * 3)];
      // En 2×2/3×3 solo giros de cara; en cubos grandes, cualquier capa.
      const index =
        N <= 3
          ? Math.random() < 0.5
            ? 0
            : N - 1
          : Math.floor(Math.random() * N);
      const direction = Math.random() < 0.5 ? 1 : -1;
      rotateLayer(axis, index, direction);
      i++;
      setTimeout(doMove, 400);
    }
    doMove();
  };

  // Reconstruye el puzzle desde cero y reinicia todo el estado.
  const rebuild = () => {
    cubeGroupRef.current.clear();
    cubelets.current = [];
    createCubelets();
    frameCamera();
    solutionRef.current = [];
    everScrambledRef.current = false;
    setEverScrambled(false);
    setNextHint(null);
    refreshProgress();
  };

  const resetCube = () => {
    if (rotating.current || !cubeGroupRef.current) return;
    rotating.current = true;
    rebuild();
    rotating.current = false;
    setLastMove("Reseteado");
  };

  const toggleRotation = () => {
    animationActive.current = !animationActive.current;
    setIsRotating(animationActive.current);
  };

  // Cambia el tamaño del cubo (2×2..5×5): reconstruye y reinicia el estado.
  const setCubeSize = (n) => {
    if (rotating.current || !cubeGroupRef.current) return;
    if (n === sizeRef.current && puzzleRef.current === "cube") return;
    puzzleRef.current = "cube";
    setPuzzleState("cube");
    sizeRef.current = n;
    setCubeSizeState(n);
    rebuild();
    setLastMove(null);
  };

  // Cambia el tipo de puzzle (cubo N×N×N o Pyraminx).
  const setPuzzle = (kind) => {
    if (rotating.current || !cubeGroupRef.current || kind === puzzleRef.current)
      return;
    puzzleRef.current = kind;
    setPuzzleState(kind);
    rebuild();
    setLastMove(null);
  };

  // Cambia el skin (material) manteniendo el estado del cubo.
  const setSkin = (s) => {
    if (s === skinRef.current) return;
    skinRef.current = s;
    setSkinState(s);
    const { body, getFace } = buildMaterials();
    cubelets.current.forEach((cube) => {
      cube.material = body;
      cube.children.forEach((ch) => {
        if (ch.userData && ch.userData.isSticker) {
          ch.material = getFace(ch.userData.color);
        }
      });
    });
  };

  return {
    mountRef,
    isRotating,
    lastMove,
    isMobile,
    progress,
    nextHint,
    solved,
    everScrambled,
    cubeSize,
    skin,
    puzzle,
    rotateLayer,
    shuffle,
    resetCube,
    toggleRotation,
    setCubeSize,
    setSkin,
    setPuzzle,
  };
}
