// src/logic/prism.js
import * as THREE from "three";

/**
 * Construye la geometría de un "trozo" sólido a partir de un polígono exterior
 * (en coordenadas de mundo, sobre la superficie del puzzle). Lo extruye hacia
 * el centro (origen) para dar volumen a cada sticker: así, al girar una capa,
 * las piezas se ven macizas y no se asoma el cuerpo estático del fondo.
 *
 * La geometría se centra en el centroide exterior, que será `mesh.position`
 * (igual que antes con los stickers planos), de modo que la selección de capa,
 * el encaje y el progreso siguen funcionando sin cambios.
 *
 * @param {THREE.Vector3[]} outer  Vértices exteriores (mundo), ya encogidos y
 *                                 desplazados hacia afuera.
 * @param {number} innerScale      Fracción del radio para la cara interior.
 * @returns {{ geometry: THREE.BufferGeometry, position: THREE.Vector3 }}
 */
export function makePrism(outer, innerScale = 0.55) {
  const n = outer.length;
  const position = new THREE.Vector3();
  outer.forEach((p) => position.add(p));
  position.multiplyScalar(1 / n);

  const O = outer.map((p) => p.clone().sub(position));
  // Cara interior: el mismo polígono escalado hacia el origen del puzzle.
  const I = outer.map((p) => p.clone().multiplyScalar(innerScale).sub(position));

  const pos = [];
  const push = (v) => pos.push(v.x, v.y, v.z);

  // Cara exterior (abanico).
  for (let i = 1; i < n - 1; i++) {
    push(O[0]);
    push(O[i]);
    push(O[i + 1]);
  }
  // Cara interior (abanico, sentido invertido).
  for (let i = 1; i < n - 1; i++) {
    push(I[0]);
    push(I[i + 1]);
    push(I[i]);
  }
  // Paredes laterales.
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    push(O[i]);
    push(O[j]);
    push(I[j]);
    push(O[i]);
    push(I[j]);
    push(I[i]);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geometry.computeVertexNormals();
  return { geometry, position };
}
