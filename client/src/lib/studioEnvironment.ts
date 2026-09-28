import * as THREE from "three";

type Vec3 = [number, number, number];

function emissiveMaterial(intensity: number, color: THREE.ColorRepresentation = 0xffffff) {
  return new THREE.MeshBasicMaterial({
    color: new THREE.Color(color).multiplyScalar(intensity),
    side: THREE.DoubleSide,
    toneMapped: false,
  });
}

function makeBar(
  a: THREE.Vector3,
  b: THREE.Vector3,
  thickness: number,
  material: THREE.Material
) {
  const dir = b.clone().sub(a);
  const length = dir.length();
  if (length < 1e-6) return null;
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(length, thickness, thickness),
    material
  );
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(1, 0, 0),
    dir.normalize()
  );
  return mesh;
}

/** Detailing-shop honeycomb LED ceiling (white strips on dark ceiling). */
function createHoneycombCeiling(opts?: {
  cols?: number;
  rows?: number;
  hexRadius?: number;
  thickness?: number;
  intensity?: number;
}): THREE.Group {
  const cols = opts?.cols ?? 4;
  const rows = opts?.rows ?? 6;
  const R = opts?.hexRadius ?? 0.85;
  const thickness = opts?.thickness ?? 0.07;
  const intensity = opts?.intensity ?? 11;
  const material = emissiveMaterial(intensity);

  const group = new THREE.Group();
  const edgeKeys = new Set<string>();

  const hexCorners = (cx: number, cz: number) => {
    const pts: THREE.Vector3[] = [];
    // Flat-top hexagon in XZ plane (ceiling)
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 180) * (60 * i);
      pts.push(
        new THREE.Vector3(cx + R * Math.cos(angle), 0, cz + R * Math.sin(angle))
      );
    }
    return pts;
  };

  const addEdge = (p: THREE.Vector3, q: THREE.Vector3) => {
    const keyA = `${p.x.toFixed(3)},${p.z.toFixed(3)}`;
    const keyB = `${q.x.toFixed(3)},${q.z.toFixed(3)}`;
    const key = keyA < keyB ? `${keyA}|${keyB}` : `${keyB}|${keyA}`;
    if (edgeKeys.has(key)) return;
    edgeKeys.add(key);
    const bar = makeBar(p, q, thickness, material);
    if (bar) group.add(bar);
  };

  // Flat-top spacing
  const dx = 1.5 * R;
  const dz = Math.sqrt(3) * R;
  const width = (cols - 1) * dx + 2 * R;
  const depth = (rows - 1) * dz + Math.sqrt(3) * R;
  const originX = -width / 2 + R;
  const originZ = -depth / 2 + (Math.sqrt(3) / 2) * R;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cx = originX + col * dx;
      const cz = originZ + row * dz + (col % 2 === 1 ? dz / 2 : 0);
      const corners = hexCorners(cx, cz);
      for (let i = 0; i < 6; i++) {
        addEdge(corners[i], corners[(i + 1) % 6]);
      }
    }
  }

  // Outer rectangular frame
  const pad = R * 0.35;
  const minX = originX - R - pad;
  const maxX = originX + (cols - 1) * dx + R + pad;
  const minZ = originZ - (Math.sqrt(3) / 2) * R - pad;
  const maxZ = originZ + (rows - 1) * dz + dz / 2 + (Math.sqrt(3) / 2) * R + pad;
  const corners: Vec3[] = [
    [minX, 0, minZ],
    [maxX, 0, minZ],
    [maxX, 0, maxZ],
    [minX, 0, maxZ],
  ];
  for (let i = 0; i < 4; i++) {
    const a = new THREE.Vector3(...corners[i]);
    const b = new THREE.Vector3(...corners[(i + 1) % 4]);
    const bar = makeBar(a, b, thickness * 1.15, material);
    if (bar) group.add(bar);
  }

  // Dark ceiling plate behind the strips
  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(maxX - minX + 1.5, maxZ - minZ + 1.5),
    new THREE.MeshBasicMaterial({
      color: 0x1a1a1a,
      side: THREE.DoubleSide,
      toneMapped: false,
    })
  );
  plate.rotation.x = Math.PI / 2;
  plate.position.y = 0.02;
  group.add(plate);

  group.rotation.x = Math.PI; // face downward toward the car
  group.position.set(0, 6.5, 0);
  return group;
}

/**
 * Studio lightformer scene: honeycomb detailing ceiling + soft side fills.
 * Inspired by car-detailing garage lights and nice_car_911 Environment.
 */
export function createStudioLightformerScene(): {
  scene: THREE.Scene;
} {
  const scene = new THREE.Scene();

  scene.add(createHoneycombCeiling({ intensity: 11, thickness: 0.07 }));

  // Soft side fill strips (subtle, not the main look)
  const sideMat = emissiveMaterial(2);
  const left = new THREE.Mesh(new THREE.PlaneGeometry(18, 0.4), sideMat);
  left.position.set(-7, 2.2, 0);
  left.rotation.y = Math.PI / 2;
  scene.add(left);

  const right = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 0.65),
    emissiveMaterial(1.5)
  );
  right.position.set(7, 2.5, 0);
  right.rotation.y = -Math.PI / 2;
  scene.add(right);

  const front = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 0.3),
    emissiveMaterial(1.75)
  );
  front.position.set(0, 3.5, -8);
  scene.add(front);

  // Dark garage backdrop
  const bg = new THREE.Mesh(
    new THREE.SphereGeometry(60, 64, 64),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        colorTop: { value: new THREE.Color("#2a2a2a") },
        colorBot: { value: new THREE.Color("#0a0a0a") },
      },
      vertexShader: /* glsl */ `
        varying vec3 vWorld;
        void main() {
          vec4 world = modelMatrix * vec4(position, 1.0);
          vWorld = world.xyz;
          gl_Position = projectionMatrix * viewMatrix * world;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 colorTop;
        uniform vec3 colorBot;
        varying vec3 vWorld;
        void main() {
          float h = clamp((vWorld.y + 10.0) / 40.0, 0.0, 1.0);
          gl_FragColor = vec4(mix(colorBot, colorTop, h), 1.0);
        }
      `,
    })
  );
  scene.add(bg);

  return { scene };
}

export function bakeStudioEnvironment(
  _renderer: THREE.WebGLRenderer,
  pmrem: THREE.PMREMGenerator,
  lightformerScene: THREE.Scene
): THREE.Texture {
  return pmrem.fromScene(lightformerScene, 0.04).texture;
}
