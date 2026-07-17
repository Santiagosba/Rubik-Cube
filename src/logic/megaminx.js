// src/logic/megaminx.js
// Geometría de un Megaminx (dodecaedro): 12 caras pentagonales, cada una
// subdividida en 11 stickers (1 centro + 5 esquinas + 5 aristas), como un
// Megaminx real. Sigue el mismo patrón que el Pyraminx: cuerpo oscuro sólido
// + stickers de color, cada uno con su normal para calcular el progreso.
import * as THREE from "three";
import { makePrism } from "./prism.js";

// 12 colores vivos y bien diferenciados (uno por cara).
export const MEGA_COLORS = [
  0xff2d2d, // rojo
  0x2ecc40, // verde
  0x2a6bff, // azul
  0xffd500, // amarillo
  0xff8c00, // naranja
  0xffffff, // blanco
  0x9b30ff, // violeta
  0xff69b4, // rosa
  0x00e5d0, // turquesa
  0x8b5a2b, // marrón
  0xbfff00, // lima
  0xc0c0c0, // gris
];

// Ordena 5 puntos de una cara en sentido antihorario alrededor de su normal,
// para formar el pentágono.
function orderPentagon(pts, normal) {
  const c = new THREE.Vector3();
  pts.forEach((p) => c.add(p));
  c.multiplyScalar(1 / pts.length);
  const u = pts[0].clone().sub(c).normalize();
  const w = new THREE.Vector3().crossVectors(normal, u).normalize();
  return pts
    .map((p) => {
      const d = p.clone().sub(c);
      return { p, ang: Math.atan2(d.dot(w), d.dot(u)) };
    })
    .sort((a, b) => a.ang - b.ang)
    .map((o) => o.p);
}

// Deriva las 12 caras (normal + 5 vértices ordenados) de la geometría del
// dodecaedro de three.js, agrupando sus triángulos por normal de cara. Es
// robusto (no depende de constantes numéricas propensas a error).
function computeFaces(radius) {
  const geo = new THREE.DodecahedronGeometry(radius);
  const pos = geo.getAttribute("position");
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();

  // Los pentágonos de three.js no son perfectamente planos (sus triángulos
  // difieren ~8°), así que agrupamos los triángulos por dirección de normal
  // usando un umbral angular (las caras vecinas están a >60°).
  const clusters = [];
  for (let t = 0; t < pos.count; t += 3) {
    a.fromBufferAttribute(pos, t);
    b.fromBufferAttribute(pos, t + 1);
    c.fromBufferAttribute(pos, t + 2);
    const tc = a.clone().add(b).add(c).multiplyScalar(1 / 3);
    const nor = b.clone().sub(a).cross(c.clone().sub(a)).normalize();
    if (nor.dot(tc) < 0) nor.negate(); // hacia afuera
    let cl = clusters.find((k) => k.dir.dot(nor) > 0.8);
    if (!cl) {
      cl = { dir: nor.clone(), pts: [] };
      clusters.push(cl);
    }
    cl.pts.push(a.clone(), b.clone(), c.clone());
  }
  geo.dispose();

  return clusters.map(({ pts }) => {
    // Vértices únicos de la cara (los triángulos comparten vértices).
    const uniq = [];
    pts.forEach((p) => {
      if (!uniq.some((u) => u.distanceToSquared(p) < 1e-4)) uniq.push(p);
    });
    // Normal exacta = dirección del centroide de la cara respecto al origen.
    const centroid = new THREE.Vector3();
    uniq.forEach((p) => centroid.add(p));
    centroid.multiplyScalar(1 / uniq.length);
    const normal = centroid.clone().normalize();
    return { normal, verts: orderPentagon(uniq, normal) };
  });
}

// Normal exterior + color de cada cara (para el cálculo del progreso).
export const MEGA_FACES = computeFaces(1).map((f, i) => ({
  normal: [f.normal.x, f.normal.y, f.normal.z],
  color: MEGA_COLORS[i],
}));

// Ejes de giro: la normal (unitaria) de cada una de las 12 caras.
export const MEGA_AXES = MEGA_FACES.map((f) =>
  new THREE.Vector3(f.normal[0], f.normal[1], f.normal[2]).normalize()
);

// Número de stickers que giran con una cara (1 centro + 5×5 = 26).
export const MEGA_LAYER = 26;

// Etiqueta corta de cada cara para controles/pistas.
export const MEGA_FACE_LABELS = MEGA_COLORS.map((_, i) => `C${i + 1}`);

// Divide un pentágono (V0..V4, CCW) en 11 polígonos: 1 centro, 5 esquinas y
// 5 aristas. Devuelve arrays de puntos (Vector3) por sticker.
function subdivide(V) {
  const C = new THREE.Vector3();
  V.forEach((p) => C.add(p));
  C.multiplyScalar(1 / 5);

  const k = 0.52; // tamaño del pentágono central (respecto al vértice)
  const e = 0.32; // corte sobre cada arista

  const W = V.map((p) => C.clone().lerp(p, k)); // pentágono interior
  const P = V.map((p, i) => p.clone().lerp(V[(i + 1) % 5], e)); // corte cercano
  const Q = V.map((p, i) => p.clone().lerp(V[(i + 1) % 5], 1 - e)); // corte lejano

  const polys = [];
  polys.push({ kind: "center", pts: W }); // centro
  for (let i = 0; i < 5; i++) {
    const prev = (i + 4) % 5;
    polys.push({ kind: "corner", pts: [Q[prev], V[i], P[i], W[i]] });
  }
  for (let i = 0; i < 5; i++) {
    polys.push({ kind: "edge", pts: [P[i], Q[i], W[(i + 1) % 5], W[i]] });
  }
  return polys;
}

// Triangula un polígono convexo como abanico desde su primer vértice.
function fanIndices(n) {
  const idx = [];
  for (let i = 1; i < n - 1; i++) idx.push(0, i, i + 1);
  return idx;
}

/**
 * Construye el Megaminx y lo añade a `parent`.
 * Cada sticker es un mesh con geometría centrada en su centroide y `position`
 * en dicho centroide (como los del Pyraminx), listo para girar por capas.
 * @returns {{ stickers: THREE.Mesh[], homes: THREE.Vector3[], body: THREE.Mesh }}
 */
export function buildMegaminx(parent, opts = {}) {
  const scale = opts.scale ?? 1.6;
  const faces = computeFaces(scale);

  const bodyMaterial =
    opts.bodyMaterial ||
    new THREE.MeshStandardMaterial({
      color: 0x0a0a0d,
      roughness: 0.9,
      metalness: 0,
    });
  const faceMaterial =
    opts.faceMaterial ||
    ((col) =>
      new THREE.MeshStandardMaterial({
        color: col,
        roughness: 0.5,
        metalness: 0,
        emissive: new THREE.Color(col),
        emissiveIntensity: 0.15,
        side: THREE.DoubleSide,
      }));

  const stickers = [];
  const homes = [];

  // Cuerpo oscuro: dodecaedro sólido pequeño (relleno del núcleo, oculto tras
  // las piezas, que ahora tienen volumen).
  const bodyGeo = new THREE.BufferGeometry();
  const bodyPos = [];
  const bScale = 0.55;
  faces.forEach(({ verts }) => {
    const p = verts.map((v) => v.clone().multiplyScalar(bScale));
    fanIndices(5).forEach((k) => bodyPos.push(p[k].x, p[k].y, p[k].z));
  });
  bodyGeo.setAttribute("position", new THREE.Float32BufferAttribute(bodyPos, 3));
  bodyGeo.computeVertexNormals();
  const body = new THREE.Mesh(bodyGeo, bodyMaterial);
  parent.add(body);

  // Stickers: 11 por cara.
  faces.forEach(({ normal, verts }, faceIndex) => {
    const color = MEGA_COLORS[faceIndex];
    const nrm = normal.clone();

    subdivide(verts).forEach((poly) => {
      const pts = poly.pts;
      const cen = new THREE.Vector3();
      pts.forEach((p) => cen.add(p));
      cen.multiplyScalar(1 / pts.length);

      const shrink = 0.93;
      // Polígono exterior (encogido y hacia afuera) extruido hacia el centro
      // para dar volumen a cada pieza.
      const outer = pts.map((p) =>
        cen
          .clone()
          .add(p.clone().sub(cen).multiplyScalar(shrink))
          .addScaledVector(nrm, 0.02)
      );
      const { geometry, position } = makePrism(outer, 0.6);
      const mesh = new THREE.Mesh(geometry, faceMaterial(color));
      mesh.position.copy(position);
      mesh.userData = {
        isSticker: true,
        faceIndex,
        color,
        normal: [nrm.x, nrm.y, nrm.z],
      };
      parent.add(mesh);
      stickers.push(mesh);
      homes.push(mesh.position.clone());
    });
  });

  return { stickers, homes, body };
}
