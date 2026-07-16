// src/logic/pyraminx.js
// Geometría de un Pyraminx (tetraedro): 4 caras de color, cada una
// subdividida en 9 triángulos, sobre un cuerpo oscuro.
import * as THREE from "three";

// Vértices de un tetraedro regular centrado en el origen.
const RAW_VERTICES = [
  [1, 1, 1],
  [1, -1, -1],
  [-1, 1, -1],
  [-1, -1, 1],
];

// Color de cada cara (la cara i es la opuesta al vértice i).
export const PYRA_COLORS = [
  0xff2d2d, // roja   (opuesta a V0)
  0x2ecc40, // verde  (opuesta a V1)
  0x2a6bff, // azul   (opuesta a V2)
  0xffd500, // amarilla (opuesta a V3)
];

// Normal exterior y color de cada una de las 4 caras (para el progreso).
export const PYRA_FACES = RAW_VERTICES.map((v, i) => {
  const n = new THREE.Vector3(v[0], v[1], v[2]).normalize().multiplyScalar(-1);
  return { normal: [n.x, n.y, n.z], color: PYRA_COLORS[i] };
});

/**
 * Construye el Pyraminx y lo añade a `parent`. Devuelve los datos de piezas.
 * @param {THREE.Object3D} parent
 * @param {object} opts { scale, bodyMaterial, faceMaterial(colorHex) }
 */
export function buildPyraminx(parent, opts = {}) {
  const scale = opts.scale ?? 1.5;
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

  // Las 4 caras: cara i opuesta al vértice i (triángulo con los otros 3).
  const faces = [
    { opp: 0, tri: [1, 2, 3] },
    { opp: 1, tri: [0, 3, 2] },
    { opp: 2, tri: [0, 1, 3] },
    { opp: 3, tri: [0, 2, 1] },
  ];

  // Cuerpo oscuro: tetraedro sólido un poco más pequeño.
  const bodyGeo = new THREE.BufferGeometry();
  const bodyPos = [];
  const bScale = 0.985;
  faces.forEach(({ tri }) => {
    const [a, b, c] = tri.map((k) => V[k].clone().multiplyScalar(bScale));
    bodyPos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
  });
  bodyGeo.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(bodyPos, 3)
  );
  bodyGeo.computeVertexNormals();
  const body = new THREE.Mesh(bodyGeo, bodyMaterial);
  parent.add(body);

  // Stickers: cada cara subdividida en 9 triángulos.
  faces.forEach(({ opp, tri }) => {
    const A = V[tri[0]];
    const B = V[tri[1]];
    const C = V[tri[2]];
    const color = PYRA_COLORS[opp];
    // Normal exterior de la cara = dirección opuesta al vértice opp.
    const normal = V[opp].clone().normalize().multiplyScalar(-1);

    const P = (i, j) =>
      A.clone()
        .addScaledVector(B.clone().sub(A), i / 3)
        .addScaledVector(C.clone().sub(A), j / 3);

    // Triángulos "hacia arriba" (misma orientación que la cara).
    const tris = [];
    for (let i = 0; i + 0 <= 2; i++) {
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
      // Centroide para encoger un poco (deja hueco/rejilla).
      const cen = pts[0].clone().add(pts[1]).add(pts[2]).multiplyScalar(1 / 3);
      const shrink = 0.86;
      const off = normal.clone().multiplyScalar(0.02);
      const p = pts.map((v) =>
        v.clone().sub(cen).multiplyScalar(shrink).add(cen).add(off)
      );
      const geo = new THREE.BufferGeometry();
      geo.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(
          [
            p[0].x, p[0].y, p[0].z,
            p[1].x, p[1].y, p[1].z,
            p[2].x, p[2].y, p[2].z,
          ],
          3
        )
      );
      geo.computeVertexNormals();
      const mesh = new THREE.Mesh(geo, faceMaterial(color));
      mesh.userData = {
        isSticker: true,
        faceIndex: opp,
        color,
        normal: [normal.x, normal.y, normal.z],
      };
      parent.add(mesh);
      stickers.push(mesh);
    });
  });

  return { body, stickers, vertices: V };
}
