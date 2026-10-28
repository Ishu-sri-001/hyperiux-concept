import * as THREE from "three";

/**
 * Pure geometry for the Hyperiux H (no React, testable in Node).
 * Everything works on the GLB's own triangles: we only split, clip and add
 * the inner faces that appear where the crystal breaks.
 */

/** World height of the H sculpture. */
export const H_HEIGHT = 4.3;
/** Floor sits at y = 0; the H floats above it. */
export const H_CENTER_Y = H_HEIGHT / 2 + 0.4;

/** x of the cube's centre in GLB units: where the body splits into two halves. */
const CUBE_CENTER_X = -0.82;
/** Where the cracks start (GLB units): the centre of the H, inside the cube. */
const IMPACT_GLB = [-0.82, -0.4];

/** Piece order used everywhere (particles, services): index → name. */
export const PIECES = ["bodyL", "pillarA", "pillarB", "bodyR"];

/**
 * Light filaments threaded through the inside of the model (GLB units, checked
 * to sit inside the letter). `core` marks the centre lines carrying the metal core.
 */
const FILAMENTS = [
  { piece: "body", pts: [[-7.05, -8.5], [-7.0, -4.0], [-6.4, -2.4], [-4.0, -1.3], [-2.3, -0.85]], z: 0, core: true },
  { piece: "body", pts: [[-7.6, -8.5], [-7.6, -3.0], [-5.5, -1.9], [-2.6, -1.0]], z: 0.32 },
  { piece: "body", pts: [[-6.5, -8.5], [-6.5, -3.4], [-4.2, -1.9], [-2.7, -1.5]], z: -0.3 },
  { piece: "body", pts: [[0.15, 0.15], [3.0, 0.45], [5.4, 1.6], [5.72, 3.6], [5.72, 7.8]], z: 0, core: true },
  { piece: "body", pts: [[1.0, -0.9], [3.5, 0.1], [6.3, 1.0], [6.3, 7.8]], z: -0.32 },
  { piece: "body", pts: [[1.4, 0.3], [3.4, 1.1], [4.8, 2.0], [5.05, 3.6], [5.1, 7.8]], z: 0.3 },
  { piece: "pillarA", pts: [[-7.07, 1.0], [-7.07, 7.8]], z: 0, core: true },
  { piece: "pillarB", pts: [[5.72, -8.55], [5.72, -1.75]], z: 0, core: true },
];

export function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Split a mesh into connected components without altering any triangle. */
export function splitConnected(geometry) {
  const pos = geometry.attributes.position;
  const index = geometry.index ? geometry.index.array : null;
  const triCount = index ? index.length / 3 : pos.count / 3;
  const vi = (t, k) => (index ? index[t * 3 + k] : t * 3 + k);

  const welded = new Map();
  const weldId = new Int32Array(pos.count);
  for (let i = 0; i < pos.count; i++) {
    const key = `${pos.getX(i).toFixed(4)},${pos.getY(i).toFixed(4)},${pos.getZ(i).toFixed(4)}`;
    if (!welded.has(key)) welded.set(key, welded.size);
    weldId[i] = welded.get(key);
  }
  const parent = Array.from({ length: welded.size }, (_, i) => i);
  const find = (a) => {
    while (parent[a] !== a) a = parent[a] = parent[parent[a]];
    return a;
  };
  for (let t = 0; t < triCount; t++) {
    const a = find(weldId[vi(t, 0)]);
    parent[find(weldId[vi(t, 1)])] = a;
    parent[find(weldId[vi(t, 2)])] = a;
  }

  const groups = new Map();
  for (let t = 0; t < triCount; t++) {
    const root = find(weldId[vi(t, 0)]);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(t);
  }

  const names = Object.keys(geometry.attributes);
  return [...groups.values()].map((tris) => {
    const g = new THREE.BufferGeometry();
    for (const name of names) {
      const src = geometry.attributes[name];
      const out = new Float32Array(tris.length * 3 * src.itemSize);
      let o = 0;
      for (const t of tris) {
        for (let k = 0; k < 3; k++) {
          const v = vi(t, k);
          for (let c = 0; c < src.itemSize; c++) out[o++] = src.getComponent(v, c);
        }
      }
      g.setAttribute(name, new THREE.BufferAttribute(out, src.itemSize));
    }
    g.computeBoundingBox();
    return g;
  });
}

/** Cut a non-indexed geometry exactly with the plane x = cut. Returns [left, right]. */
export function splitAtX(geometry, cut) {
  const names = Object.keys(geometry.attributes);
  const attrs = names.map((n) => geometry.attributes[n]);
  const out = [names.map(() => []), names.map(() => [])];
  const vert = (i) => attrs.map((a) => Array.from({ length: a.itemSize }, (_, c) => a.getComponent(i, c)));
  const mix = (a, b, t) => a.map((arr, k) => arr.map((v, c) => v + (b[k][c] - v) * t));
  const push = (side, ...vs) => vs.forEach((v) => v.forEach((arr, k) => out[side][k].push(...arr)));

  for (let i = 0; i < geometry.attributes.position.count; i += 3) {
    const v = [vert(i), vert(i + 1), vert(i + 2)];
    const d = v.map((x) => x[0][0] - cut);
    const left = d.map((x) => x < 0);
    const nLeft = left.filter(Boolean).length;
    if (nLeft === 3) push(0, ...v);
    else if (nLeft === 0) push(1, ...v);
    else {
      const lone = nLeft === 1 ? left.indexOf(true) : left.indexOf(false);
      const a = v[lone];
      const b = v[(lone + 1) % 3];
      const c = v[(lone + 2) % 3];
      const da = d[lone];
      const ab = mix(a, b, da / (da - d[(lone + 1) % 3]));
      const ac = mix(a, c, da / (da - d[(lone + 2) % 3]));
      const loneSide = nLeft === 1 ? 0 : 1;
      push(loneSide, a, ab, ac);
      push(1 - loneSide, ab, b, c, ab, c, ac);
    }
  }

  return out.map((lists) => {
    const g = new THREE.BufferGeometry();
    names.forEach((n, k) => g.setAttribute(n, new THREE.BufferAttribute(new Float32Array(lists[k]), attrs[k].itemSize)));
    g.computeBoundingBox();
    return g;
  });
}

/** Box-projected UV for one vertex (the model's own UVs are collapsed). */
function planarUV(x, y, z, nx, ny, nz, density = 0.16) {
  const ax = Math.abs(nx);
  const ay = Math.abs(ny);
  const az = Math.abs(nz);
  if (az >= ax && az >= ay) return [x * density, y * density];
  if (ax >= ay) return [(z + 3.1) * density, y * density];
  return [x * density, (z + 5.7) * density];
}

export function addPlanarUVs(geometry) {
  const pos = geometry.attributes.position;
  const nrm = geometry.attributes.normal;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const [u, v] = planarUV(pos.getX(i), pos.getY(i), pos.getZ(i), nrm.getX(i), nrm.getY(i), nrm.getZ(i));
    uv[i * 2] = u;
    uv[i * 2 + 1] = v;
  }
  geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
}

// ---------------------------------------------------------------------------
// Fracture
// ---------------------------------------------------------------------------

/**
 * Voronoi cells over the letter (centred model units). Seeds cluster around the
 * impact point, so shards are small where the crystal is hit and larger far away.
 */
export function makeCells(count, impact, half, rng) {
  const seeds = [];
  let guard = 0;
  while (seeds.length < count && guard++ < count * 200) {
    const p = new THREE.Vector2((rng() * 2 - 1) * half.x, (rng() * 2 - 1) * half.y);
    const near = Math.exp(-p.distanceToSquared(impact) / (2 * 3.6 * 3.6));
    if (rng() < 0.22 + 0.78 * near) seeds.push(p);
  }
  return seeds.map((s, i) => {
    const planes = [];
    seeds.forEach((o, j) => {
      if (i === j) return;
      const n = o.clone().sub(s);
      const len = n.length();
      n.divideScalar(len);
      planes.push({ n, d: n.dot(s) + len / 2, len });
    });
    // Nearest neighbours first: most triangles are rejected within a few planes.
    planes.sort((a, b) => a.len - b.len);
    return { seed: s, planes };
  });
}

const lerpVert = (a, b, t) => ({
  p: a.p.clone().lerp(b.p, t),
  n: a.n.clone().lerp(b.n, t).normalize(),
  uv: a.uv.clone().lerp(b.uv, t),
});

/** Sutherland–Hodgman: keep the part of the polygon where n·p ≤ d (in x/y). */
function clipPoly(poly, n, d) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const da = n.x * a.p.x + n.y * a.p.y - d;
    const db = n.x * b.p.x + n.y * b.p.y - d;
    const ina = da <= 1e-7;
    const inb = db <= 1e-7;
    if (ina) out.push(a);
    if (ina !== inb) out.push(lerpVert(a, b, da / (da - db)));
  }
  return out;
}

/**
 * Break one piece (piece-local, non-indexed geometry) into shards.
 * Each shard: closed crystal geometry (original faces + new inner faces),
 * glowing crack seams on its broken edges, and its original sharp edges.
 */
export function fracturePiece(geometry, offset, cells) {
  const pos = geometry.attributes.position;
  const nrm = geometry.attributes.normal;
  const uvs = geometry.attributes.uv;
  const tris = [];
  for (let i = 0; i < pos.count; i += 3) {
    tris.push(
      [0, 1, 2].map((k) => ({
        p: new THREE.Vector3(pos.getX(i + k), pos.getY(i + k), pos.getZ(i + k)),
        n: new THREE.Vector3(nrm.getX(i + k), nrm.getY(i + k), nrm.getZ(i + k)),
        uv: new THREE.Vector2(uvs.getX(i + k), uvs.getY(i + k)),
      }))
    );
  }
  const box = geometry.boundingBox ?? new THREE.Box3().setFromBufferAttribute(pos);
  const zBack = box.min.z;
  const zFront = box.max.z;

  const shards = [];
  for (const cell of cells) {
    const planes = cell.planes.map((pl) => ({ n: pl.n, d: pl.d - (pl.n.x * offset.x + pl.n.y * offset.y) }));

    const polys = [];
    for (const tri of tris) {
      let poly = tri;
      for (const pl of planes) {
        poly = clipPoly(poly, pl.n, pl.d);
        if (poly.length < 3) break;
      }
      if (poly.length >= 3) polys.push(poly);
    }
    if (!polys.length) continue;

    const onPlane = (p) => planes.find((pl) => Math.abs(pl.n.x * p.x + pl.n.y * p.y - pl.d) < 1e-4);

    // Broken edges on the front face → inner faces (caps) and crack seams.
    const breaks = [];
    let frontArea = 0;
    for (const poly of polys) {
      const fn = new THREE.Vector3().crossVectors(poly[1].p.clone().sub(poly[0].p), poly[2].p.clone().sub(poly[0].p));
      if (fn.z <= 0 || Math.abs(fn.z) < 0.9 * fn.length()) continue;
      for (let i = 1; i < poly.length - 1; i++) {
        const c = new THREE.Vector3().crossVectors(poly[i].p.clone().sub(poly[0].p), poly[i + 1].p.clone().sub(poly[0].p));
        frontArea += c.length() / 2;
      }
      for (let i = 0; i < poly.length; i++) {
        const a = poly[i].p;
        const b = poly[(i + 1) % poly.length].p;
        const pa = onPlane(a);
        if (pa && pa === onPlane(b) && a.distanceTo(b) > 1e-4) breaks.push({ a, b, n: pa.n });
      }
    }
    if (frontArea < 0.05) continue;

    // --- Crystal geometry -------------------------------------------------
    const P = [];
    const N = [];
    const U = [];
    const pushV = (p, n, uv) => {
      P.push(p.x, p.y, p.z);
      N.push(n.x, n.y, n.z);
      U.push(uv[0] ?? uv.x, uv[1] ?? uv.y);
    };
    for (const poly of polys) {
      for (let i = 1; i < poly.length - 1; i++) {
        for (const v of [poly[0], poly[i], poly[i + 1]]) pushV(v.p, v.n, v.uv);
      }
    }
    const capCount = P.length;
    for (const { a, b, n } of breaks) {
      const nn = new THREE.Vector3(n.x, n.y, 0);
      const A0 = new THREE.Vector3(a.x, a.y, zBack);
      const B0 = new THREE.Vector3(b.x, b.y, zBack);
      const B1 = new THREE.Vector3(b.x, b.y, zFront);
      const A1 = new THREE.Vector3(a.x, a.y, zFront);
      let quad = [A0, B0, B1, A0, B1, A1];
      const face = new THREE.Vector3().crossVectors(B0.clone().sub(A0), B1.clone().sub(A0));
      if (face.dot(nn) < 0) quad = [A0, B1, B0, A0, A1, B1];
      for (const v of quad) pushV(v, nn, planarUV(v.x, v.y, v.z, nn.x, nn.y, 0));
    }

    // --- Crack seams: thin strips on the front and back faces --------------
    const seamP = [];
    const seamA = [];
    const w = 0.26;
    for (const { a, b, n } of breaks) {
      for (const z of [zFront + 0.006, zBack - 0.006]) {
        const a0 = [a.x, a.y, z];
        const b0 = [b.x, b.y, z];
        const a1 = [a.x - n.x * w, a.y - n.y * w, z];
        const b1 = [b.x - n.x * w, b.y - n.y * w, z];
        seamP.push(...a0, ...b0, ...b1, ...a0, ...b1, ...a1);
        seamA.push(0, 0, 1, 0, 1, 1);
      }
    }

    // --- Original sharp edges (not the new broken ones) --------------------
    const tmp = new THREE.BufferGeometry();
    tmp.setAttribute("position", new THREE.Float32BufferAttribute(P.slice(0, capCount), 3));
    const eg = new THREE.EdgesGeometry(tmp, 20);
    const ep = eg.attributes.position.array;
    const edges = [];
    for (let i = 0; i < ep.length; i += 6) {
      const a = new THREE.Vector3(ep[i], ep[i + 1], ep[i + 2]);
      const b = new THREE.Vector3(ep[i + 3], ep[i + 4], ep[i + 5]);
      const pa = onPlane(a);
      if (pa && pa === onPlane(b)) continue;
      edges.push(ep[i], ep[i + 1], ep[i + 2], ep[i + 3], ep[i + 4], ep[i + 5]);
    }
    tmp.dispose();
    eg.dispose();

    // Centre the shard on its own pivot.
    const crystal = new THREE.BufferGeometry();
    crystal.setAttribute("position", new THREE.Float32BufferAttribute(P, 3));
    crystal.setAttribute("normal", new THREE.Float32BufferAttribute(N, 3));
    crystal.setAttribute("uv", new THREE.Float32BufferAttribute(U, 2));
    crystal.computeBoundingBox();
    const center = crystal.boundingBox.getCenter(new THREE.Vector3());
    crystal.translate(-center.x, -center.y, -center.z);
    crystal.computeBoundingSphere();

    const seams = new THREE.BufferGeometry();
    seams.setAttribute("position", new THREE.Float32BufferAttribute(seamP, 3));
    seams.setAttribute("aAcross", new THREE.Float32BufferAttribute(seamA, 1));
    seams.translate(-center.x, -center.y, -center.z);

    const edgeGeo = new THREE.BufferGeometry();
    edgeGeo.setAttribute("position", new THREE.Float32BufferAttribute(edges, 3));
    edgeGeo.translate(-center.x, -center.y, -center.z);

    shards.push({ geometry: crystal, seams, edges: edgeGeo, center, area: frontArea });
  }
  return shards;
}

/**
 * Prepare the H from the loaded GLB mesh:
 *  - `source`: whole model centred on the origin (particle sampling)
 *  - `pieces`: four structural pieces (two pillars, two halves of the body)
 *  - each piece broken into `shards` along Voronoi cracks from the impact point
 *  - `filaments`: centre lines inside each piece
 */
export function prepareH(mesh, { shardCount = 60 } = {}) {
  const source = mesh.geometry.clone();
  source.applyMatrix4(mesh.matrixWorld);
  source.computeBoundingBox();
  const box = source.boundingBox.clone();
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  source.translate(-center.x, -center.y, -center.z);
  source.computeBoundingBox();

  const finish = (geometry) => {
    const b = geometry.boundingBox.clone();
    const c = b.getCenter(new THREE.Vector3());
    geometry.translate(-c.x, -c.y, -c.z);
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    return { geometry, box: b, offset: c };
  };

  const parts = splitConnected(source);
  parts.forEach(addPlanarUVs);
  const area = (g) => {
    const s = g.boundingBox.getSize(new THREE.Vector3());
    return s.x * s.y;
  };
  parts.sort((a, b) => area(b) - area(a));
  const [bodyGeo, ...pillarGeos] = parts;
  const pillarAGeo = pillarGeos.find((g) => g.boundingBox.getCenter(new THREE.Vector3()).y > 0) || pillarGeos[0];
  const pillarBGeo = pillarGeos.find((g) => g !== pillarAGeo) || pillarGeos[1];

  const cut = CUBE_CENTER_X - center.x;
  const [leftGeo, rightGeo] = splitAtX(bodyGeo, cut);
  const pieces = {
    bodyL: finish(leftGeo),
    pillarA: finish(pillarAGeo),
    pillarB: finish(pillarBGeo),
    bodyR: finish(rightGeo),
  };

  const impact = new THREE.Vector2(IMPACT_GLB[0] - center.x, IMPACT_GLB[1] - center.y);
  const cells = makeCells(shardCount, impact, new THREE.Vector2(size.x / 2 + 0.5, size.y / 2 + 0.5), mulberry32(90210));
  for (const name of PIECES) {
    const piece = pieces[name];
    piece.shards = fracturePiece(piece.geometry, piece.offset, cells);
  }

  const filaments = FILAMENTS.map((f) => {
    const name =
      f.piece === "body" ? (f.pts.reduce((s, p) => s + p[0], 0) / f.pts.length < CUBE_CENTER_X ? "bodyL" : "bodyR") : f.piece;
    const piece = pieces[name];
    const pts = f.pts.map(
      ([x, y]) => new THREE.Vector3(x - center.x - piece.offset.x, y - center.y - piece.offset.y, f.z - piece.offset.z)
    );
    return { piece: name, core: !!f.core, curve: new THREE.CatmullRomCurve3(pts, false, "centripetal") };
  });

  const columns = {
    left: (pieces.pillarA.box.min.x + pieces.pillarA.box.max.x) / 2,
    right: (pieces.pillarB.box.min.x + pieces.pillarB.box.max.x) / 2,
  };

  return {
    source,
    pieces,
    filaments,
    size,
    columns,
    cut,
    impact: new THREE.Vector3(impact.x, impact.y, 0),
    scale: H_HEIGHT / size.y,
  };
}
