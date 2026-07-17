// src/logic/pyraminx.js
// Geometría y ejes de un Pyraminx (tetraedro): 4 caras de color, cada una
// subdividida en 9 triángulos (3 tips + 3 axiales + 3 aristas).
import * as THREE from "three";
import { makePrism } from "./prism.js";

// Vértices de un tetraedro regular centrado en el origen.
const RAW_VERTICES = [
  [1, 1, 1],
  [1, -1, -1],
  [-1, 1, -1],
  [-1, -1, 1],
];

// Ejes de giro: dirección unitaria hacia cada vértice.
export const PYRA_AXES = RAW_VERTICES.map((v) =>
  new THREE.Vector3(v[0], v[1], v[2]).normalize()
);

// Etiqueta de cada vértice (para los controles / pistas).
export const PYRA_VERTEX_LABELS = ["A", "B", "C", "D"];

// Color de cada cara (la cara i es la opuesta al vértice i).
export const PYRA_COLORS = [
  0xff2d2d, // roja   (opuesta a V0)
  0x2ecc40, // verde  (opuesta a V1)
  0x2a6bff, // azul   (opuesta a V2)
  0xffd500, // amarilla (opuesta a V3)
];

// Colores que se encuentran en cada vértice: las 3 caras que lo tocan (todas
// menos la opuesta). Sirve para identificar cada vértice en los controles.
export const PYRA_VERTEX_COLORS = [0, 1, 2, 3].map((v) =>
  [0, 1, 2, 3].filter((k) => k !== v).map((k) => PYRA_COLORS[k])
);

// Normal exterior y color de cada una de las 4 caras (para el progreso).
export const PYRA_FACES = RAW_VERTICES.map((v, i) => {
  const n = new THREE.Vector3(v[0], v[1], v[2]).normalize().multiplyScalar(-1);
  return { normal: [n.x, n.y, n.z], color: PYRA_COLORS[i] };
});

/**
 * Construye el Pyraminx y lo añade a `parent`.
 * Cada sticker es un mesh con geometría centrada en su centroide y
 * `position` en dicho centroide (como los cubelets del cubo), para poder
 * girarlos con el mismo patrón.
 * @returns {{ stickers: THREE.Mesh[], homes: THREE.Vector3[], body: THREE.Mesh }}
 */
export function buildPyraminx(parent, opts = {}) {
  const scale = opts.scale ?? 1.75;
  const V = RAW_VERTICES.map(
    ([x, y, z]) => new THREE.Vector3(x, y, z).multiplyScalar(scale)
  );

  const bodyMaterial =
    opts.bodyMaterial ||
    new THREE.MeshStandardMaterial({
      color: 0x0a0a0d,
      roughness: 0.9,
      metalness: 0,
    });
  const faceMaterial =
    opts.faceMaterial ||
    ((c) =>
      new THREE.MeshStandardMaterial({
        color: c,
        roughness: 0.5,
        metalness: 0,
        emissive: new THREE.Color(c),
        emissiveIntensity: 0.15,
        side: THREE.DoubleSide,
      }));

  const stickers = [];
  const homes = [];

  // Las 4 caras: cara i opuesta al vértice i (triángulo con los otros 3).
  const faces = [
    { opp: 0, tri: [1, 2, 3] },
    { opp: 1, tri: [0, 3, 2] },
    { opp: 2, tri: [0, 1, 3] },
    { opp: 3, tri: [0, 2, 1] },
  ];

  // Cuerpo oscuro: tetraedro sólido pequeño (relleno del núcleo, oculto tras
  // las piezas). Las piezas ahora tienen volumen, así que basta un núcleo.
  const bodyGeo = new THREE.BufferGeometry();
  const bodyPos = [];
  const bScale = 0.55;
  faces.forEach(({ tri }) => {
    const [a, b, c] = tri.map((k) => V[k].clone().multiplyScalar(bScale));
    bodyPos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
  });
  bodyGeo.setAttribute("position", new THREE.Float32BufferAttribute(bodyPos, 3));
  bodyGeo.computeVertexNormals();
  const body = new THREE.Mesh(bodyGeo, bodyMaterial);
  parent.add(body);

  // Stickers: cada cara subdividida en 9 triángulos.
  faces.forEach(({ opp, tri }) => {
    const A = V[tri[0]];
    const B = V[tri[1]];
    const C = V[tri[2]];
    const color = PYRA_COLORS[opp];
    const normal = V[opp].clone().normalize().multiplyScalar(-1);

    const P = (i, j) =>
      A.clone()
        .addScaledVector(B.clone().sub(A), i / 3)
        .addScaledVector(C.clone().sub(A), j / 3);

    const tris = [];
    // Triángulos "hacia arriba".
    for (let i = 0; i <= 2; i++) {
      for (let j = 0; i + j <= 2; j++) {
        tris.push([P(i, j), P(i + 1, j), P(i, j + 1)]);
      }
    }
    // Triángulos "hacia abajo".
    for (let i = 0; i <= 1; i++) {
      for (let j = 0; i + j <= 1; j++) {
        tris.push([P(i + 1, j), P(i, j + 1), P(i + 1, j + 1)]);
      }
    }

    tris.forEach((pts) => {
      const cen = pts[0].clone().add(pts[1]).add(pts[2]).multiplyScalar(1 / 3);
      const shrink = 0.86;
      // Polígono exterior (encogido y ligeramente hacia afuera) y su extrusión
      // hacia el centro para dar volumen a la pieza.
      const outer = pts.map((v) =>
        cen
          .clone()
          .add(v.clone().sub(cen).multiplyScalar(shrink))
          .addScaledVector(normal, 0.02)
      );
      const { geometry, position } = makePrism(outer, 0.5);
      const mesh = new THREE.Mesh(geometry, faceMaterial(color));
      mesh.position.copy(position);
      mesh.userData = {
        isSticker: true,
        faceIndex: opp,
        color,
        normal: [normal.x, normal.y, normal.z],
      };
      parent.add(mesh);
      stickers.push(mesh);
      homes.push(mesh.position.clone());
    });
  });

  return { stickers, homes, body };
}
