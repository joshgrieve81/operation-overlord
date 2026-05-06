import './style.css';
import * as THREE from 'three';
import gsap from 'gsap';

const canvas = document.querySelector('#webgl');
const hudBar = document.querySelector('.meter span');
const hudValue = document.querySelector('.hud-value');
const cursorDot = document.querySelector('.cursor-dot');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0b0b08, 0.055);

const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 120);
camera.position.set(0, 0.4, 12);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const root = new THREE.Group();
scene.add(root);

const ambient = new THREE.AmbientLight(0xf0eadb, 1.25);
scene.add(ambient);
const keyLight = new THREE.PointLight(0xe8c873, 13, 50, 1.8);
keyLight.position.set(-3, 4, 6);
scene.add(keyLight);
const coolLight = new THREE.PointLight(0x9fb4ff, 7, 44, 2);
coolLight.position.set(5, -2, -4);
scene.add(coolLight);

const palette = [0xddd8ca, 0xb7b0a2, 0x7f817d, 0xe8c873, 0x9fb4ff];
const cards = [];
const cardGeometry = new THREE.PlaneGeometry(1, 1, 10, 10);
const lineMaterial = new THREE.LineBasicMaterial({ color: 0xede8dc, transparent: true, opacity: 0.22 });

function makeCardLabel(index) {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#d7d1c4';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = index % 4 === 0 ? '#11110e' : '#3a3832';
  ctx.globalAlpha = 0.18;
  for (let i = 0; i < 9; i++) {
    const w = 80 + Math.random() * 420;
    ctx.fillRect(54, 58 + i * 42, w, 9 + Math.random() * 12);
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = 'rgba(17,17,14,.36)';
  ctx.lineWidth = 2;
  ctx.strokeRect(24, 24, canvas.width - 48, canvas.height - 48);
  ctx.fillStyle = 'rgba(17,17,14,.76)';
  ctx.font = '700 24px ui-sans-serif, system-ui';
  ctx.letterSpacing = '6px';
  ctx.fillText(`CASE ${String(index + 1).padStart(2, '0')}`, 54, 454);
  return new THREE.CanvasTexture(canvas);
}

for (let i = 0; i < 34; i++) {
  const aspect = 0.72 + Math.random() * 0.92;
  const material = new THREE.MeshStandardMaterial({
    color: palette[i % palette.length],
    roughness: 0.78,
    metalness: 0.04,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.82,
    map: makeCardLabel(i)
  });
  const mesh = new THREE.Mesh(cardGeometry, material);
  const angle = (i / 34) * Math.PI * 2;
  const ring = 5.2 + (i % 7) * 0.58 + Math.random() * 1.6;
  const y = (Math.random() - 0.5) * 8.6;
  mesh.scale.set(1.45 * aspect, 1.45, 1);
  mesh.position.set(Math.cos(angle) * ring, y, Math.sin(angle) * ring);
  mesh.rotation.set(Math.random() * 0.6, -angle + Math.PI / 2, (Math.random() - 0.5) * 0.25);
  mesh.userData = {
    baseAngle: angle,
    angle,
    ring,
    y,
    speed: 0.08 + Math.random() * 0.16,
    drift: Math.random() * Math.PI * 2,
    focus: Math.random()
  };
  root.add(mesh);
  cards.push(mesh);

  const edges = new THREE.EdgesGeometry(cardGeometry);
  const wire = new THREE.LineSegments(edges, lineMaterial.clone());
  wire.scale.copy(mesh.scale).multiplyScalar(1.01);
  mesh.add(wire);
}

const starGeometry = new THREE.BufferGeometry();
const starCount = 900;
const starPositions = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
  const r = 18 + Math.random() * 48;
  const a = Math.random() * Math.PI * 2;
  starPositions[i * 3 + 0] = Math.cos(a) * r;
  starPositions[i * 3 + 1] = (Math.random() - 0.5) * 34;
  starPositions[i * 3 + 2] = Math.sin(a) * r;
}
starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0xede8dc, size: 0.024, transparent: true, opacity: 0.48 }));
scene.add(stars);

const tunnelGeometry = new THREE.TorusGeometry(9, 0.006, 8, 180);
const tunnelMaterial = new THREE.MeshBasicMaterial({ color: 0xe8c873, transparent: true, opacity: 0.08 });
const rings = [];
for (let i = 0; i < 16; i++) {
  const ring = new THREE.Mesh(tunnelGeometry, tunnelMaterial.clone());
  ring.position.z = -26 + i * 3.5;
  ring.rotation.x = Math.PI / 2;
  scene.add(ring);
  rings.push(ring);
}

let scrollProgress = 0;
let targetProgress = 0;
let velocity = 0;
let pointer = { x: 0, y: 0, tx: 0, ty: 0 };

function updateScroll() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  targetProgress = max <= 0 ? 0 : window.scrollY / max;
  hudBar.style.width = `${Math.round(targetProgress * 100)}%`;
  hudValue.textContent = `${String(Math.round(targetProgress * 100)).padStart(2, '0')}%`;
}
window.addEventListener('scroll', updateScroll, { passive: true });
updateScroll();

window.addEventListener('pointermove', (event) => {
  pointer.tx = (event.clientX / window.innerWidth - 0.5) * 2;
  pointer.ty = -(event.clientY / window.innerHeight - 0.5) * 2;
  if (cursorDot) {
    cursorDot.style.left = `${event.clientX}px`;
    cursorDot.style.top = `${event.clientY}px`;
  }
});

document.querySelectorAll('a, .button').forEach((el) => {
  el.addEventListener('mouseenter', () => cursorDot?.style.setProperty('width', '34px'));
  el.addEventListener('mouseleave', () => cursorDot?.style.setProperty('width', '13px'));
});

function intro() {
  gsap.from('.hero .eyebrow, .hero h1, .hero .lede, .hero-actions', {
    y: 34,
    opacity: 0,
    duration: 1.25,
    stagger: 0.12,
    ease: 'power3.out'
  });
  gsap.from(cards.map((card) => card.scale), {
    x: 0.001,
    y: 0.001,
    duration: 1.65,
    stagger: { each: 0.02, from: 'random' },
    ease: 'expo.out'
  });
}
if (!reducedMotion) intro();

const clock = new THREE.Clock();
function animate() {
  const t = clock.getElapsedTime();
  const previous = scrollProgress;
  scrollProgress += (targetProgress - scrollProgress) * 0.075;
  velocity += ((scrollProgress - previous) * 70 - velocity) * 0.08;
  pointer.x += (pointer.tx - pointer.x) * 0.05;
  pointer.y += (pointer.ty - pointer.y) * 0.05;

  const scrollDepth = scrollProgress * 28;
  camera.position.x = pointer.x * 0.42;
  camera.position.y = 0.35 + pointer.y * 0.32 + Math.sin(t * 0.3) * 0.08;
  camera.position.z = 12 - scrollDepth * 0.18;
  camera.rotation.z = pointer.x * -0.018;
  camera.lookAt(pointer.x * 0.25, pointer.y * 0.2, -scrollDepth * 0.23);

  root.rotation.y = scrollProgress * Math.PI * 2.25 + pointer.x * 0.12;
  root.rotation.x = pointer.y * 0.06;
  stars.rotation.y = -scrollProgress * 0.7 + t * 0.008;

  const energy = reducedMotion ? 0.12 : Math.min(1.4, Math.abs(velocity) * 1.2 + 0.2);
  cards.forEach((card, i) => {
    const d = card.userData;
    const sectionBias = Math.sin((scrollProgress * 4 + d.focus) * Math.PI);
    const radius = d.ring + sectionBias * 1.2 + energy * 0.75;
    const angle = d.baseAngle + t * d.speed + scrollProgress * (1.4 + (i % 5) * 0.18);
    card.position.x = Math.cos(angle) * radius + pointer.x * (i % 2 ? 0.25 : -0.25);
    card.position.z = Math.sin(angle) * radius - scrollProgress * 18 + Math.sin(t * 0.25 + d.drift) * 0.35;
    card.position.y = d.y + Math.sin(t * 0.5 + d.drift + scrollProgress * 8) * (0.25 + energy * 0.25);
    card.rotation.y = -angle + Math.PI / 2 + pointer.x * 0.08;
    card.rotation.x = Math.sin(t * 0.4 + i) * 0.06 + pointer.y * 0.06;
    card.rotation.z = Math.sin(t * 0.33 + d.drift) * 0.045;
    card.material.opacity = 0.48 + Math.min(0.42, 0.18 + energy * 0.15);
  });

  rings.forEach((ring, i) => {
    ring.position.z = ((i * 3.5 - 34 + scrollProgress * 36) % 56) - 28;
    ring.rotation.z = t * 0.06 + i * 0.2;
    ring.material.opacity = 0.035 + energy * 0.03;
  });

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
