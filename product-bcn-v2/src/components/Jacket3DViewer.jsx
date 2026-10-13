import React, { useRef, useEffect, useState } from 'react';

// Use window.THREE loaded reliably from CDN or module fallback
function getThree() {
  if (typeof window !== 'undefined' && window.THREE) {
    return window.THREE;
  }
  return null;
}

export default function Jacket3DViewer({
  color = '#e2e6eb',
  accentColor = '#ffffff',
  roughness = 0.25,
  metalness = 0.65,
  autoRotateDefault = true,
  interactive = true,
  cameraDistance = 4.2,
  wireframe = false,
  showStand = true,
  height = '100%'
}) {
  const containerRef = useRef(null);
  const jacketGroupRef = useRef(null);
  const materialsRef = useRef([]);
  const stateRef = useRef({
    isDragging: false,
    prevX: 0,
    prevY: 0,
    rotX: 0.1,
    rotY: -0.2,
    targetRotX: 0.1,
    targetRotY: -0.2,
    zoom: cameraDistance,
    targetZoom: cameraDistance,
    autoRotate: autoRotateDefault,
    wireframe: wireframe,
  });

  const [isRotating, setIsRotating] = useState(autoRotateDefault);
  const [wire, setWire] = useState(wireframe);
  const [activeView, setActiveView] = useState('front');
  const [isLoaded, setIsLoaded] = useState(false);

  // Handle color change dynamically
  useEffect(() => {
    materialsRef.current.forEach((mat) => {
      if (mat && mat.name === 'mainShell') {
        mat.color.set(color);
      } else if (mat && mat.name === 'accent') {
        mat.color.set(accentColor);
      }
    });
  }, [color, accentColor]);

  // Handle wireframe
  useEffect(() => {
    materialsRef.current.forEach((mat) => {
      if (mat) mat.wireframe = wire;
    });
  }, [wire]);

  useEffect(() => {
    stateRef.current.autoRotate = isRotating;
  }, [isRotating]);

  useEffect(() => {
    const THREE = getThree();
    const container = containerRef.current;
    if (!container) return;

    if (!THREE) {
      // If THREE is not immediately loaded, wait briefly
      const checkInterval = setInterval(() => {
        if (window.THREE) {
          clearInterval(checkInterval);
          setIsLoaded(true);
        }
      }, 50);
      return () => clearInterval(checkInterval);
    }

    let width = container.clientWidth || 400;
    let heightPx = container.clientHeight || 450;

    // 1. Scene setup
    const scene = new THREE.Scene();

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(40, width / heightPx, 0.1, 100);
    camera.position.set(0, 0.35, cameraDistance);

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, heightPx);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    if (renderer.toneMapping !== undefined) {
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.35;
    }
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(3.5, 4.5, 4.5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x7090ff, 1.3);
    fillLight.position.set(-4, 2, -3);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 2.0);
    rimLight.position.set(0, 4, -4);
    scene.add(rimLight);

    const bottomGlow = new THREE.PointLight(0x00ffcc, 1.2, 8);
    bottomGlow.position.set(0, -1.8, 1);
    scene.add(bottomGlow);

    // 5. Build Jacket 3D Geometry
    const jacketGroup = new THREE.Group();
    jacketGroupRef.current = jacketGroup;
    scene.add(jacketGroup);

    // Materials
    const shellMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness: roughness,
      metalness: metalness,
      wireframe: wire,
      name: 'mainShell'
    });

    const darkInnerMat = new THREE.MeshStandardMaterial({
      color: 0x14161b,
      roughness: 0.6,
      metalness: 0.2,
      wireframe: wire,
      name: 'inner'
    });

    const zipperMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.95,
      roughness: 0.1,
      wireframe: wire,
      name: 'accent'
    });

    const strapMat = new THREE.MeshStandardMaterial({
      color: 0x0a0c10,
      roughness: 0.8,
      metalness: 0.1,
      wireframe: wire,
      name: 'strap'
    });

    const neonDetailMat = new THREE.MeshBasicMaterial({
      color: 0x00ffcc,
      wireframe: wire,
      name: 'neon'
    });

    materialsRef.current = [shellMat, darkInnerMat, zipperMat, strapMat, neonDetailMat];

    // Puffer jacket segmented torso
    const puffLayers = 6;
    const torsoYStart = 0.7;
    const layerH = 0.24;

    for (let i = 0; i < puffLayers; i++) {
      const t = i / (puffLayers - 1);
      const rx = 0.52 + Math.sin(t * Math.PI) * 0.12 - (t > 0.7 ? (t - 0.7) * 0.1 : 0);
      const rz = 0.34 + Math.sin(t * Math.PI) * 0.08;

      const ringGeom = new THREE.TorusGeometry((rx + rz) * 0.5, 0.13, 18, 36);
      const ring = new THREE.Mesh(ringGeom, shellMat);
      ring.scale.set(rx / ((rx + rz) * 0.5), rz / ((rx + rz) * 0.5), 1);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = torsoYStart - i * layerH;
      jacketGroup.add(ring);
    }

    // Inner Body filler
    const innerGeom = new THREE.CylinderGeometry(0.44, 0.42, 1.4, 28);
    const innerBody = new THREE.Mesh(innerGeom, darkInnerMat);
    innerBody.position.y = 0.1;
    jacketGroup.add(innerBody);

    // High Puffer Collar
    const collarGeom = new THREE.TorusGeometry(0.28, 0.13, 16, 32, Math.PI * 1.85);
    const collar = new THREE.Mesh(collarGeom, shellMat);
    collar.rotation.x = Math.PI / 2;
    collar.rotation.z = Math.PI * 0.075;
    collar.position.set(0, 0.92, 0);
    jacketGroup.add(collar);

    // Front Metal Zipper Track
    const zipGeom = new THREE.BoxGeometry(0.035, 1.45, 0.02);
    const zipMesh = new THREE.Mesh(zipGeom, zipperMat);
    zipMesh.position.set(0, 0.12, 0.42);
    jacketGroup.add(zipMesh);

    // Zipper Slider Tag
    const sliderGeom = new THREE.BoxGeometry(0.06, 0.12, 0.04);
    const slider = new THREE.Mesh(sliderGeom, zipperMat);
    slider.position.set(0, 0.45, 0.44);
    jacketGroup.add(slider);

    // Tactical Chest Patch / Flap
    const patchGeom = new THREE.BoxGeometry(0.22, 0.14, 0.03);
    const chestPatch = new THREE.Mesh(patchGeom, strapMat);
    chestPatch.position.set(-0.25, 0.42, 0.38);
    chestPatch.rotation.y = 0.25;
    jacketGroup.add(chestPatch);

    // Neon technical line on patch
    const lineGeom = new THREE.BoxGeometry(0.16, 0.015, 0.04);
    const neonLine = new THREE.Mesh(lineGeom, neonDetailMat);
    neonLine.position.set(-0.25, 0.42, 0.395);
    neonLine.rotation.y = 0.25;
    jacketGroup.add(neonLine);

    // Tactical Utility Pocket Right
    const pocketGeom = new THREE.BoxGeometry(0.22, 0.26, 0.08);
    const rightPocket = new THREE.Mesh(pocketGeom, strapMat);
    rightPocket.position.set(0.26, -0.25, 0.36);
    rightPocket.rotation.y = -0.22;
    jacketGroup.add(rightPocket);

    // Puff Sleeves (Left & Right segmented puffy pods)
    const createSleeve = (isLeft = true) => {
      const sleeveGroup = new THREE.Group();
      const sign = isLeft ? -1 : 1;
      const numPods = 5;

      for (let j = 0; j < numPods; j++) {
        const podT = j / (numPods - 1);
        const radius = 0.16 - podT * 0.035;
        const podGeom = new THREE.SphereGeometry(radius, 16, 16);
        const pod = new THREE.Mesh(podGeom, shellMat);
        pod.scale.set(1.15, 1.35, 1.15);

        const angle = 0.48;
        const len = j * 0.26;
        pod.position.set(
          sign * (0.55 + Math.sin(angle) * len),
          0.7 - Math.cos(angle) * len,
          Math.sin(podT * 0.4) * 0.08
        );
        sleeveGroup.add(pod);
      }

      // Elastic Cuff
      const cuffGeom = new THREE.CylinderGeometry(0.1, 0.09, 0.12, 16);
      const cuff = new THREE.Mesh(cuffGeom, strapMat);
      cuff.position.set(sign * 1.12, -0.38, 0.04);
      cuff.rotation.z = sign * -0.48;
      sleeveGroup.add(cuff);

      return sleeveGroup;
    };

    jacketGroup.add(createSleeve(true));
    jacketGroup.add(createSleeve(false));

    // Stand / Holographic Pedestal
    if (showStand) {
      const ringFloorGeom = new THREE.RingGeometry(0.85, 0.95, 48);
      const ringFloorMat = new THREE.MeshBasicMaterial({ color: 0x333b4d, side: THREE.DoubleSide });
      const ringFloor = new THREE.Mesh(ringFloorGeom, ringFloorMat);
      ringFloor.rotation.x = Math.PI / 2;
      ringFloor.position.y = -0.9;
      jacketGroup.add(ringFloor);

      const centerDiscGeom = new THREE.CylinderGeometry(0.65, 0.75, 0.04, 32);
      const centerDisc = new THREE.Mesh(centerDiscGeom, strapMat);
      centerDisc.position.y = -0.92;
      jacketGroup.add(centerDisc);
    }

    // 6. Interaction Handlers
    const state = stateRef.current;

    const onPointerDown = (e) => {
      if (!interactive) return;
      state.isDragging = true;
      state.prevX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      state.prevY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
      state.autoRotate = false;
      setIsRotating(false);
    };

    const onPointerMove = (e) => {
      if (!state.isDragging) return;
      const curX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      const curY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
      const dx = curX - state.prevX;
      const dy = curY - state.prevY;

      state.targetRotY += dx * 0.008;
      state.targetRotX += dy * 0.006;
      state.targetRotX = Math.max(-0.6, Math.min(0.7, state.targetRotX));

      state.prevX = curX;
      state.prevY = curY;
    };

    const onPointerUp = () => {
      state.isDragging = false;
    };

    const onWheel = (e) => {
      if (!interactive) return;
      e.preventDefault();
      state.targetZoom += e.deltaY * 0.0025;
      state.targetZoom = Math.max(2.6, Math.min(6.5, state.targetZoom));
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    dom.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    // 7. Animation Loop
    let reqId;
    let clock = new THREE.Clock();

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      if (state.autoRotate) {
        state.targetRotY += delta * 0.55;
      }

      state.rotY += (state.targetRotY - state.rotY) * 0.1;
      state.rotX += (state.targetRotX - state.rotX) * 0.1;
      state.zoom += (state.targetZoom - state.zoom) * 0.1;

      jacketGroup.rotation.y = state.rotY;
      jacketGroup.rotation.x = state.rotX;

      // Subtle breathing float
      jacketGroup.position.y = Math.sin(clock.getElapsedTime() * 1.5) * 0.04;

      camera.position.z = state.zoom;
      renderer.render(scene, camera);
    };

    animate();

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w && h) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener('resize', onResize);
      dom.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      dom.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
      dom.removeEventListener('wheel', onWheel);
      renderer.dispose();
      if (container && dom.parentNode === container) {
        container.removeChild(dom);
      }
    };
  }, [cameraDistance, interactive, showStand, isLoaded]);

  const setPresetView = (view) => {
    setActiveView(view);
    const state = stateRef.current;
    state.autoRotate = false;
    setIsRotating(false);
    state.targetRotX = 0.05;

    if (view === 'front') {
      state.targetRotY = 0;
    } else if (view === 'side') {
      state.targetRotY = Math.PI / 2;
    } else if (view === 'back') {
      state.targetRotY = Math.PI;
    } else if (view === 'angle') {
      state.targetRotY = -Math.PI / 4;
      state.targetRotX = 0.2;
    }
  };

  const toggleAutoRotate = () => {
    setIsRotating(!isRotating);
    stateRef.current.autoRotate = !isRotating;
  };

  const toggleWireframe = () => {
    setWire(!wire);
    stateRef.current.wireframe = !wire;
  };

  const resetView = () => {
    const state = stateRef.current;
    state.targetRotX = 0.1;
    state.targetRotY = -0.2;
    state.targetZoom = cameraDistance;
    setPresetView('front');
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: height, minHeight: '340px' }}>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          cursor: interactive ? 'grab' : 'default',
          touchAction: 'none'
        }}
        title="Kéo chuột để xoay 360°, cuộn để phóng to / thu nhỏ"
      />

      {/* Interactive HUD Overlays */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          display: 'flex',
          gap: '6px',
          flexWrap: 'wrap',
          zIndex: 5,
          pointerEvents: 'auto'
        }}
      >
        <span
          style={{
            fontSize: '10px',
            letterSpacing: '0.12em',
            background: 'rgba(5, 5, 6, 0.85)',
            border: '1px solid #2a2d35',
            padding: '4px 8px',
            color: '#00ffcc',
            fontFamily: "'Share Tech Mono', monospace",
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00ffcc', display: 'inline-block' }}></span>
          3D ENGINE ONLINE · CONTROL READY
        </span>
      </div>

      {/* Preset view angle buttons */}
      <div
        style={{
          position: 'absolute',
          bottom: '14px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '6px',
          background: 'rgba(5, 5, 6, 0.88)',
          padding: '6px 8px',
          border: '1px solid #2a2d35',
          borderRadius: '2px',
          zIndex: 5,
          backdropFilter: 'blur(8px)'
        }}
      >
        <button
          type="button"
          onClick={() => setPresetView('front')}
          style={{
            padding: '4px 8px',
            fontSize: '10px',
            fontFamily: "'Share Tech Mono', monospace",
            background: activeView === 'front' ? '#e9ecf2' : 'transparent',
            color: activeView === 'front' ? '#000' : '#e9ecf2',
            border: '1px solid #2a2d35',
            cursor: 'pointer'
          }}
        >
          Front
        </button>
        <button
          type="button"
          onClick={() => setPresetView('side')}
          style={{
            padding: '4px 8px',
            fontSize: '10px',
            fontFamily: "'Share Tech Mono', monospace",
            background: activeView === 'side' ? '#e9ecf2' : 'transparent',
            color: activeView === 'side' ? '#000' : '#e9ecf2',
            border: '1px solid #2a2d35',
            cursor: 'pointer'
          }}
        >
          Side
        </button>
        <button
          type="button"
          onClick={() => setPresetView('back')}
          style={{
            padding: '4px 8px',
            fontSize: '10px',
            fontFamily: "'Share Tech Mono', monospace",
            background: activeView === 'back' ? '#e9ecf2' : 'transparent',
            color: activeView === 'back' ? '#000' : '#e9ecf2',
            border: '1px solid #2a2d35',
            cursor: 'pointer'
          }}
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => setPresetView('angle')}
          style={{
            padding: '4px 8px',
            fontSize: '10px',
            fontFamily: "'Share Tech Mono', monospace",
            background: activeView === 'angle' ? '#e9ecf2' : 'transparent',
            color: activeView === 'angle' ? '#000' : '#e9ecf2',
            border: '1px solid #2a2d35',
            cursor: 'pointer'
          }}
        >
          3/4 View
        </button>
      </div>

      {/* Control Tools Top Right */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          zIndex: 5
        }}
      >
        <button
          type="button"
          onClick={toggleAutoRotate}
          title="Tự động xoay 360°"
          style={{
            padding: '5px 8px',
            fontSize: '10px',
            fontFamily: "'Share Tech Mono', monospace",
            background: isRotating ? '#e9ecf2' : 'rgba(5, 5, 6, 0.85)',
            color: isRotating ? '#000' : '#e9ecf2',
            border: '1px solid #2a2d35',
            cursor: 'pointer'
          }}
        >
          {isRotating ? '❚❚ Auto 360' : '▶ Auto 360'}
        </button>
        <button
          type="button"
          onClick={toggleWireframe}
          title="Bật/Tắt lưới polygon kỹ thuật"
          style={{
            padding: '5px 8px',
            fontSize: '10px',
            fontFamily: "'Share Tech Mono', monospace",
            background: wire ? '#00ffcc' : 'rgba(5, 5, 6, 0.85)',
            color: wire ? '#000' : '#e9ecf2',
            border: '1px solid #2a2d35',
            cursor: 'pointer'
          }}
        >
          Wireframe
        </button>
        <button
          type="button"
          onClick={resetView}
          title="Đặt lại góc nhìn ban đầu"
          style={{
            padding: '5px 8px',
            fontSize: '10px',
            fontFamily: "'Share Tech Mono', monospace",
            background: 'rgba(5, 5, 6, 0.85)',
            color: '#e9ecf2',
            border: '1px solid #2a2d35',
            cursor: 'pointer'
          }}
        >
          Reset
        </button>
      </div>

      {/* Hint footer */}
      <div
        style={{
          position: 'absolute',
          bottom: '50px',
          right: '14px',
          fontSize: '9px',
          fontFamily: "'Share Tech Mono', monospace",
          color: '#6f7480',
          letterSpacing: '0.08em',
          pointerEvents: 'none'
        }}
      >
        DRAG TO ROTATE · SCROLL TO ZOOM
      </div>
    </div>
  );
}
