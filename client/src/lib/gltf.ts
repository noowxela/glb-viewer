import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

const ACCEPTED_EXTENSIONS = [".glb", ".gltf"];

let sharedLoader: GLTFLoader | null = null;

export function isGltfFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
}

export function getGltfLoader(): GLTFLoader {
  if (sharedLoader) return sharedLoader;

  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath(`${import.meta.env.BASE_URL}draco/`);

  const loader = new GLTFLoader();
  loader.setDRACOLoader(dracoLoader);
  loader.setMeshoptDecoder(MeshoptDecoder);
  sharedLoader = loader;
  return loader;
}

export function disposeObject(object: THREE.Object3D): void {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;

    child.geometry.dispose();
    const materials = Array.isArray(child.material)
      ? child.material
      : [child.material];
    for (const material of materials) {
      material.dispose();
    }
  });
}

export function frameObject(
  camera: THREE.PerspectiveCamera,
  controls: { target: THREE.Vector3; update: () => void },
  object: THREE.Object3D,
  offset = 1.55
): void {
  const box = new THREE.Box3().setFromObject(object);
  const center = box.getCenter(new THREE.Vector3());

  object.position.sub(center);

  const grounded = new THREE.Box3().setFromObject(object);
  object.position.y -= grounded.min.y;

  const framed = new THREE.Box3().setFromObject(object);
  const framedSize = framed.getSize(new THREE.Vector3());
  const maxDim = Math.max(framedSize.x, framedSize.y, framedSize.z, 0.001);
  const fov = camera.fov * (Math.PI / 180);
  const distance = (maxDim / 2 / Math.tan(fov / 2)) * offset;

  camera.near = Math.max(distance / 100, 0.01);
  camera.far = Math.max(distance * 100, 100);
  camera.position.set(distance * 0.85, distance * 0.45, distance);
  camera.updateProjectionMatrix();
  controls.target.set(0, framed.min.y + framedSize.y * 0.35, 0);
  controls.update();
}
