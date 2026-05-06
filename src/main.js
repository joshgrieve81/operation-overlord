import './style.css';
import * as THREE from 'three';
import gsap from 'gsap';

const canvas = document.querySelector('#webgl');
const velocityLine = document.querySelector('.meter span');
const velocityValue = document.querySelector('.hud-value');
const cursorDot = document.querySelector('.cursor-dot');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf4f4f1);
scene.fog = new THREE.Fog(0xf4f4f1, 14, 44);

const camera = new THREE.PerspectiveCamera(36, window.innerWidth / window.innerHeight, 0.1, 80);
camera.position.set(0, 0.12, 15.5);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  powerPreference: 'high-performance'
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

scene.add(new THREE.AmbientLight(0xffffff, 2.6));
const keyLight = new THREE.DirectionalLight(0xffffff, 3.4);
keyLight.position.set(-2.5, 4.5, 7);
scene.add(keyLight);
const rimLight = new THREE.DirectionalLight(0xffffff, 1.2);
rimLight.position.set(4, -2, -3);
scene.add(rimLight);

const carousel = new THREE.Group();
carousel.position.set(1.28, 0.38, 0);
scene.add(carousel);

const projectTitles = [
  ['DOLLY', 'Design System'],
  ['KBB', 'Deal Advisor'],
  ['NETGEAR', 'Network Solution'],
  ['SYSTEMS', 'Component Logic'],
  ['STRATEGY', 'Product Direction'],
  ['CRAFT', 'Interface Detail'],
  ['RESEARCH', 'Human Signals'],
  ['MOTION', 'Spatial Prototype'],
  ['UX', 'Decision Support'],
  ['VISUAL', 'Black / White']
];

function coverTexture(index) {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 1200;
  const ctx = canvas.getContext('2d');
  const inverted = index % 3 === 1;
  const bg = inverted ? '#111111' : '#fbfbf7';
  const fg = inverted ? '#f7f7f2' : '#111111';
  const mid = inverted ? '#363636' : '#d8d8d2';

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = inverted ? 'rgba(255,255,255,.20)' : 'rgba(0,0,0,.16)';
  ctx.lineWidth = 2;
  ctx.strokeRect(46, 46, canvas.width - 92, canvas.height - 92);

  ctx.fillStyle = fg;
  ctx.font = '400 42px "Helvetica Neue", Arial, sans-serif';
  ctx.fillText(String(index + 1).padStart(3, '0'), 72, 118);

  ctx.save();
  ctx.translate(72, 760);
  ctx.fillStyle = fg;
  ctx.font = '400 118px "Helvetica Neue", Arial, sans-serif';
  ctx.letterSpacing = '-7px';
  ctx.fillText(projectTitles[index % projectTitles.length][0], 0, 0);
  ctx.font = '400 46px "Helvetica Neue", Arial, sans-serif';
  ctx.letterSpacing = '-2px';
  ctx.fillStyle = inverted ? 'rgba(247,247,242,.68)' : 'rgba(17,17,17,.58)';
  ctx.fillText(projectTitles[index % projectTitles.length][1], 4, 64);
  ctx.restore();

  ctx.fillStyle = mid;
  const imageX = 454 + (index % 2) * 24;
  const imageY = 184 + (index % 4) * 18;
  ctx.fillRect(imageX, imageY, 298, 396);

  ctx.strokeStyle = inverted ? 'rgba(255,255,255,.50)' : 'rgba(0,0,0,.42)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 18; i++) {
    const y = imageY + 38 + i * 18;
    ctx.beginPath();
    ctx.moveTo(imageX + 26, y);
    ctx.lineTo(imageX + 272 - ((i + index) % 6) * 18, y);
    ctx.stroke();
  }

  ctx.fillStyle = inverted ? 'rgba(247,247,242,.58)' : 'rgba(17,17,17,.50)';
  ctx.font = '400 24px "Helvetica Neue", Arial, sans-serif';
  ctx.fillText('PRODUCT DESIGN / UX / SYSTEMS', 72, 1080);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}

const cards = [];
const radius = 7.2;
const cardCount = 10;
const cardGeometry = new THREE.PlaneGeometry(3.15, 4.2, 24, 24);
const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x0e0e0e, transparent: true, opacity: 0.14 });

for (let i = 0; i < cardCount; i++) {
  const material = new THREE.MeshStandardMaterial({
    map: coverTexture(i),
    color: 0xffffff,
    roughness: 0.72,
    metalness: 0,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 1
  });
  const mesh = new THREE.Mesh(cardGeometry, material);
  const angle = (i / cardCount) * Math.PI * 2;
  mesh.position.set(Math.sin(angle) * radius, 0, Math.cos(angle) * radius);
  mesh.rotation.y = angle + Math.PI;
  mesh.userData = { angle, phase: i * 0.7 };

  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(cardGeometry), edgeMaterial.clone());
  edges.scale.setScalar(1.006);
  mesh.add(edges);

  carousel.add(mesh);
  cards.push(mesh);
}

const orbitLines = [];
for (let i = 0; i < 5; i++) {
  const curve = new THREE.EllipseCurve(0, 0, radius + i * 0.18, radius + i * 0.18, 0, Math.PI * 2);
  const points = curve.getPoints(160).map((point) => new THREE.Vector3(point.x, -2.55 - i * 0.035, point.y));
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const line = new THREE.LineLoop(geometry, new THREE.LineBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.045 }));
  line.rotation.x = Math.PI / 2;
  carousel.add(line);
  orbitLines.push(line);
}

let targetRotation = 0;
let rotation = 0;
let velocity = 0;
let pointer = { x: 0, y: 0, tx: 0, ty: 0 };
let touchX = null;

function addSpin(delta) {
  velocity += delta;
  targetRotation += delta * 0.18;
}

window.addEventListener('wheel', (event) => {
  event.preventDefault();
  addSpin(THREE.MathUtils.clamp(event.deltaY * 0.0014, -0.36, 0.36));
}, { passive: false });

window.addEventListener('touchstart', (event) => {
  touchX = event.touches[0]?.clientX ?? null;
}, { passive: true });

window.addEventListener('touchmove', (event) => {
  if (touchX == null) return;
  const nextX = event.touches[0]?.clientX ?? touchX;
  addSpin((touchX - nextX) * 0.004);
  touchX = nextX;
}, { passive: true });

window.addEventListener('pointermove', (event) => {
  pointer.tx = (event.clientX / window.innerWidth - 0.5) * 2;
  pointer.ty = -(event.clientY / window.innerHeight - 0.5) * 2;
  if (cursorDot) {
    cursorDot.style.left = `${event.clientX}px`;
    cursorDot.style.top = `${event.clientY}px`;
  }
});

document.querySelectorAll('a, .hero-actions span').forEach((el) => {
  el.addEventListener('mouseenter', () => cursorDot?.classList.add('is-active'));
  el.addEventListener('mouseleave', () => cursorDot?.classList.remove('is-active'));
});

if (!reducedMotion) {
  gsap.from('.site-header, .hero-panel .eyebrow, .hero-panel h1, .hero-panel .lede, .hero-actions', {
    y: 24,
    opacity: 0,
    duration: 1.08,
    stagger: 0.075,
    ease: 'power3.out'
  });
  gsap.from(cards.map((card) => card.scale), {
    x: 0.18,
    y: 0.18,
    z: 0.18,
    duration: 1.4,
    stagger: { each: 0.055, from: 'center' },
    ease: 'expo.out'
  });
}

const clock = new THREE.Clock();
function animate() {
  const time = clock.getElapsedTime();
  const idleSpin = reducedMotion ? 0 : 0.0018;
  targetRotation += idleSpin;
  rotation += (targetRotation - rotation) * 0.08;
  velocity *= 0.92;
  pointer.x += (pointer.tx - pointer.x) * 0.06;
  pointer.y += (pointer.ty - pointer.y) * 0.06;

  carousel.rotation.y = rotation + pointer.x * 0.12;
  carousel.rotation.x = pointer.y * -0.055;
  carousel.position.x = 1.28 + pointer.x * 0.34;
  carousel.position.y = 0.38 + pointer.y * 0.18;

  const speed = Math.min(1, Math.abs(velocity) * 3.2);
  velocityLine.style.width = `${Math.round(speed * 100)}%`;
  velocityValue.textContent = String(Math.round(speed * 99)).padStart(2, '0');

  cards.forEach((card, i) => {
    const worldAngle = card.userData.angle + carousel.rotation.y;
    const frontness = (Math.cos(worldAngle) + 1) / 2;
    const parallax = Math.sin(worldAngle) * pointer.x * 0.24;
    const breathe = Math.sin(time * 0.75 + card.userData.phase) * 0.035;

    card.position.x = Math.sin(card.userData.angle) * radius + parallax;
    card.position.y = Math.sin(time * 0.55 + card.userData.phase) * 0.11 + pointer.y * frontness * 0.22;
    card.position.z = Math.cos(card.userData.angle) * radius;
    card.rotation.y = card.userData.angle + Math.PI + velocity * 0.07;
    card.rotation.x = pointer.y * 0.035 + breathe;
    card.rotation.z = pointer.x * -0.012 + Math.sin(time * 0.44 + i) * 0.01;
    card.scale.setScalar(0.84 + frontness * 0.28 + speed * 0.045);
    card.material.opacity = 0.28 + frontness * 0.72;
  });

  orbitLines.forEach((line, i) => {
    line.material.opacity = 0.028 + speed * 0.03 + i * 0.003;
  });

  camera.position.x = pointer.x * 0.35;
  camera.position.y = 0.12 + pointer.y * 0.2;
  camera.lookAt(1.0 + pointer.x * 0.18, 0.1 + pointer.y * 0.12, 0);

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
