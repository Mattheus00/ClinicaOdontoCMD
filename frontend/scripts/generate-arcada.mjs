/** Original, reproducible anatomical illustration mesh. No third-party model assets. */
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { BufferGeometry, Float32BufferAttribute, Group, Mesh, MeshPhysicalMaterial, Color } from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

// GLTFExporter uses FileReader even when exporting a texture-free binary in Node.
globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buffer) => { this.result = buffer; this.onloadend?.(); });
  }
};
const enamel = new MeshPhysicalMaterial({ color: '#fffaf0', vertexColors: true, roughness: 0.29, clearcoat: 0.3 });
const gingiva = new MeshPhysicalMaterial({ color: '#c77c88', roughness: 0.78 });
const widths = [0.45, 0.35, 0.4, 0.42, 0.43, 0.55, 0.53, 0.49];
const heights = [0.73, 0.65, 0.8, 0.6, 0.57, 0.54, 0.51, 0.47];
const depths = [0.28, 0.29, 0.38, 0.52, 0.53, 0.59, 0.59, 0.56];
const segments = 48;
const smooth = (t) => t * t * (3 - 2 * t);
const signedPower = (x, e) => Math.sign(x) * Math.abs(x) ** e;

function surface(rings, count, sample, colors = false) {
  const positions = [], indices = [], shades = [];
  const color = new Color();
  for (let r = 0; r <= rings; r++) {
    for (let s = 0; s <= count; s++) {
      const { x, y, z, shade = 1 } = sample(r / rings, s / count * Math.PI * 2);
      positions.push(x, y, z);
      color.setRGB(shade, shade * 0.985, shade * 0.953);
      shades.push(color.r, color.g, color.b);
      if (r < rings && s < count) {
        const a = r * (count + 1) + s, b = a + count + 1;
        indices.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  if (colors) geometry.setAttribute('color', new Float32BufferAttribute(shades, 3));
  geometry.setIndex(indices);
  const welded = mergeVertices(geometry, 1e-5);
  welded.computeVertexNormals();
  geometry.dispose();
  return welded;
}

function crown(n, lower) {
  const incisor = n < 2, canine = n === 2, posterior = n > 2;
  const w = widths[n] * (lower && incisor ? 0.76 : 1);
  const h = heights[n] * (lower ? 0.9 : 1), d = depths[n];
  return surface(36, segments, (t, angle) => {
    const bottom = t < 0.06;
    const bottomRadius = t / 0.06;
    t = Math.max(0, (t - 0.06) / 0.94);
    // Cervical narrowing, convex walls, and a separately sampled occlusal surface.
    const wall = t <= 0.67;
    const v = Math.min(1, t / 0.67);
    const radius = bottom ? 0.74 * bottomRadius : wall ? 0.74 + 0.25 * Math.sin(v * 2.15) : Math.max(0.001, (1 - t) / 0.33) * (0.74 + 0.25 * Math.sin(2.15));
    const exponent = incisor ? 0.8 : n > 4 ? 0.78 : 0.95;
    let x = signedPower(Math.cos(angle), exponent) * w / 2 * radius;
    let z = signedPower(Math.sin(angle), exponent) * d / 2 * radius;
    if (incisor) z *= 1 - 0.67 * smooth(v);
    let y = h * v * (posterior ? 0.8 : 0.96);
    if (canine) {
      x *= 1 - 0.35 * v ** 3;
      z *= 1 - 0.24 * v;
      y += h * 0.2 * v ** 6 * (1 - Math.abs(x) / (w / 2));
    }
    let groove = 0;
    if (posterior && !wall) {
      const cusps = n < 5 ? [[0, -0.14], [0, 0.14]] : [[-0.14, -0.16], [0.14, -0.16], [-0.14, 0.16], [0.14, 0.16]];
      let bump = 0;
      for (const [cx, cz] of cusps) bump = Math.max(bump, Math.exp(-(((x - cx) / 0.12) ** 2 + ((z - cz) / 0.13) ** 2)));
      groove = Math.exp(-((z / 0.026) ** 2)) * 0.6 + (n >= 5 ? Math.exp(-((x / 0.024) ** 2)) * 0.35 : 0);
      const roof = smooth(Math.min(1, (t - 0.67) / 0.09));
      y += (bump * 0.095 - groove * 0.025) * roof;
    }
    if (incisor) y += 0.004 * Math.cos(x / w * Math.PI * 6) * v ** 8;
    // Subtle natural neck tint and darker fissures, not painted clinical statuses.
    const shade = 0.88 + 0.1 * Math.min(1, v * 3) - groove * 0.07;
    return { x, y, z, shade };
  }, true);
}

function arch(lower) {
  const group = new Group();
  group.name = lower ? 'mandible' : 'maxilla';
  const actualWidths = widths.map((w, n) => w * (lower && n < 2 ? 0.76 : 1));
  const total = actualWidths.reduce((sum, w) => sum + w + 0.035, 0);
  // Parameterize by arc length, so incisors do not intersect at the tight anterior curve.
  const ratio = lower ? 1.3 : 1.25;
  const arc = [0];
  for (let i = 1; i <= 1000; i++) {
    const a = (i - 0.5) / 1000 * 1.65;
    arc.push(arc[i - 1] + Math.hypot(Math.cos(a), ratio * Math.sin(a)) * 1.65 / 1000);
  }
  const radiusX = total / arc[1000], radiusZ = radiusX * ratio;
  const steps = [];
  let distance = 0;
  actualWidths.forEach((w) => {
    const target = (distance + w / 2) / radiusX;
    const index = arc.findIndex((v) => v >= target);
    steps.push(index / 1000 * 1.65);
    distance += w + 0.035;
  });
  for (const side of [-1, 1]) {
    for (let n = 0; n < 8; n++) {
      const angle = side * steps[n];
      const x = radiusX * Math.sin(angle), z = radiusZ * Math.cos(angle) - 0.9;
      const quadrant = lower ? (side < 0 ? 4 : 3) : (side < 0 ? 1 : 2);
      const tooth = new Mesh(crown(n, lower), enamel);
      tooth.name = `tooth_${quadrant}${n + 1}`;
      tooth.position.set(x, 0.015, z);
      tooth.rotation.y = Math.atan2(radiusZ * Math.sin(angle), radiusX * Math.cos(angle));
      group.add(tooth);
      // Scalloped gingival collar wraps the cervical circumference of every tooth.
      const collar = new Mesh(surface(12, 48, (t, a) => {
        const cross = t * Math.PI * 2;
        const w = widths[n] * (lower && n < 2 ? 0.76 : 1);
        return { x: Math.cos(a) * (w * 0.4 + 0.045 * Math.cos(cross)),
          y: 0.025 + 0.055 * Math.sin(cross) + 0.035 * Math.cos(2 * a),
          z: Math.sin(a) * (depths[n] * 0.4 + 0.045 * Math.cos(cross)) };
      }), gingiva);
      collar.name = `gingiva_${quadrant}${n + 1}`;
      collar.position.copy(tooth.position);
      collar.rotation.copy(tooth.rotation);
      group.add(collar);
    }
  }
  const gum = new Mesh(surface(160, 32, (t, a) => {
    const theta = (t - 0.5) * 3.5;
    const thickness = 0.3 + 0.035 * Math.cos(theta * 9);
    const cap = Math.min(1, Math.sin(t * Math.PI) * 12);
    return { x: (radiusX + thickness * Math.cos(a) * cap) * Math.sin(theta),
      y: -0.14 + 0.23 * Math.sin(a) * cap,
      z: (radiusZ + thickness * Math.cos(a) * cap) * Math.cos(theta) - 0.9 };
  }), gingiva);
  gum.name = lower ? 'gingiva_lower' : 'gingiva_upper';
  group.add(gum);
  if (lower) {
    group.position.y = -1.1;
  } else {
    // Flip crowns downward while keeping the anterior teeth toward +Z.
    group.scale.y = -1;
    group.position.y = 1.05;
  }
  return group;
}

const root = new Group();
root.name = 'arcada';
root.userData = { source: 'Original procedural anatomical illustration', license: 'Project-owned', dentition: 'permanent', coordinates: '+Y up; +Z anterior; patient right is -X' };
root.add(arch(false), arch(true));
const output = fileURLToPath(new URL('../public/models/arcada.glb', import.meta.url));
const binary = await new GLTFExporter().parseAsync(root, { binary: true });
await mkdir(fileURLToPath(new URL('../public/models/', import.meta.url)), { recursive: true });
await writeFile(output, Buffer.from(binary));
console.log(`Arcada exportada: ${output} (${(binary.byteLength / 1024 / 1024).toFixed(2)} MB), 32 meshes tooth_FDI.`);
