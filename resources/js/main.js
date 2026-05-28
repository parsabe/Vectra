import * as THREE from 'three';
import { gsap } from 'gsap';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

console.log('%c[VECTRA PORTAL] Initializing Cyberpunk City Engine...', 'color: #00f3ff; font-weight: bold;');

// DOM Canvas check
const canvas = document.getElementById('bg-city');
if (!canvas) {
    console.error('[SYSTEM_ERR] Background city canvas "bg-city" not found.');
}

// ── Three.js Scene Config ───────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020204);
scene.fog = new THREE.FogExp2(0x020204, 0.018); // cyberpunk dark space depth fog

// Camera setup
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 300);
camera.position.set(0, 8, 48); // positioned slightly high looking down at the highway
const cameraTarget = new THREE.Vector3(0, 4, 0);
camera.lookAt(cameraTarget);

// Renderer setup
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance"
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// ── Post Processing Glow (UnrealBloomPass) ──────────────────────────────────
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.6,   // Strength
    0.45,  // Radius
    0.32   // Threshold
);
composer.addPass(bloomPass);

// ── Light Rigging ──────────────────────────────────────────────────────────
const ambientLight = new THREE.AmbientLight(0x0b0d1a, 1.8);
scene.add(ambientLight);

// Neon accents lighting up buildings
const cyanLight = new THREE.PointLight(0x00f3ff, 6, 80);
cyanLight.position.set(-20, 15, 10);
scene.add(cyanLight);

const magentaLight = new THREE.PointLight(0xff00ff, 6, 80);
magentaLight.position.set(20, 15, 10);
scene.add(magentaLight);

// ── Procedural Skyscraper Textures ──────────────────────────────────────────
function createSkyscraperTexture() {
    const texCanvas = document.createElement('canvas');
    texCanvas.width = 256;
    texCanvas.height = 512;
    const ctx = texCanvas.getContext('2d');
    
    // Dark building panel base
    ctx.fillStyle = '#06060c';
    ctx.fillRect(0, 0, 256, 512);

    // Draw glowing neon window lattices
    const cols = 8;
    const rows = 20;
    const winW = 16;
    const winH = 14;
    const gapX = 14;
    const gapY = 10;

    for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
            const x = gapX + c * (winW + gapX);
            const y = gapY + r * (winH + gapY);

            // High probability of dark window, low of bright neon colors
            const rand = Math.random();
            if (rand < 0.15) {
                ctx.fillStyle = '#00f3ff'; // neon cyan
            } else if (rand < 0.28) {
                ctx.fillStyle = '#ff00ff'; // neon fuchsia
            } else if (rand < 0.35) {
                ctx.fillStyle = '#eab308'; // electric yellow
            } else {
                ctx.fillStyle = '#020204'; // unlit window
            }
            ctx.fillRect(x, y, winW, winH);
        }
    }
    return new THREE.CanvasTexture(texCanvas);
}

const buildingTexture = createSkyscraperTexture();
buildingTexture.wrapS = THREE.RepeatWrapping;
buildingTexture.wrapT = THREE.RepeatWrapping;

// Skyscraper material applying procedural emission mapping
const buildingMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a0f,
    roughness: 0.95,
    metalness: 0.05,
    emissiveMap: buildingTexture,
    emissive: 0xffffff,
    emissiveIntensity: 2.2
});

// ── Skyscrapers Instanced Mesh ──────────────────────────────────────────────
const buildingCount = 220;
const buildingGeom = new THREE.BoxGeometry(1, 1, 1);
const buildingMesh = new THREE.InstancedMesh(buildingGeom, buildingMat, buildingCount);

const dummy = new THREE.Object3D();
const buildingData = [];

for (let i = 0; i < buildingCount; i++) {
    // Random height, width, and depth
    const w = 3.5 + Math.random() * 4.5;
    const d = 3.5 + Math.random() * 4.5;
    const h = 12.0 + Math.random() * 32.0;

    // Distribute buildings in a ring grid to leave a central flight corridor open
    const angle = Math.random() * Math.PI * 2;
    const distance = 25.0 + Math.random() * 75.0; // keep corridor open near Z axis
    const px = Math.cos(angle) * distance;
    // Keep corridor around Z-axis relatively clear of tall skyscrapers
    const pz = Math.sin(angle) * distance;

    dummy.position.set(px, h / 2 - 3, pz); // sink slightly below floor
    dummy.scale.set(w, h, d);
    dummy.rotation.y = (Math.random() - 0.5) * 0.15;
    dummy.updateMatrix();

    buildingMesh.setMatrixAt(i, dummy.matrix);
}

buildingMesh.instanceMatrix.needsUpdate = true;
scene.add(buildingMesh);

// ── Flying Cars Instanced Mesh ──────────────────────────────────────────────
const carCount = 80;
const carGeom = new THREE.BoxGeometry(0.24, 0.12, 1.4);
const carMat = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0.98
});
const carMesh = new THREE.InstancedMesh(carGeom, carMat, carCount);

// Generate vehicles with positions and flight vectors
const carsData = [];
const neonColors = [
    new THREE.Color(0x00f3ff), // Cyan
    new THREE.Color(0xff00ff), // Fuchsia
    new THREE.Color(0xeab308)  // Yellow
];

for (let i = 0; i < carCount; i++) {
    // Arrange cars in flight corridors/lanes
    const isLeft = Math.random() > 0.5;
    const laneX = isLeft ? -8 - Math.random() * 12 : 8 + Math.random() * 12;
    const laneY = 3 + Math.random() * 20; // fly at different altitudes
    const startZ = -120 + Math.random() * 240; // spread along flight axis
    const speed = 0.55 + Math.random() * 0.95;
    const direction = isLeft ? 1 : -1; // opposite traffic flow

    carsData.push({
        x: laneX,
        y: laneY,
        z: startZ,
        speed: speed,
        direction: direction
    });

    const carColor = neonColors[i % neonColors.length];
    carMesh.setColorAt(i, carColor);
}

carMesh.instanceColor.needsUpdate = true;
scene.add(carMesh);

// ── Animation Loop ──────────────────────────────────────────────────────────
const dummyCar = new THREE.Object3D();

function animate() {
    requestAnimationFrame(animate);

    // Update flying cars coordinate animations
    for (let i = 0; i < carCount; i++) {
        const car = carsData[i];
        
        // Translate car Z coordinates based on speed and lane heading
        car.z += car.speed * car.direction;

        // Loop check wrapping cars to other side of city limits when out of view
        if (car.direction === 1 && car.z > 120) {
            car.z = -120 - Math.random() * 20;
        } else if (car.direction === -1 && car.z < -120) {
            car.z = 120 + Math.random() * 20;
        }

        dummyCar.position.set(car.x, car.y, car.z);
        dummyCar.updateMatrix();
        carMesh.setMatrixAt(i, dummyCar.matrix);
    }
    carMesh.instanceMatrix.needsUpdate = true;

    // Slow cinematic camera float to make the city feel alive
    const time = Date.now() * 0.00015;
    camera.position.x = Math.sin(time) * 1.5;
    camera.position.y = 8 + Math.cos(time * 0.8) * 0.6;
    camera.lookAt(cameraTarget);

    // Render via bloom post-processing composer
    composer.render();
}
animate();

// ── GSAP Entrance Transitions ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    gsap.to('#terminal-pane', {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 1.2,
        ease: 'power4.out',
        delay: 0.1
    });
});

// ── Window Resize adjustments ────────────────────────────────────────────────
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    composer.setSize(window.innerWidth, window.innerHeight);
});
