import './style.css';
import * as THREE from 'three';
import gsap from 'gsap';

const canvas = document.querySelector('#webgl');
const progressLine = document.querySelector('.meter span');
const progressValue = document.querySelector('.hud-value');
const cursorDot = document.querySelector('.cursor-dot');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf4f4f1);
scene.fog = new THREE.Fog(0xf4f4f1, 10, 52);

const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 90);
camera.position.set(0, 0, 12);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  powerPreference: 'high-performance'
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

scene.add(new THREE.AmbientLight(0xffffff, 2.25));
const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
keyLight.position.set(-3, 5, 7);
scene.add(keyLight);

const editorialGroup = new THREE.Group();
scene.add(editorialGroup);

const projectTitles = [
  'DOLLY',
  'DEAL ADVISOR',
  'NETWORK SOLUTION',
  'SYSTEMS',
  'STRATEGY',
  'CRAFT',
  'RESEARCH',
  'PROTOTYPES'
];

function drawEditorialTexture(index) {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 800;
  const ctx = canvas.getContext('2d');

  const light = index % 2 === 0;
  ctx.fillStyle = light ? '#f7f7f4' : '#111111';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = light ? 'rgba(0,0,0,.16)' : 'rgba(255,255,255,.2)';
  ctx.lineWidth = 2;
  ctx.strokeRect(52, 52, canvas.width - 104, canvas.height - 104);

  ctx.fillStyle = light ? '#111111' : '#f7f7f4';
  ctx.font = '500 34px "Helvetica Neue", Arial, sans-serif';
  ctx.fillText(String(index + 1).padStart(3, '0'), 86, 118);

  ctx.font = '400 96px "Helvetica Neue", Arial, sans-serif';
  ctx.letterSpacing = '-4px';
  const title = projectTitles[index % projectTitles.length];
  const words = title.split(' ');
  words.forEach((word, line) => ctx.fillText(word, 86, 460 + line * 92));

  ctx.globalAlpha = light ? 0.66 : 0.78;
  ctx.fillStyle = light ? '#d9d9d4' : '#353535';
  const imageX = 650 + (index % 3) * 22;
  const imageY = 172 + (index % 2) * 34;
  ctx.fillRect(imageX, imageY, 330, 420);
  ctx.globalAlpha = 1;

  ctx.strokeStyle = light ? 'rgba(0,0,0,.45)' : 'rgba(255,255,255,.55)';
  ctx.beginPath();
  for (let i = 0; i < 16; i++) {
    const y = imageY + 34 + i * 23;
    ctx.moveTo(imageX + 28, y);
    ctx.lineTo(imageX + 302 - (i % 5) * 20, y);
  }
  ctx.stroke();

  ctx.font = '400 22px "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = light ? 'rgba(0,0,0,.62)' : 'rgba(255,255,255,.68)';
  ctx.fillText('PRODUCT DESIGN / UX SYSTEMS / MOTION', 86, 692);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}

const panels = [];
const panelGeometry = new THREE.PlaneGeometry(5.8, 3.86, 24, 16);

for (let i = 0; i < 18; i++) {
  const material = new THREE.MeshStandardMaterial({
    map: drawEditorialTexture(i),
    color: 0xffffff,
    roughness: 0.86,
    metalness: 0,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.96
  });

  const mesh = new THREE.Mesh(panelGeometry, material);
  const lane = (i % 3) - 1;
  const row = Math.floor(i / 3);
  mesh.position.set(lane * 3.9, (i % 2 ? -0.42 : 0.42), -row * 5.1);
  mesh.rotation.set(0, lane * -0.16, lane * 0.025);
  mesh.userData = {
    lane,
    baseX: lane * 3.9,
    baseY: i % 2 ? -0.42 : 0.42,
    baseZ: -row * 5.1,
    phase: i * 0.74,
    section: row
  };
  editorialGroup.add(mesh);
  panels.push(mesh);
}

const lineMaterial = new THREE.LineBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.18 });
const depthLines = [];
for (let i = 0; i < 24; i++) {
  const geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-7.8, -3.8, -i * 2.6),
    new THREE.Vector3(7.8, -3.8, -i * 2.6)
  ]);
  const line = new THREE.Line(geometry, lineMaterial.clone());
  scene.add(line);
  depthLines.push(line);
}

let targetProgress = 0;
let progress = 0;
let velocity = 0;
let pointer = { x: 0, y: 0, tx: 0, ty: 0 };

function updateScroll() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  targetProgress = max <= 0 ? 0 : window.scrollY / max;
  const percent = Math.round(targetProgress * 100);
  progressLine.style.width = `${percent}%`;
  progressValue.textContent = `${String(percent).padStart(2, '0')}%`;
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
  el.addEventListener('mouseenter', () => cursorDot?.classList.add('is-active'));
  el.addEventListener('mouseleave', () => cursorDot?.classList.remove('is-active'));
});

if (!reducedMotion) {
  gsap.from('.site-header, .hero .eyebrow, .hero h1, .hero .lede, .hero-actions', {
    y: 22,
    opacity: 0,
    duration: 1.15,
    stagger: 0.08,
    ease: 'power3.out'
  });
  gsap.from(panels.map((panel) => panel.position), {
    z: '-=8',
    duration: 1.8,
    stagger: { each: 0.035, from: 'start' },
    ease: 'expo.out'
  });
}

const clock = new THREE.Clock();
function animate() {
  const time = clock.getElapsedTime();
  const previous = progress;
  progress += (targetProgress - progress) * (reducedMotion ? 0.18 : 0.075);
  velocity += ((progress - previous) * 80 - velocity) * 0.08;
  pointer.x += (pointer.tx - pointer.x) * 0.055;
  pointer.y += (pointer.ty - pointer.y) * 0.055;

  const depth = progress * 34;
  camera.position.x = pointer.x * 0.62;
  camera.position.y = pointer.y * 0.38;
  camera.position.z = 12 - depth;
  camera.rotation.z = pointer.x * -0.012;
  camera.lookAt(pointer.x * 0.48, pointer.y * 0.24, camera.position.z - 12);

  panels.forEach((panel, i) => {
    const data = panel.userData;
    const localZ = data.baseZ + depth;
    const pulse = Math.sin(time * 0.85 + data.phase) * 0.12;
    const drift = Math.sin(time * 0.38 + data.phase) * 0.18;
    const focus = Math.max(0, 1 - Math.abs(localZ + 7.2) / 9);

    panel.position.x = data.baseX + pointer.x * (0.18 + focus * 0.55) + drift;
    panel.position.y = data.baseY + pointer.y * (0.12 + focus * 0.22) + pulse;
    panel.position.z = data.baseZ;
    panel.rotation.x = pointer.y * 0.035 + Math.sin(time * 0.25 + i) * 0.012;
    panel.rotation.y = data.lane * -0.16 + pointer.x * 0.045 + velocity * 0.015;
    panel.rotation.z = data.lane * 0.025 + Math.sin(time * 0.32 + data.phase) * 0.012;
    panel.material.opacity = 0.18 + focus * 0.82;
    panel.scale.setScalar(0.86 + focus * 0.2 + Math.min(0.08, Math.abs(velocity) * 0.018));
  });

  depthLines.forEach((line, i) => {
    const wrapped = ((i * 2.6 - depth) % 62 + 62) % 62;
    line.position.z = 10 - wrapped;
    line.material.opacity = 0.06 + Math.min(0.14, Math.abs(velocity) * 0.01);
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
