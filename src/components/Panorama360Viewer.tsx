import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Compass,
  MapPin,
  Maximize2,
  Minimize2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { DirectionKey, PanoramaViewpoint } from '../types/property';

interface Panorama360ViewerProps {
  projectName: string;
  viewpoints: PanoramaViewpoint[];
  activeViewpointId: string;
  onSelectViewpoint: (id: string) => void;
  onExitPanorama?: () => void;
}

function headingToCardinal(deg: number): DirectionKey {
  const normalized = ((deg % 360) + 360) % 360;
  if (normalized >= 337.5 || normalized < 22.5) return 'N';
  if (normalized < 67.5) return 'NE';
  if (normalized < 112.5) return 'E';
  if (normalized < 157.5) return 'SE';
  if (normalized < 202.5) return 'S';
  if (normalized < 247.5) return 'SW';
  if (normalized < 292.5) return 'W';
  return 'NW';
}

export function Panorama360Viewer({
  projectName,
  viewpoints,
  activeViewpointId,
  onSelectViewpoint,
  onExitPanorama,
}: Panorama360ViewerProps) {
  const activeViewpoint = useMemo(
    () => viewpoints.find((v) => v.id === activeViewpointId) || viewpoints[0],
    [viewpoints, activeViewpointId]
  );

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasMountRef = useRef<HTMLDivElement | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cssFullscreenFallback, setCssFullscreenFallback] = useState(false);
  const [headingDeg, setHeadingDeg] = useState(0);
  const [fovDisplay, setFovDisplay] = useState(72);
  const [isLoadingMedia, setIsLoadingMedia] = useState(true);
  const [mediaError, setMediaError] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [streetPan, setStreetPan] = useState({ x: 0, y: 0, scale: 1.04 });

  const camStateRef = useRef({
    yaw: 0,
    targetYaw: 0,
    pitch: 0,
    targetPitch: 0,
    fov: 72,
    targetFov: 72,
    isDragging: false,
    lastX: 0,
    lastY: 0,
    compassOffset: 0,
  });

  const threeRefs = useRef<{
    renderer: THREE.WebGLRenderer | null;
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    mesh: THREE.Mesh | null;
    texture: THREE.Texture | null;
    videoEl: HTMLVideoElement | null;
    requestRender: () => void;
  }>({
    renderer: null,
    scene: null,
    camera: null,
    mesh: null,
    texture: null,
    videoEl: null,
    requestRender: () => {},
  });

  const isTrue360 =
    activeViewpoint?.mediaType === 'equirectangular-image' ||
    activeViewpoint?.mediaType === 'equirectangular-video';

  useEffect(() => {
    const mount = canvasMountRef.current;
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
    const height = mount.clientHeight || 540;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b292c);

    const camera = new THREE.PerspectiveCamera(72, width / height, 0.1, 200);
    camera.position.set(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);

    mount.innerHTML = '';
    mount.appendChild(renderer.domElement);

    const geometry = new THREE.SphereGeometry(50, 64, 48);
    geometry.scale(-1, 1, 1);

    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const sphereMesh = new THREE.Mesh(geometry, material);
    scene.add(sphereMesh);

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

        const st = camStateRef.current;
        const damping = isSoftwareGl ? 24 : 14;
        st.yaw = THREE.MathUtils.damp(st.yaw, st.targetYaw, damping, dt);
        st.pitch = THREE.MathUtils.damp(st.pitch, st.targetPitch, damping, dt);
        st.fov = THREE.MathUtils.damp(st.fov, st.targetFov, damping, dt);

        if (Math.abs(camera.fov - st.fov) > 0.05) {
          camera.fov = st.fov;
          camera.updateProjectionMatrix();
        }

        const phi = THREE.MathUtils.degToRad(90 - st.pitch);
        const theta = THREE.MathUtils.degToRad(st.yaw);
        const lookX = 50 * Math.sin(phi) * Math.sin(theta);
        const lookY = 50 * Math.cos(phi);
        const lookZ = -50 * Math.sin(phi) * Math.cos(theta);
        camera.lookAt(lookX, lookY, lookZ);

        renderer.render(scene, camera);

        const rawDeg = (st.yaw + st.compassOffset) % 360;
        setHeadingDeg(Math.round(((rawDeg % 360) + 360) % 360));

        const stillSettling =
          Math.abs(st.yaw - st.targetYaw) > 0.08 ||
          Math.abs(st.pitch - st.targetPitch) > 0.08 ||
          Math.abs(st.fov - st.targetFov) > 0.08 ||
          threeRefs.current.videoEl !== null;

        const done = () => {
          renderBusy = false;
          if (renderDirty || stillSettling) {
            requestRender();
          }
        };

        if (isSoftwareGl) afterDraw(done);
        else done();
      });
    };

    threeRefs.current.renderer = renderer;
    threeRefs.current.scene = scene;
    threeRefs.current.camera = camera;
    threeRefs.current.mesh = sphereMesh;
    threeRefs.current.requestRender = requestRender;

    const handleResize = () => {
      if (!mount || disposed) return;
      const w = mount.clientWidth || 640;
      const h = mount.clientHeight || 400;
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
      if (threeRefs.current.texture) {
        threeRefs.current.texture.dispose();
        threeRefs.current.texture = null;
      }
      if (threeRefs.current.videoEl) {
        threeRefs.current.videoEl.pause();
        threeRefs.current.videoEl.src = '';
        threeRefs.current.videoEl = null;
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    if (!activeViewpoint) return;

    camStateRef.current.yaw = activeViewpoint.initialYawDeg;
    camStateRef.current.targetYaw = activeViewpoint.initialYawDeg;
    camStateRef.current.pitch = 0;
    camStateRef.current.targetPitch = 0;
    camStateRef.current.compassOffset = activeViewpoint.compassOffsetDeg;
    setHeadingDeg(
      ((activeViewpoint.initialYawDeg + activeViewpoint.compassOffsetDeg) % 360 + 360) % 360
    );

    if (!isTrue360) {
      setIsLoadingMedia(false);
      setMediaError(false);
      setStreetPan({ x: 0, y: 0, scale: 1.04 });
      return;
    }

    const { mesh, renderer, requestRender } = threeRefs.current;
    if (!mesh || !renderer) return;

    setIsLoadingMedia(true);
    setMediaError(false);

    if (threeRefs.current.texture) {
      threeRefs.current.texture.dispose();
      threeRefs.current.texture = null;
    }
    if (threeRefs.current.videoEl) {
      threeRefs.current.videoEl.pause();
      threeRefs.current.videoEl.src = '';
      threeRefs.current.videoEl = null;
    }

    let cancelled = false;

    if (activeViewpoint.mediaType === 'equirectangular-video') {
      const video = document.createElement('video');
      video.src = activeViewpoint.mediaUrl;
      video.crossOrigin = 'anonymous';
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.onloadeddata = () => {
        if (cancelled) return;
        const vidTex = new THREE.VideoTexture(video);
        vidTex.colorSpace = THREE.SRGBColorSpace;
        const mat = mesh.material as THREE.MeshBasicMaterial;
        mat.map = vidTex;
        mat.needsUpdate = true;
        threeRefs.current.texture = vidTex;
        threeRefs.current.videoEl = video;
        setIsLoadingMedia(false);
        video.play().catch(() => {});
        requestRender();
      };
      video.onerror = () => {
        if (cancelled) return;
        setIsLoadingMedia(false);
        setMediaError(true);
      };
    } else {
      const loader = new THREE.TextureLoader();
      loader.load(
        activeViewpoint.mediaUrl,
        (tex) => {
          if (cancelled) {
            tex.dispose();
            return;
          }
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
          const mat = mesh.material as THREE.MeshBasicMaterial;
          mat.map = tex;
          mat.needsUpdate = true;
          threeRefs.current.texture = tex;
          setIsLoadingMedia(false);
          requestRender();
        },
        undefined,
        () => {
          if (cancelled) return;
          setIsLoadingMedia(false);
          setMediaError(true);
        }
      );
    }

    return () => {
      cancelled = true;
    };
  }, [activeViewpoint, isTrue360]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button, a')) return;
    camStateRef.current.isDragging = true;
    camStateRef.current.lastX = e.clientX;
    camStateRef.current.lastY = e.clientY;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!camStateRef.current.isDragging) return;
    const dx = e.clientX - camStateRef.current.lastX;
    const dy = e.clientY - camStateRef.current.lastY;
    camStateRef.current.lastX = e.clientX;
    camStateRef.current.lastY = e.clientY;

    if (isTrue360) {
      const sensitivity = camStateRef.current.fov / 420;
      camStateRef.current.targetYaw -= dx * sensitivity;
      camStateRef.current.targetPitch = THREE.MathUtils.clamp(
        camStateRef.current.targetPitch + dy * sensitivity,
        -68,
        68
      );
      threeRefs.current.requestRender();
    } else {
      setStreetPan((prev) => ({
        ...prev,
        x: THREE.MathUtils.clamp(prev.x + dx * 0.45, -140, 140),
        y: THREE.MathUtils.clamp(prev.y + dy * 0.35, -70, 70),
      }));
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    camStateRef.current.isDragging = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handleZoom = useCallback(
    (delta: number) => {
      if (isTrue360) {
        const nextFov = THREE.MathUtils.clamp(
          camStateRef.current.targetFov + delta,
          35,
          100
        );
        camStateRef.current.targetFov = nextFov;
        setFovDisplay(Math.round(nextFov));
        threeRefs.current.requestRender();
      } else {
        setStreetPan((prev) => ({
          ...prev,
          scale: THREE.MathUtils.clamp(prev.scale - delta * 0.015, 1, 2.2),
        }));
      }
    },
    [isTrue360]
  );

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (Math.abs(e.deltaY) < 4) return;
    handleZoom(e.deltaY > 0 ? 5 : -5);
  };

  const handleResetView = () => {
    if (!activeViewpoint) return;
    if (isTrue360) {
      camStateRef.current.targetYaw = activeViewpoint.initialYawDeg;
      camStateRef.current.targetPitch = 0;
      camStateRef.current.targetFov = 72;
      setFovDisplay(72);
      threeRefs.current.requestRender();
    } else {
      setStreetPan({ x: 0, y: 0, scale: 1.04 });
    }
  };

  const handleNavigateViewpoint = (targetId?: string) => {
    if (!targetId) return;
    setTransitioning(true);
    setTimeout(() => {
      onSelectViewpoint(targetId);
      setTimeout(() => setTransitioning(false), 160);
    }, 100);
  };

  const toggleFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement && !cssFullscreenFallback) {
      try {
        if (el.requestFullscreen) {
          await el.requestFullscreen();
          setIsFullscreen(true);
          return;
        }
      } catch {
        // Fallback to CSS overlay fullscreen
      }
      setCssFullscreenFallback(true);
      setIsFullscreen(true);
    } else {
      if (document.fullscreenElement) {
        await document.exitFullscreen().catch(() => {});
      }
      setCssFullscreenFallback(false);
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
        setCssFullscreenFallback(false);
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const cardinal = headingToCardinal(headingDeg);
  const conn = activeViewpoint?.connections || {};
  const hasAnyLink = Boolean(
    conn.forwardId || conn.backwardId || conn.leftId || conn.rightId
  );

  return (
    <div
      ref={containerRef}
      className={
        cssFullscreenFallback
          ? 'fixed inset-0 z-50 bg-[#0B292C] flex flex-col'
          : 'relative w-full rounded-xl overflow-hidden border border-[#0E3A3D]/15 bg-[#0B292C]'
      }
    >
      {/* Top Minimal HUD Strip */}
      <div className="relative z-20 flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2.5 bg-[#0E3A3D] text-white border-b border-white/10">
        <div className="flex items-center gap-2.5 min-w-0">
          <Compass className="w-4 h-4 text-[#14B8A6] shrink-0" />
          <span className="text-xs sm:text-sm font-semibold truncate">
            {activeViewpoint?.title || projectName}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 text-xs font-mono tabular-nums"
            title="Live Viewing Direction"
          >
            <span>{cardinal}</span>
            <span className="text-white/70">{headingDeg}°</span>
          </div>

          {onExitPanorama && (
            <button
              type="button"
              onClick={onExitPanorama}
              className="px-2.5 py-1.5 rounded-md bg-[#0D9488] hover:bg-[#14B8A6] text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              Back to 3D Model
            </button>
          )}

          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Exit fullscreen view' : 'Enter fullscreen view'}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-colors cursor-pointer"
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Main Viewing Stage */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={handleWheel}
        className={`relative w-full select-none touch-none cursor-grab active:cursor-grabbing overflow-hidden ${
          cssFullscreenFallback ? 'flex-1 min-h-0' : 'h-[400px] sm:h-[480px] lg:h-[540px]'
        }`}
      >
        <div
          ref={canvasMountRef}
          className={`absolute inset-0 w-full h-full transition-opacity duration-200 ${
            isTrue360 ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        />

        {!isTrue360 && activeViewpoint && (
          <div className="absolute inset-0 w-full h-full overflow-hidden bg-[#0B292C]">
            <img
              src={activeViewpoint.mediaUrl}
              alt={activeViewpoint.title}
              referrerPolicy="no-referrer"
              draggable={false}
              style={{
                transform: `translate3d(${streetPan.x}px, ${streetPan.y}px, 0) scale(${streetPan.scale})`,
              }}
              className="w-full h-full object-cover transition-transform duration-150 ease-out"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#0B292C]/80 to-transparent" />
          </div>
        )}

        <div
          className={`pointer-events-none absolute inset-0 bg-[#0B292C] transition-opacity duration-200 ${
            transitioning ? 'opacity-70' : 'opacity-0'
          }`}
        />

        {isLoadingMedia && isTrue360 && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0B292C]/85 text-white text-sm">
            Loading panoramic view…
          </div>
        )}
        {mediaError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0B292C] text-white p-6 text-center">
            <MapPin className="w-7 h-7 text-[#14B8A6] mb-2" />
            <p className="text-sm font-medium">Unable to load panoramic asset</p>
          </div>
        )}

        {/* Clean Directional Arrow Navigation Overlay (No Info Popups) */}
        {hasAnyLink && (
          <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-3 sm:p-4">
            <div className="flex justify-center">
              {conn.forwardId && (
                <button
                  type="button"
                  onClick={() => handleNavigateViewpoint(conn.forwardId)}
                  className="pointer-events-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#0E3A3D]/90 hover:bg-[#0D9488] text-white border border-white/20 text-xs font-medium transition-colors cursor-pointer shadow-md"
                >
                  <ArrowUp className="w-4 h-4 text-[#14B8A6]" />
                  <span className="whitespace-nowrap">
                    {conn.forwardLabel || 'Forward'}
                  </span>
                </button>
              )}
            </div>

            <div className="flex items-center justify-between gap-2">
              <div>
                {conn.leftId && (
                  <button
                    type="button"
                    onClick={() => handleNavigateViewpoint(conn.leftId)}
                    className="pointer-events-auto inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-[#0E3A3D]/90 hover:bg-[#0D9488] text-white border border-white/20 text-xs font-medium transition-colors cursor-pointer shadow-md"
                  >
                    <ArrowLeft className="w-4 h-4 text-[#14B8A6]" />
                    <span className="hidden sm:inline whitespace-nowrap">
                      {conn.leftLabel || 'Left'}
                    </span>
                  </button>
                )}
              </div>

              <div>
                {conn.rightId && (
                  <button
                    type="button"
                    onClick={() => handleNavigateViewpoint(conn.rightId)}
                    className="pointer-events-auto inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-[#0E3A3D]/90 hover:bg-[#0D9488] text-white border border-white/20 text-xs font-medium transition-colors cursor-pointer shadow-md"
                  >
                    <span className="hidden sm:inline whitespace-nowrap">
                      {conn.rightLabel || 'Right'}
                    </span>
                    <ArrowRight className="w-4 h-4 text-[#14B8A6]" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex justify-center mb-12 sm:mb-14">
              {conn.backwardId && (
                <button
                  type="button"
                  onClick={() => handleNavigateViewpoint(conn.backwardId)}
                  className="pointer-events-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#0E3A3D]/90 hover:bg-[#0D9488] text-white border border-white/20 text-xs font-medium transition-colors cursor-pointer shadow-md"
                >
                  <ArrowDown className="w-4 h-4 text-[#14B8A6]" />
                  <span className="whitespace-nowrap">
                    {conn.backwardLabel || 'Back'}
                  </span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Compact Bottom Control Dock */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0E3A3D]/95 border border-white/15 text-white shadow-lg">
          <button
            type="button"
            onClick={() => handleZoom(-10)}
            aria-label="Zoom in"
            className="p-1.5 rounded hover:bg-white/15 transition-colors cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono tabular-nums px-1 text-white/80">
            {isTrue360 ? `${fovDisplay}°` : `${Math.round(streetPan.scale * 100)}%`}
          </span>
          <button
            type="button"
            onClick={() => handleZoom(10)}
            aria-label="Zoom out"
            className="p-1.5 rounded hover:bg-white/15 transition-colors cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="w-px h-4 bg-white/15 mx-0.5" aria-hidden="true" />
          <button
            type="button"
            onClick={handleResetView}
            aria-label="Reset view"
            className="inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-white/15 text-xs font-medium transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
}
