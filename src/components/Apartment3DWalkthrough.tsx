import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Bath,
  BedDouble,
  ChefHat,
  Compass,
  DoorOpen,
  Layers,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sofa,
  Sun,
  Utensils,
  View,
} from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { buildFlatRoomGraph } from '../data/venturesData';
import {
  FlatUnit,
  FloorData,
  PanoramaViewpoint,
  RoomId,
  RoomNode,
  VentureProject,
} from '../types/property';
import { Panorama360Viewer } from './Panorama360Viewer';

interface Apartment3DWalkthroughProps {
  project: VentureProject;
  floor: FloorData;
  flat: FlatUnit;
  viewpoints: PanoramaViewpoint[];
}

// Module-level pre-allocated vectors (Zero GC inside render frame loop)
const _tmpDir = new THREE.Vector3();
const _tmpTarget = new THREE.Vector3();

function RoomIcon({ roomId, className }: { roomId: RoomId; className?: string }) {
  const cls = className || 'w-3.5 h-3.5';
  switch (roomId) {
    case 'corridor':
      return <DoorOpen className={cls} />;
    case 'main-hall':
      return <Sofa className={cls} />;
    case 'dining-area':
      return <Utensils className={cls} />;
    case 'kitchen':
      return <ChefHat className={cls} />;
    case 'bedroom-1':
    case 'bedroom-2':
    case 'master-bedroom':
      return <BedDouble className={cls} />;
    case 'attached-bathroom':
      return <Bath className={cls} />;
    case 'balcony':
      return <Sun className={cls} />;
    default:
      return <DoorOpen className={cls} />;
  }
}

export function Apartment3DWalkthrough({
  project,
  floor,
  flat,
  viewpoints,
}: Apartment3DWalkthroughProps) {
  const roomGraph = useMemo(() => buildFlatRoomGraph(flat), [flat]);
  const [currentRoomId, setCurrentRoomId] = useState<RoomId>('corridor');
  const [viewMode, setViewMode] = useState<'walkthrough' | 'plan3d'>('walkthrough');
  const [explore360Mode, setExplore360Mode] = useState(false);
  const [activePanoId, setActivePanoId] = useState(
    flat.panoramaViewpointId || viewpoints[0]?.id || ''
  );
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mountRef = useRef<HTMLDivElement | null>(null);

  const currentRoom: RoomNode = useMemo(
    () => roomGraph.find((r) => r.id === currentRoomId) || roomGraph[0],
    [roomGraph, currentRoomId]
  );

  // Sync initial room and viewpoint when selected flat changes
  useEffect(() => {
    setCurrentRoomId('corridor');
    setViewMode('walkthrough');
    setExplore360Mode(false);
    setActivePanoId(flat.panoramaViewpointId || viewpoints[0]?.id || '');
  }, [flat.id, flat.panoramaViewpointId, viewpoints]);

  // Camera & Three.js refs so React navigation glides smoothly without rebuilding WebGL
  const camRef = useRef({
    posX: currentRoom.position[0],
    posY: currentRoom.position[1],
    posZ: currentRoom.position[2],
    targetPosX: currentRoom.position[0],
    targetPosY: currentRoom.position[1],
    targetPosZ: currentRoom.position[2],
    yaw: 0,
    targetYaw: 0,
    pitch: -0.05,
    targetPitch: -0.05,
    isPlan3D: false,
    planOrbitAngle: 0.45,
    isDragging: false,
    lastX: 0,
    lastY: 0,
  });

  const threeRef = useRef<{
    requestRender: () => void;
    ceilingsGroup: THREE.Group | null;
  }>({
    requestRender: () => {},
    ceilingsGroup: null,
  });

  // Update camera target smoothly when room or viewMode changes
  useEffect(() => {
    const c = camRef.current;
    if (viewMode === 'plan3d') {
      c.isPlan3D = true;
      if (threeRef.current.ceilingsGroup) {
        threeRef.current.ceilingsGroup.visible = false;
      }
    } else {
      c.isPlan3D = false;
      if (threeRef.current.ceilingsGroup) {
        threeRef.current.ceilingsGroup.visible = true;
      }
      c.targetPosX = currentRoom.position[0];
      c.targetPosY = currentRoom.position[1];
      c.targetPosZ = currentRoom.position[2];

      const dx = currentRoom.lookAt[0] - currentRoom.position[0];
      const dy = currentRoom.lookAt[1] - currentRoom.position[1];
      const dz = currentRoom.lookAt[2] - currentRoom.position[2];
      c.targetYaw = Math.atan2(-dx, -dz);
      const horiz = Math.sqrt(dx * dx + dz * dz) || 1;
      c.targetPitch = THREE.MathUtils.clamp(Math.atan2(dy, horiz), -0.55, 0.55);
    }
    threeRef.current.requestRender();
  }, [currentRoom, viewMode]);

  // Build Three.js 3D Apartment Geometry whenever flat configuration or floor changes
  useEffect(() => {
    if (explore360Mode) return;
    const mount = mountRef.current;
    if (!mount) return;

    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    const width = mount.clientWidth || 960;
    const height = mount.clientHeight || 520;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(flat.floorNumber === 0 ? 0xddebe8 : 0xd3e6ec);
    scene.fog = new THREE.Fog(flat.floorNumber === 0 ? 0xddebe8 : 0xd3e6ec, 18, 46);

    const camera = new THREE.PerspectiveCamera(62, width / height, 0.1, 80);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);

    mount.innerHTML = '';
    mount.appendChild(renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmrem.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmrem.dispose();

    // Lighting tailored to flat facing orientation
    const hemiLight = new THREE.HemisphereLight(0xfff9f0, 0xd8cfc2, 0.72);
    scene.add(hemiLight);

    const sunAngleMap: Record<string, [number, number, number]> = {
      N: [4, 11, -12],
      NE: [10, 12, -10],
      E: [12, 11, 2],
      SE: [10, 12, 10],
      S: [2, 12, 12],
      SW: [-10, 11, 10],
      W: [-12, 10, 2],
      NW: [-10, 11, -10],
    };
    const [sx, sy, sz] = sunAngleMap[flat.facing] || [8, 12, -10];
    const dirLight = new THREE.DirectionalLight(0xfff4e0, 1.35);
    dirLight.position.set(sx, sy, sz);
    if (!isSoftwareGl) {
      dirLight.castShadow = true;
      dirLight.shadow.mapSize.set(1024, 1024);
      dirLight.shadow.camera.near = 2;
      dirLight.shadow.camera.far = 36;
      dirLight.shadow.camera.left = -10;
      dirLight.shadow.camera.right = 10;
      dirLight.shadow.camera.top = 10;
      dirLight.shadow.camera.bottom = -10;
    }
    scene.add(dirLight);

    const fillLight = new THREE.PointLight(0xffebd1, 0.85, 16);
    fillLight.position.set(-0.5, 2.7, 0.5);
    scene.add(fillLight);

    // Track disposable geometries & materials
    const disposables: { dispose: () => void }[] = [];
    const track = <T extends { dispose: () => void }>(res: T): T => {
      disposables.push(res);
      return res;
    };

    // Shared architectural PBR palette
    const matOakFloor = track(
      new THREE.MeshStandardMaterial({ color: 0xc9a378, roughness: 0.52, metalness: 0.04 })
    );
    const matMarbleFloor = track(
      new THREE.MeshStandardMaterial({ color: 0xebe6dd, roughness: 0.28, metalness: 0.06 })
    );
    const matCorridorTile = track(
      new THREE.MeshStandardMaterial({ color: 0xd6cfc4, roughness: 0.55, metalness: 0.05 })
    );
    const matWall = track(
      new THREE.MeshStandardMaterial({ color: 0xf6f2ea, roughness: 0.88 })
    );
    const matAccentWall = track(
      new THREE.MeshStandardMaterial({ color: 0x0e3a3d, roughness: 0.72 })
    );
    const matWoodTrim = track(
      new THREE.MeshStandardMaterial({ color: 0x8a613c, roughness: 0.45 })
    );
    const matTealFabric = track(
      new THREE.MeshStandardMaterial({ color: 0x0d9488, roughness: 0.82 })
    );
    const matCreamFabric = track(
      new THREE.MeshStandardMaterial({ color: 0xeae2d4, roughness: 0.86 })
    );
    const matMauveFabric = track(
      new THREE.MeshStandardMaterial({ color: 0x8d6a7b, roughness: 0.84 })
    );
    const matBrass = track(
      new THREE.MeshStandardMaterial({ color: 0xb9935a, roughness: 0.28, metalness: 0.75 })
    );
    const matGlass = track(
      new THREE.MeshStandardMaterial({
        color: 0xaad8de,
        roughness: 0.08,
        metalness: 0.1,
        transparent: true,
        opacity: 0.34,
      })
    );
    const matDarkMetal = track(
      new THREE.MeshStandardMaterial({ color: 0x243336, roughness: 0.4, metalness: 0.55 })
    );
    const matFoliage = track(
      new THREE.MeshStandardMaterial({ color: 0x3b6e52, roughness: 0.85 })
    );

    const addBox = (
      parent: THREE.Object3D,
      w: number,
      h: number,
      d: number,
      x: number,
      y: number,
      z: number,
      mat: THREE.Material,
      castShadow = false
    ) => {
      const geo = track(new THREE.BoxGeometry(w, h, d));
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      mesh.receiveShadow = true;
      mesh.castShadow = castShadow && !isSoftwareGl;
      parent.add(mesh);
      return mesh;
    };

    const aptGroup = new THREE.Group();
    scene.add(aptGroup);

    // 1. Floor slabs (Apartment footprint ~14m x 11m + Corridor + Balcony)
    addBox(aptGroup, 13.8, 0.16, 10.6, 0, -0.08, 0.6, matOakFloor);
    // Corridor marble runner
    addBox(aptGroup, 2.4, 0.02, 4.4, -5.4, 0.01, 3.6, matCorridorTile);
    // Kitchen & Bath marble tile zones
    addBox(aptGroup, 3.6, 0.02, 3.6, 4.5, 0.01, -2.5, matMarbleFloor);
    addBox(aptGroup, 3.0, 0.02, 2.8, 5.1, 0.01, 4.8, matMarbleFloor);
    // Balcony deck slab
    addBox(aptGroup, 5.4, 0.14, 2.3, -0.6, -0.06, -4.75, matCorridorTile);

    // 2. Ceilings group (hidden cleanly in 3D Plan Cutaway mode)
    const ceilingsGroup = new THREE.Group();
    addBox(ceilingsGroup, 13.8, 0.14, 10.6, 0, 3.05, 0.6, matWall);
    aptGroup.add(ceilingsGroup);
    threeRef.current.ceilingsGroup = ceilingsGroup;

    // 3. Exterior & Partition Walls (with doorways aligned to camera paths)
    const wallH = 2.95;
    const wallY = wallH / 2;

    // Outer perimeter walls
    addBox(aptGroup, 0.16, wallH, 10.6, -6.9, wallY, 0.6, matWall); // West exterior
    addBox(aptGroup, 0.16, wallH, 10.6, 6.9, wallY, 0.6, matWall);  // East exterior
    addBox(aptGroup, 13.8, wallH, 0.16, 0, wallY, 5.9, matWall);   // South exterior

    // North facade (with wide glass sliding doors opening to Balcony at x=-0.6)
    addBox(aptGroup, 3.6, wallH, 0.16, -5.1, wallY, -4.65, matWall);
    addBox(aptGroup, 3.8, wallH, 0.16, 5.0, wallY, -4.65, matWall);
    addBox(aptGroup, 5.4, 0.45, 0.16, -0.6, 2.72, -4.65, matWall); // Slider header
    addBox(aptGroup, 5.2, 2.45, 0.05, -0.6, 1.24, -4.65, matGlass); // Balcony slider glass
    // Balcony glass balustrade
    addBox(aptGroup, 5.4, 1.05, 0.06, -0.6, 0.52, -5.85, matGlass);
    addBox(aptGroup, 5.4, 0.06, 0.08, -0.6, 1.06, -5.85, matDarkMetal);
    addBox(aptGroup, 0.06, 1.05, 2.3, -3.3, 0.52, -4.75, matGlass);
    addBox(aptGroup, 0.06, 1.05, 2.3, 2.1, 0.52, -4.75, matGlass);

    // Corridor partition (separating arrival corridor at x=-5.4, z=3.6 from living & bedrooms)
    addBox(aptGroup, 0.14, wallH, 2.4, -3.6, wallY, 4.7, matWoodTrim);
    addBox(aptGroup, 1.8, wallH, 0.14, -5.9, wallY, 2.2, matWall);

    // Bedroom 1 West Wing partition (x=-3.4, doorway into Main Hall)
    addBox(aptGroup, 0.14, wallH, 2.6, -3.4, wallY, -3.35, matWall);
    addBox(aptGroup, 2.0, wallH, 0.14, -5.8, wallY, -0.35, matWall);

    // Master Bedroom & Attached Bathroom East/South Wing partitions
    addBox(aptGroup, 0.14, wallH, 3.0, 2.4, wallY, 4.4, matWall);
    addBox(aptGroup, 2.8, wallH, 0.14, 5.5, wallY, 2.0, matWall);
    addBox(aptGroup, 1.8, wallH, 0.14, 5.9, wallY, 4.15, matWall);

    // 4. Furnishing: Main Hall
    // Area rug
    addBox(aptGroup, 3.6, 0.02, 2.8, -0.6, 0.015, -0.2, matCreamFabric);
    // Sectional sofa
    addBox(aptGroup, 2.6, 0.42, 0.95, -0.6, 0.21, 0.9, matCreamFabric, true);
    addBox(aptGroup, 2.6, 0.38, 0.22, -0.6, 0.58, 1.28, matCreamFabric, true);
    addBox(aptGroup, 0.95, 0.42, 1.5, 0.22, 0.21, 0.2, matCreamFabric, true);
    // Accent cushions
    addBox(aptGroup, 0.36, 0.3, 0.16, -1.2, 0.55, 1.08, matTealFabric);
    addBox(aptGroup, 0.36, 0.3, 0.16, -0.5, 0.55, 1.08, matMauveFabric);
    // Oak coffee table
    addBox(aptGroup, 1.25, 0.06, 0.72, -0.8, 0.36, -0.35, matWoodTrim, true);
    addBox(aptGroup, 0.18, 0.34, 0.45, -0.8, 0.17, -0.35, matWoodTrim);
    // Media feature wall & oak console
    addBox(aptGroup, 0.12, 2.9, 3.0, -3.28, 1.45, -0.8, matAccentWall);
    addBox(aptGroup, 0.48, 0.45, 2.2, -3.0, 0.225, -0.8, matWoodTrim, true);
    addBox(aptGroup, 0.06, 0.85, 1.48, -3.18, 1.38, -0.8, matDarkMetal);

    // 5. Furnishing: Dining Area & Kitchen
    // Dining table & chairs
    addBox(aptGroup, 1.75, 0.06, 0.96, 3.0, 0.76, 0.4, matWoodTrim, true);
    addBox(aptGroup, 0.12, 0.74, 0.12, 2.35, 0.37, 0.05, matDarkMetal);
    addBox(aptGroup, 0.12, 0.74, 0.12, 3.65, 0.37, 0.75, matDarkMetal);
    for (const cx of [2.5, 3.5]) {
      addBox(aptGroup, 0.42, 0.44, 0.42, cx, 0.22, -0.3, matTealFabric, true);
      addBox(aptGroup, 0.42, 0.44, 0.42, cx, 0.22, 1.1, matTealFabric, true);
    }
    // Marble Kitchen Island & Cabinetry
    addBox(aptGroup, 2.2, 0.92, 0.92, 4.4, 0.46, -2.0, matMarbleFloor, true);
    addBox(aptGroup, 2.24, 0.06, 0.96, 4.4, 0.94, -2.0, matWall);
    addBox(aptGroup, 0.65, 2.4, 3.2, 6.45, 1.2, -2.6, matWoodTrim, true);
    addBox(aptGroup, 2.8, 0.92, 0.65, 4.8, 0.46, -4.15, matWall, true);
    // Brass pendant lamps over island
    addBox(aptGroup, 0.16, 0.2, 0.16, 3.9, 2.2, -2.0, matBrass);
    addBox(aptGroup, 0.16, 0.2, 0.16, 4.9, 2.2, -2.0, matBrass);

    // 6. Furnishing: Bedroom 1 (North-West Suite)
    addBox(aptGroup, 1.85, 0.42, 2.1, -5.5, 0.21, -3.2, matCreamFabric, true);
    addBox(aptGroup, 1.95, 1.1, 0.14, -5.5, 0.65, -4.25, matAccentWall, true);
    addBox(aptGroup, 0.45, 0.45, 0.45, -6.6, 0.22, -4.0, matWoodTrim);
    addBox(aptGroup, 0.6, 2.3, 1.6, -6.5, 1.15, -1.6, matWoodTrim, true);

    // 7. Conditional Bedroom 2 (ONLY rendered when flat has >= 3 bedrooms, e.g., 3 BHK / 4 BHK)
    const hasBedroom2 = flat.bedrooms >= 3;
    if (hasBedroom2) {
      addBox(aptGroup, 1.75, 0.42, 2.0, -5.5, 0.21, 0.9, matCreamFabric, true);
      addBox(aptGroup, 1.85, 1.05, 0.14, -6.55, 0.62, 0.9, matMauveFabric, true);
      addBox(aptGroup, 0.45, 0.45, 0.45, -6.4, 0.22, 1.85, matWoodTrim);
    } else {
      // For 2 BHK layouts: open reading lounge / study alcove instead of Bedroom 2
      addBox(aptGroup, 1.4, 0.74, 0.65, -5.8, 0.37, 0.85, matWoodTrim, true);
      addBox(aptGroup, 0.55, 0.44, 0.55, -5.8, 0.22, 1.5, matTealFabric, true);
    }

    // 8. Furnishing: Master Bedroom & Attached Bathroom
    addBox(aptGroup, 2.1, 0.46, 2.2, 5.1, 0.23, 3.2, matCreamFabric, true);
    addBox(aptGroup, 2.25, 1.2, 0.16, 6.45, 0.7, 3.2, matAccentWall, true);
    addBox(aptGroup, 0.5, 0.48, 0.5, 6.25, 0.24, 2.0, matWoodTrim);
    addBox(aptGroup, 0.5, 0.48, 0.5, 6.25, 0.24, 4.4, matWoodTrim);
    // Attached Bathroom vanity & glass walk-in shower
    addBox(aptGroup, 1.5, 0.86, 0.55, 4.5, 0.43, 5.5, matWoodTrim, true);
    addBox(aptGroup, 1.52, 0.06, 0.58, 4.5, 0.88, 5.5, matMarbleFloor);
    addBox(aptGroup, 1.3, 1.05, 0.04, 4.5, 1.65, 5.75, matGlass);
    addBox(aptGroup, 0.05, 2.2, 1.35, 5.65, 1.1, 5.1, matGlass);

    // 9. Balcony outdoor lounge & floor-altitude-aware exterior vista
    addBox(aptGroup, 0.75, 0.4, 0.75, -1.9, 0.2, -5.15, matTealFabric, true);
    addBox(aptGroup, 0.75, 0.4, 0.75, 0.7, 0.2, -5.15, matTealFabric, true);
    addBox(aptGroup, 0.38, 0.46, 0.38, -2.85, 0.23, -5.25, matWoodTrim);
    addBox(aptGroup, 0.34, 0.65, 0.34, -2.85, 0.78, -5.25, matFoliage);

    // Exterior backdrop adjusted by floor height (Ground = lush courtyard trees, Higher = airy skyline blocks)
    const groundDropY = -(flat.floorNumber * 3.1 + 0.6);
    addBox(aptGroup, 60, 0.2, 60, 0, groundDropY, -14, matFoliage);
    const horizonBlocks = [
      [-14, -18, 6, 12],
      [-5, -22, 8, 16],
      [8, -20, 7, 14],
      [17, -17, 6, 10],
    ];
    for (const [bx, bz, bw, bh] of horizonBlocks) {
      addBox(aptGroup, bw, bh, 5, bx, groundDropY + bh / 2, bz, matCorridorTile);
    }

    let frameId = 0;
    let renderBusy = false;
    let renderDirty = false;
    let lastTime = performance.now();
    let disposed = false;

    const afterDraw = (cb: () => void) => {
      if (disposed) return;
      try {
        const gl = renderer.getContext() as WebGL2RenderingContext;
        if (!gl || typeof gl.fenceSync !== 'function') {
          frameId = window.setTimeout(cb, 80);
          return;
        }
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (disposed) return;
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 80);
          }
        };
        frameId = window.setTimeout(poll, 5);
      } catch {
        frameId = window.setTimeout(cb, 80);
      }
    };

    const requestRender = () => {
      if (disposed) return;
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      frameId = requestAnimationFrame((now) => {
        if (disposed) return;
        const dt = Math.min((now - lastTime) / 1000, 0.1);
        lastTime = now;
        renderDirty = false;

        const c = camRef.current;
        const dampSpeed = isSoftwareGl ? 18 : 9;

        if (c.isPlan3D) {
          const orbitRadius = 15.5;
          const goalX = Math.sin(c.planOrbitAngle) * orbitRadius;
          const goalZ = Math.cos(c.planOrbitAngle) * orbitRadius;
          const goalY = 12.5;
          c.posX = THREE.MathUtils.damp(c.posX, goalX, dampSpeed, dt);
          c.posY = THREE.MathUtils.damp(c.posY, goalY, dampSpeed, dt);
          c.posZ = THREE.MathUtils.damp(c.posZ, goalZ, dampSpeed, dt);
          camera.position.set(c.posX, c.posY, c.posZ);
          _tmpTarget.set(0, 0.5, 0.5);
          camera.lookAt(_tmpTarget);
        } else {
          c.posX = THREE.MathUtils.damp(c.posX, c.targetPosX, dampSpeed, dt);
          c.posY = THREE.MathUtils.damp(c.posY, c.targetPosY, dampSpeed, dt);
          c.posZ = THREE.MathUtils.damp(c.posZ, c.targetPosZ, dampSpeed, dt);
          c.yaw = THREE.MathUtils.damp(c.yaw, c.targetYaw, dampSpeed * 1.2, dt);
          c.pitch = THREE.MathUtils.damp(c.pitch, c.targetPitch, dampSpeed * 1.2, dt);

          camera.position.set(c.posX, c.posY, c.posZ);
          _tmpDir.set(
            -Math.sin(c.yaw) * Math.cos(c.pitch),
            Math.sin(c.pitch),
            -Math.cos(c.yaw) * Math.cos(c.pitch)
          );
          _tmpTarget.copy(camera.position).add(_tmpDir);
          camera.lookAt(_tmpTarget);
        }

        renderer.render(scene, camera);

        const settling = c.isPlan3D
          ? Math.abs(c.posY - 12.5) > 0.05
          : Math.abs(c.posX - c.targetPosX) > 0.02 ||
            Math.abs(c.posZ - c.targetPosZ) > 0.02 ||
            Math.abs(c.yaw - c.targetYaw) > 0.008 ||
            Math.abs(c.pitch - c.targetPitch) > 0.008;

        const done = () => {
          renderBusy = false;
          if (renderDirty || settling) requestRender();
        };

        if (isSoftwareGl) afterDraw(done);
        else done();
      });
    };

    threeRef.current.requestRender = requestRender;

    const handleResize = () => {
      if (!mount || disposed) return;
      const w = mount.clientWidth || 640;
      const h = mount.clientHeight || 420;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      requestRender();
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(mount);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      cancelAnimationFrame(frameId);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);

    requestRender();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      envTarget.dispose();
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
    };
  }, [flat.id, flat.bedrooms, flat.floorNumber, flat.facing, explore360Mode]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button, a')) return;
    camRef.current.isDragging = true;
    camRef.current.lastX = e.clientX;
    camRef.current.lastY = e.clientY;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!camRef.current.isDragging) return;
    const dx = e.clientX - camRef.current.lastX;
    const dy = e.clientY - camRef.current.lastY;
    camRef.current.lastX = e.clientX;
    camRef.current.lastY = e.clientY;

    if (camRef.current.isPlan3D) {
      camRef.current.planOrbitAngle -= dx * 0.008;
    } else {
      camRef.current.targetYaw += dx * 0.0045;
      camRef.current.targetPitch = THREE.MathUtils.clamp(
        camRef.current.targetPitch - dy * 0.0038,
        -0.65,
        0.55
      );
    }
    threeRef.current.requestRender();
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    camRef.current.isDragging = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const toggleFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      try {
        await el.requestFullscreen?.();
        setIsFullscreen(true);
      } catch {
        setIsFullscreen(false);
      }
    } else {
      await document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  if (explore360Mode && viewpoints.length > 0) {
    return (
      <Panorama360Viewer
        projectName={`${project.name} · Flat ${flat.flatNumber}`}
        viewpoints={viewpoints}
        activeViewpointId={activePanoId}
        onSelectViewpoint={setActivePanoId}
        onExitPanorama={() => setExplore360Mode(false)}
      />
    );
  }

  // Group navigation targets cleanly by directionHint
  const forwardNav = currentRoom.navTargets.find((n) => n.directionHint === 'forward');
  const backNav = currentRoom.navTargets.find((n) => n.directionHint === 'back');
  const leftNav = currentRoom.navTargets.find((n) => n.directionHint === 'left');
  const rightNav = currentRoom.navTargets.find((n) => n.directionHint === 'right');

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-xl overflow-hidden border border-[#0E3A3D]/15 bg-[#0B292C]"
    >
      {/* Top Minimal HUD */}
      <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[#0E3A3D] text-white border-b border-white/10">
        {/* Room Identification Badge with Icon (Rule 5D) */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 text-xs font-semibold text-white">
            <RoomIcon roomId={currentRoom.id} className="w-4 h-4 text-[#14B8A6]" />
            <span>{currentRoom.label}</span>
          </div>
          <span className="hidden sm:inline text-xs text-white/75 truncate">
            Flat {flat.flatNumber} · {flat.bhkConfig} · {floor.floorLabel}
          </span>
        </div>

        {/* Mode Switches + Single 360° Explore Trigger */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('walkthrough')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              viewMode === 'walkthrough'
                ? 'bg-[#0D9488] text-white'
                : 'bg-white/10 text-white/80 hover:bg-white/20'
            }`}
          >
            <View className="w-3.5 h-3.5" />
            <span>Walkthrough</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('plan3d')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              viewMode === 'plan3d'
                ? 'bg-[#0D9488] text-white'
                : 'bg-white/10 text-white/80 hover:bg-white/20'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>3D Plan</span>
          </button>

          {viewpoints.some((v) => v.mediaType === 'equirectangular-image') && (
            <button
              type="button"
              onClick={() => setExplore360Mode(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white text-[#0E3A3D] hover:bg-[#FAF7F2] text-xs font-semibold transition-colors cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5 text-[#0D9488]" />
              <span>360° Explore</span>
            </button>
          )}

          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            className="p-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Main 3D WebGL Canvas Stage */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="relative w-full h-[420px] sm:h-[500px] lg:h-[540px] select-none touch-none cursor-grab active:cursor-grabbing overflow-hidden"
      >
        <div ref={mountRef} className="absolute inset-0 w-full h-full" />

        {/* Directional Arrow Navigation Overlay (Rule 5B & 5C: Strictly separates Corridor Arrival vs Interior Room navigation, zero popups) */}
        {viewMode === 'walkthrough' && (
          <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-4">
            {/* Corridor Arrival Hint vs Interior Connected Arrows */}
            {!currentRoom.isInteriorRoom ? (
              <div className="flex flex-col items-center gap-3 mt-auto mb-12">
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {leftNav && (
                    <button
                      type="button"
                      onClick={() => setCurrentRoomId(leftNav.targetRoomId)}
                      className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0E3A3D]/95 hover:bg-[#0D9488] text-white border border-white/20 text-xs font-semibold shadow-lg transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4 text-[#14B8A6]" />
                      <RoomIcon roomId={leftNav.targetRoomId} className="w-3.5 h-3.5" />
                      <span>{leftNav.label}</span>
                    </button>
                  )}
                  {forwardNav && (
                    <button
                      type="button"
                      onClick={() => setCurrentRoomId(forwardNav.targetRoomId)}
                      className="pointer-events-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0D9488] hover:bg-[#0E3A3D] text-white border border-white/25 text-xs font-semibold shadow-lg transition-colors cursor-pointer"
                    >
                      <ArrowUp className="w-4 h-4" />
                      <RoomIcon roomId={forwardNav.targetRoomId} className="w-3.5 h-3.5" />
                      <span>Enter {forwardNav.label}</span>
                    </button>
                  )}
                  {rightNav && (
                    <button
                      type="button"
                      onClick={() => setCurrentRoomId(rightNav.targetRoomId)}
                      className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0E3A3D]/95 hover:bg-[#0D9488] text-white border border-white/20 text-xs font-semibold shadow-lg transition-colors cursor-pointer"
                    >
                      <RoomIcon roomId={rightNav.targetRoomId} className="w-3.5 h-3.5" />
                      <span>{rightNav.label}</span>
                      <ArrowRight className="w-4 h-4 text-[#14B8A6]" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Inside an interior room: main corridor entry cluster is hidden; only connected interior arrows appear */
              <>
                <div className="flex justify-center">
                  {forwardNav && (
                    <button
                      type="button"
                      onClick={() => setCurrentRoomId(forwardNav.targetRoomId)}
                      className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0E3A3D]/92 hover:bg-[#0D9488] text-white border border-white/20 text-xs font-semibold shadow-lg transition-colors cursor-pointer"
                    >
                      <ArrowUp className="w-4 h-4 text-[#14B8A6]" />
                      <RoomIcon roomId={forwardNav.targetRoomId} className="w-3.5 h-3.5" />
                      <span>{forwardNav.label}</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div>
                    {leftNav && (
                      <button
                        type="button"
                        onClick={() => setCurrentRoomId(leftNav.targetRoomId)}
                        className="pointer-events-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#0E3A3D]/92 hover:bg-[#0D9488] text-white border border-white/20 text-xs font-semibold shadow-lg transition-colors cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4 text-[#14B8A6]" />
                        <RoomIcon roomId={leftNav.targetRoomId} className="w-3.5 h-3.5" />
                        <span>{leftNav.label}</span>
                      </button>
                    )}
                  </div>

                  <div>
                    {rightNav && (
                      <button
                        type="button"
                        onClick={() => setCurrentRoomId(rightNav.targetRoomId)}
                        className="pointer-events-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#0E3A3D]/92 hover:bg-[#0D9488] text-white border border-white/20 text-xs font-semibold shadow-lg transition-colors cursor-pointer"
                      >
                        <RoomIcon roomId={rightNav.targetRoomId} className="w-3.5 h-3.5" />
                        <span>{rightNav.label}</span>
                        <ArrowRight className="w-4 h-4 text-[#14B8A6]" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex justify-center">
                  {backNav && (
                    <button
                      type="button"
                      onClick={() => setCurrentRoomId(backNav.targetRoomId)}
                      className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0E3A3D]/92 hover:bg-[#0D9488] text-white border border-white/20 text-xs font-semibold shadow-lg transition-colors cursor-pointer"
                    >
                      <ArrowDown className="w-4 h-4 text-[#14B8A6]" />
                      <RoomIcon roomId={backNav.targetRoomId} className="w-3.5 h-3.5" />
                      <span>{backNav.label}</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Reset Look Trigger in 3D Plan Mode */}
        {viewMode === 'plan3d' && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#0E3A3D]/95 text-white border border-white/15 text-xs shadow-lg">
            <span>Drag horizontally to orbit ·</span>
            <button
              type="button"
              onClick={() => setViewMode('walkthrough')}
              className="inline-flex items-center gap-1 text-[#14B8A6] font-semibold hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Resume Room Walk</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
