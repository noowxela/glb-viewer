import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import {
  disposeObject,
  frameObject,
  getGltfLoader,
} from "@/lib/gltf";

export type ModelSource =
  | { kind: "url"; url: string }
  | { kind: "file"; file: File };

export interface ViewerHandle {
  resetView: () => void;
  zoomBy: (factor: number) => void;
  setAutoRotate: (enabled: boolean) => void;
}

interface ModelViewerProps {
  source: ModelSource | null;
  autoRotate: boolean;
  onProgress?: (ratio: number) => void;
  onLoaded?: () => void;
  onError?: (message: string) => void;
  onReady?: (handle: ViewerHandle) => void;
}

export default function ModelViewer({
  source,
  autoRotate,
  onProgress,
  onLoaded,
  onError,
  onReady,
}: ModelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelRef = useRef<THREE.Object3D | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const clockRef = useRef(new THREE.Clock());
  const fittedPoseRef = useRef<{
    position: THREE.Vector3;
    target: THREE.Vector3;
  } | null>(null);
  const [sceneReady, setSceneReady] = useState(false);
  const callbacksRef = useRef({ onProgress, onLoaded, onError, onReady });

  callbacksRef.current = { onProgress, onLoaded, onError, onReady };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xeceff3);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      45,
      Math.max(container.clientWidth, 1) / Math.max(container.clientHeight, 1),
      0.1,
      1000
    );
    camera.position.set(3, 2, 5);
    cameraRef.current = camera;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        failIfMajorPerformanceCaveat: false,
      });
    } catch (error) {
      callbacksRef.current.onError?.(
        error instanceof Error
          ? error.message
          : "WebGL is not available in this browser"
      );
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    scene.add(new THREE.AmbientLight(0xffffff, 0.35));

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.15);
    keyLight.position.set(6, 10, 4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 50;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.35);
    fillLight.position.set(-6, 4, -2);
    scene.add(fillLight);

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(12, 64),
      new THREE.ShadowMaterial({ opacity: 0.18 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.001;
    ground.receiveShadow = true;
    scene.add(ground);

    const grid = new THREE.GridHelper(12, 24, 0xcbd5e1, 0xe2e8f0);
    grid.position.y = -0.002;
    scene.add(grid);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 0.4;
    controls.maxDistance = 80;
    controls.maxPolarAngle = Math.PI * 0.49;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 1.4;
    controlsRef.current = controls;

    const handle: ViewerHandle = {
      resetView: () => {
        const pose = fittedPoseRef.current;
        if (!pose || !cameraRef.current || !controlsRef.current) return;
        cameraRef.current.position.copy(pose.position);
        controlsRef.current.target.copy(pose.target);
        controlsRef.current.update();
      },
      zoomBy: (factor) => {
        if (!cameraRef.current || !controlsRef.current) return;
        const offset = cameraRef.current.position
          .clone()
          .sub(controlsRef.current.target);
        offset.multiplyScalar(factor);
        cameraRef.current.position.copy(
          controlsRef.current.target.clone().add(offset)
        );
        controlsRef.current.update();
      },
      setAutoRotate: (enabled) => {
        if (controlsRef.current) controlsRef.current.autoRotate = enabled;
      },
    };
    callbacksRef.current.onReady?.(handle);
    setSceneReady(true);

    const clock = clockRef.current;
    let frameId = 0;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      mixerRef.current?.update(delta);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      const width = Math.max(container.clientWidth, 1);
      const height = Math.max(container.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleResize);
      controls.dispose();
      pmrem.dispose();
      if (modelRef.current) {
        scene.remove(modelRef.current);
        disposeObject(modelRef.current);
        modelRef.current = null;
      }
      renderer.dispose();
      renderer.domElement.remove();
      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      controlsRef.current = null;
      setSceneReady(false);
    };
    // Scene is created once; autoRotate is synced separately.
  }, []);

  useEffect(() => {
    controlsRef.current && (controlsRef.current.autoRotate = autoRotate);
  }, [autoRotate]);

  useEffect(() => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!sceneReady || !scene || !camera || !controls) return;

    let cancelled = false;
    let objectUrl: string | null = null;

    const clearModel = () => {
      mixerRef.current?.stopAllAction();
      mixerRef.current = null;
      if (modelRef.current) {
        scene.remove(modelRef.current);
        disposeObject(modelRef.current);
        modelRef.current = null;
      }
    };

    if (!source) {
      clearModel();
      return;
    }

    const url =
      source.kind === "file"
        ? (objectUrl = URL.createObjectURL(source.file))
        : source.url;

    callbacksRef.current.onProgress?.(0);
    const loader = getGltfLoader();

    loader.load(
      url,
      (gltf) => {
        if (cancelled) {
          disposeObject(gltf.scene);
          return;
        }

        clearModel();
        const model = gltf.scene;
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        scene.add(model);
        modelRef.current = model;
        frameObject(camera, controls, model);
        fittedPoseRef.current = {
          position: camera.position.clone(),
          target: controls.target.clone(),
        };

        if (gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(model);
          for (const clip of gltf.animations) {
            mixer.clipAction(clip).play();
          }
          mixerRef.current = mixer;
        }

        callbacksRef.current.onProgress?.(1);
        callbacksRef.current.onLoaded?.();
      },
      (event) => {
        if (cancelled || !event.total) return;
        callbacksRef.current.onProgress?.(event.loaded / event.total);
      },
      (error) => {
        if (cancelled) return;
        const message =
          error instanceof Error && error.message
            ? error.message
            : typeof error === "object" &&
                error !== null &&
                "message" in error &&
                String((error as { message: unknown }).message)
              ? String((error as { message: unknown }).message)
              : "Failed to load GLB model";
        callbacksRef.current.onError?.(message);
      }
    );

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [source, sceneReady]);

  return <div ref={containerRef} className="h-full w-full touch-none" />;
}
