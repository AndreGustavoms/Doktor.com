import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

function createOfficialMarkGeometries() {
  const scale = .023;
  const x = (value) => (value - 268) * scale;
  const y = (value) => (256 - value) * scale;

  const stem = new THREE.Shape();
  stem.moveTo(x(96), y(320));
  stem.lineTo(x(172), y(320));
  stem.lineTo(x(172), y(96));
  stem.lineTo(x(96), y(96));
  stem.closePath();

  const dot = new THREE.Shape();
  const radius = 6 * scale;
  const left = x(96);
  const right = x(172);
  const top = y(344);
  const bottom = y(416);
  dot.moveTo(left + radius, bottom);
  dot.lineTo(right - radius, bottom);
  dot.quadraticCurveTo(right, bottom, right, bottom + radius);
  dot.lineTo(right, top - radius);
  dot.quadraticCurveTo(right, top, right - radius, top);
  dot.lineTo(left + radius, top);
  dot.quadraticCurveTo(left, top, left, top - radius);
  dot.lineTo(left, bottom + radius);
  dot.quadraticCurveTo(left, bottom, left + radius, bottom);
  dot.closePath();

  const bowl = new THREE.Shape();
  bowl.moveTo(x(198), y(96));
  bowl.lineTo(x(284), y(96));
  bowl.bezierCurveTo(x(372), y(96), x(440), y(162), x(440), y(256));
  bowl.bezierCurveTo(x(440), y(350), x(372), y(416), x(284), y(416));
  bowl.lineTo(x(198), y(416));
  bowl.lineTo(x(198), y(344));
  bowl.lineTo(x(282), y(344));
  bowl.bezierCurveTo(x(330), y(344), x(364), y(308), x(364), y(256));
  bowl.bezierCurveTo(x(364), y(204), x(330), y(168), x(282), y(168));
  bowl.lineTo(x(198), y(168));
  bowl.closePath();

  return [stem, dot, bowl].map((shape) => {
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 1.62,
      bevelEnabled: true,
      bevelSegments: 6,
      steps: 1,
      bevelSize: .12,
      bevelThickness: .18,
      curveSegments: 40,
    });
    geometry.computeBoundingBox();
    const bounds = geometry.boundingBox;
    geometry.translate(0, 0, -(bounds.max.z + bounds.min.z) / 2);
    geometry.computeVertexNormals();
    return geometry;
  });
}

function createGlowPlane() {
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      glowColor: { value: new THREE.Color(0x2f80ff) },
      intensity: { value: 1.15 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform vec3 glowColor;
      uniform float intensity;
      void main() {
        float distanceToCenter = distance(vUv, vec2(0.5));
        float alpha = smoothstep(0.5, 0.03, distanceToCenter);
        alpha = pow(alpha, 2.15) * intensity;
        gl_FragColor = vec4(glowColor, alpha * 0.42);
      }
    `,
  });

  const glow = new THREE.Mesh(new THREE.PlaneGeometry(13, 13), material);
  glow.position.z = -2.3;
  return glow;
}

function createOrbit(radius, tilt, rotation, opacity) {
  const geometry = new THREE.TorusGeometry(radius, .018, 8, 180);
  const material = new THREE.MeshBasicMaterial({
    color: 0x2f80ff,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const orbit = new THREE.Mesh(geometry, material);
  orbit.rotation.x = tilt;
  orbit.rotation.z = rotation;
  return orbit;
}

function createParticles() {
  const count = 48;
  const positions = new Float32Array(count * 3);

  for (let index = 0; index < count; index += 1) {
    const angle = index * 2.399963229728653;
    const radius = 4.4 + (index % 7) * .27;
    positions[index * 3] = Math.cos(angle) * radius;
    positions[index * 3 + 1] = Math.sin(angle) * radius * .73;
    positions[index * 3 + 2] = ((index % 9) - 4) * .28;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0x2f80ff,
    size: .055,
    transparent: true,
    opacity: .7,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  return new THREE.Points(geometry, material);
}

function disposeObject(object) {
  object.traverse((child) => {
    child.geometry?.dispose();
    if (Array.isArray(child.material)) child.material.forEach((material) => material.dispose());
    else child.material?.dispose();
  });
}

export function mountHero3D(stage) {
  const canvas = stage?.querySelector("[data-flux-canvas]");
  if (!stage || !canvas) return null;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
  } catch {
    stage.classList.add("webgl-failed");
    return null;
  }

  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.28;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, .1, 100);
  camera.position.set(0, .05, 18.2);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const roomEnvironment = new RoomEnvironment();
  const environmentTarget = pmrem.fromScene(roomEnvironment, .04);
  scene.environment = environmentTarget.texture;
  disposeObject(roomEnvironment);
  pmrem.dispose();

  const root = new THREE.Group();
  root.rotation.x = -.05;
  scene.add(root);

  const geometries = createOfficialMarkGeometries();
  const material = new THREE.MeshPhysicalMaterial({
    color: 0x1557e8,
    metalness: .18,
    roughness: .08,
    clearcoat: 1,
    clearcoatRoughness: .045,
    transmission: .23,
    thickness: 2.2,
    ior: 1.46,
    attenuationColor: new THREE.Color(0x0d3ebb),
    attenuationDistance: 4.8,
    emissive: new THREE.Color(0x001d78),
    emissiveIntensity: .42,
  });

  const letter = new THREE.Group();
  letter.rotation.y = -.32;
  root.add(letter);

  const edgeMaterial = new THREE.LineBasicMaterial({
    color: 0xb9e6ff,
    transparent: true,
    opacity: .68,
    blending: THREE.AdditiveBlending,
  });
  const edge = new THREE.Group();

  geometries.forEach((geometry) => {
    const piece = new THREE.Mesh(geometry, material);
    const outline = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 22), edgeMaterial);
    outline.scale.setScalar(1.006);
    edge.add(outline);
    letter.add(piece);
  });
  letter.add(edge);

  const ghostMaterial = new THREE.MeshBasicMaterial({
    color: 0x1557e8,
    wireframe: true,
    transparent: true,
    opacity: .055,
    depthWrite: false,
  });
  const ghost = new THREE.Group();
  geometries.forEach((geometry) => ghost.add(new THREE.Mesh(geometry.clone(), ghostMaterial)));
  ghost.scale.setScalar(1.13);
  ghost.position.z = -.7;
  ghost.rotation.y = -.32;
  root.add(ghost);

  const glow = createGlowPlane();
  root.add(glow);

  const orbitGroup = new THREE.Group();
  orbitGroup.add(
    createOrbit(5.05, 1.18, -.24, .5),
    createOrbit(4.35, .72, .46, .28),
    createOrbit(5.58, 1.48, -.72, .18),
  );
  root.add(orbitGroup);

  const particles = createParticles();
  root.add(particles);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x0d3ebb, 2.5));

  const keyLight = new THREE.DirectionalLight(0xffffff, 5.2);
  keyLight.position.set(-5, 7, 9);
  scene.add(keyLight);

  const cyanLight = new THREE.PointLight(0x2f80ff, 42, 28, 1.7);
  cyanLight.position.set(4, 1.8, 7);
  scene.add(cyanLight);

  const blueLight = new THREE.PointLight(0x0d3ebb, 34, 25, 1.8);
  blueLight.position.set(-4, -3, 5);
  scene.add(blueLight);

  let width = 0;
  let height = 0;
  let frame = 0;
  let inView = false;
  let lastTime = performance.now();
  let elapsed = 0;
  let scrollImpulse = 0;
  let previousScroll = scrollY;

  const render = () => renderer.render(scene, camera);

  const resize = () => {
    const bounds = canvas.getBoundingClientRect();
    const nextWidth = Math.max(1, Math.round(bounds.width));
    const nextHeight = Math.max(1, Math.round(bounds.height));
    if (nextWidth === width && nextHeight === height) return;

    width = nextWidth;
    height = nextHeight;
    const constrainedDevice = innerWidth < 700 || navigator.hardwareConcurrency <= 4;
    renderer.setPixelRatio(Math.min(devicePixelRatio, constrainedDevice ? 1.15 : 1.6));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    render();
  };

  const animate = (time) => {
    frame = 0;
    if (!inView || document.hidden || reducedMotion) return;

    const delta = Math.min((time - lastTime) / 1000, .05);
    lastTime = time;
    elapsed += delta;

    letter.rotation.y += delta * .42 + scrollImpulse * delta;
    letter.rotation.x = Math.sin(elapsed * .62) * .08;
    letter.rotation.z = Math.sin(elapsed * .38) * .035 + scrollImpulse * .012;
    edge.rotation.y = Math.sin(elapsed * .7) * .035;
    ghost.rotation.y -= delta * .12;
    orbitGroup.rotation.z += delta * .075;
    orbitGroup.rotation.y = Math.sin(elapsed * .2) * .15;
    particles.rotation.z -= delta * .035;
    particles.rotation.y += delta * .025;
    scrollImpulse *= Math.pow(.045, delta);

    render();
    frame = requestAnimationFrame(animate);
  };

  const syncAnimation = () => {
    const shouldRun = inView && !document.hidden && !reducedMotion;
    if (shouldRun && !frame) {
      lastTime = performance.now();
      frame = requestAnimationFrame(animate);
    } else if (!shouldRun && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  };

  const boostFromScroll = () => {
    const delta = scrollY - previousScroll;
    previousScroll = scrollY;
    scrollImpulse = THREE.MathUtils.clamp(scrollImpulse + delta * .018, -2.6, 2.6);
  };

  const visibilityObserver = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    syncAnimation();
  }, { rootMargin: "100px 0px", threshold: .02 });

  const resizeObserver = new ResizeObserver(resize);
  visibilityObserver.observe(stage);
  resizeObserver.observe(canvas);
  document.addEventListener("visibilitychange", syncAnimation);
  addEventListener("scroll", boostFromScroll, { passive: true });

  if (reducedMotion) {
    letter.rotation.set(.06, -.5, -.025);
    orbitGroup.rotation.z = .18;
  }

  resize();
  render();
  stage.classList.add("has-webgl");

  return () => {
    if (frame) cancelAnimationFrame(frame);
    visibilityObserver.disconnect();
    resizeObserver.disconnect();
    document.removeEventListener("visibilitychange", syncAnimation);
    removeEventListener("scroll", boostFromScroll);
    disposeObject(root);
    environmentTarget.dispose();
    renderer.dispose();
    stage.classList.remove("has-webgl");
  };
}
