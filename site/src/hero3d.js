import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

function createLetterD() {
  const shape = new THREE.Shape();
  shape.moveTo(-2.55, -4);
  shape.lineTo(-.05, -4);
  shape.bezierCurveTo(2.75, -4, 4.15, -2.2, 4.15, 0);
  shape.bezierCurveTo(4.15, 2.2, 2.75, 4, -.05, 4);
  shape.lineTo(-2.55, 4);
  shape.closePath();

  const hole = new THREE.Path();
  hole.moveTo(-.62, -2.22);
  hole.lineTo(-.62, 2.22);
  hole.lineTo(-.02, 2.22);
  hole.bezierCurveTo(1.42, 2.22, 2.12, 1.2, 2.12, 0);
  hole.bezierCurveTo(2.12, -1.2, 1.42, -2.22, -.02, -2.22);
  hole.closePath();
  shape.holes.push(hole);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 1.72,
    bevelEnabled: true,
    bevelSegments: 6,
    steps: 1,
    bevelSize: .2,
    bevelThickness: .24,
    curveSegments: 40,
  });

  geometry.computeBoundingBox();
  const bounds = geometry.boundingBox;
  geometry.translate(
    -(bounds.max.x + bounds.min.x) / 2,
    -(bounds.max.y + bounds.min.y) / 2,
    -(bounds.max.z + bounds.min.z) / 2,
  );
  geometry.computeVertexNormals();
  return geometry;
}

function createGlowPlane() {
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      glowColor: { value: new THREE.Color(0x0a73ff) },
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
    color: 0x1687ff,
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
    color: 0x1388ff,
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

  const geometry = createLetterD();
  const material = new THREE.MeshPhysicalMaterial({
    color: 0x0876ff,
    metalness: .18,
    roughness: .08,
    clearcoat: 1,
    clearcoatRoughness: .045,
    transmission: .23,
    thickness: 2.2,
    ior: 1.46,
    attenuationColor: new THREE.Color(0x075be8),
    attenuationDistance: 4.8,
    emissive: new THREE.Color(0x001d78),
    emissiveIntensity: .42,
  });

  const letter = new THREE.Mesh(geometry, material);
  letter.rotation.y = -.32;
  root.add(letter);

  const edgeMaterial = new THREE.LineBasicMaterial({
    color: 0xb9e6ff,
    transparent: true,
    opacity: .68,
    blending: THREE.AdditiveBlending,
  });
  const edge = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 22), edgeMaterial);
  edge.scale.setScalar(1.006);
  letter.add(edge);

  const ghostMaterial = new THREE.MeshBasicMaterial({
    color: 0x0a73ff,
    wireframe: true,
    transparent: true,
    opacity: .055,
    depthWrite: false,
  });
  const ghost = new THREE.Mesh(geometry.clone(), ghostMaterial);
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

  scene.add(new THREE.HemisphereLight(0xffffff, 0x08389d, 2.5));

  const keyLight = new THREE.DirectionalLight(0xffffff, 5.2);
  keyLight.position.set(-5, 7, 9);
  scene.add(keyLight);

  const cyanLight = new THREE.PointLight(0x62d7ff, 42, 28, 1.7);
  cyanLight.position.set(4, 1.8, 7);
  scene.add(cyanLight);

  const blueLight = new THREE.PointLight(0x064bff, 34, 25, 1.8);
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
