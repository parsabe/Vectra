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
scene.background = new THREE.Color(0x050510);
scene.fog = new THREE.FogExp2(0x050510, 0.012); // atmospheric depth fog

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
    2.2,   // Aggressive glow strength
    0.5,   // Radius
    0.1    // Low threshold to catch neon BasicMaterials
);
composer.addPass(bloomPass);

// ── Light Rigging ──────────────────────────────────────────────────────────
const ambientLight = new THREE.AmbientLight(0x0a0a1a, 1.2);
scene.add(ambientLight);

// High point lights representing massive high-altitude advertising glows
const cyanLight = new THREE.PointLight(0x00f3ff, 4, 100);
cyanLight.position.set(-30, 20, 20);
scene.add(cyanLight);

const magentaLight = new THREE.PointLight(0xff00ff, 4, 100);
magentaLight.position.set(30, 20, 20);
scene.add(magentaLight);

// ── The Ground (Wet Asphalt) ────────────────────────────────────────────────
const groundGeo = new THREE.PlaneGeometry(1000, 1000);
const groundMat = new THREE.MeshStandardMaterial({
    color: 0x050510,
    roughness: 0.1,    // high reflectivity
    metalness: 0.9     // metallic reflection
});
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0;
scene.add(ground);

// ── Skyscrapers Instanced Mesh ──────────────────────────────────────────────
const buildingMat = new THREE.MeshStandardMaterial({
    color: 0x111111,   // Silhouettes in the fog
    roughness: 0.9,
    metalness: 0.1
});

const buildingCount = 240;
const buildingGeom = new THREE.BoxGeometry(1, 1, 1);
const buildingMesh = new THREE.InstancedMesh(buildingGeom, buildingMat, buildingCount);

const dummy = new THREE.Object3D();

// Billboard materials for glow effects
const billboardMats = {
    cyan: new THREE.MeshBasicMaterial({ color: 0x00f3ff, side: THREE.DoubleSide }),
    magenta: new THREE.MeshBasicMaterial({ color: 0xff00ff, side: THREE.DoubleSide }),
    yellow: new THREE.MeshBasicMaterial({ color: 0xeab308, side: THREE.DoubleSide }),
    white: new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
};
const billboardColors = ['cyan', 'magenta', 'yellow', 'white'];

let lightCount = 0;

for (let i = 0; i < buildingCount; i++) {
    // Random height, width, and depth
    const w = 4.0 + Math.random() * 5.0;
    const d = 4.0 + Math.random() * 5.0;
    const h = 15.0 + Math.random() * 35.0;

    // Distribute buildings in a ring grid to leave a central flight corridor open
    const angle = Math.random() * Math.PI * 2;
    const distance = 28.0 + Math.random() * 85.0;
    const px = Math.cos(angle) * distance;
    const pz = Math.sin(angle) * distance;
    const py = h / 2 - 3;

    const rotY = (Math.random() - 0.5) * 0.15;

    dummy.position.set(px, py, pz);
    dummy.scale.set(w, h, d);
    dummy.rotation.set(0, rotY, 0);
    dummy.updateMatrix();

    buildingMesh.setMatrixAt(i, dummy.matrix);

    // Randomly attach flat PlaneGeometry meshes to the sides of taller buildings
    if (h > 18.0 && Math.random() < 0.5) {
        const faceIndex = Math.floor(Math.random() * 4);
        const colName = billboardColors[Math.floor(Math.random() * billboardColors.length)];
        const bMat = billboardMats[colName];

        const bw = w * (0.4 + Math.random() * 0.4);
        const bh = h * (0.2 + Math.random() * 0.3);
        const billboardGeo = new THREE.PlaneGeometry(bw, bh);
        const billboard = new THREE.Mesh(billboardGeo, bMat);

        let localX = 0;
        let localZ = 0;
        let faceRot = 0;
        const offset = 0.05;

        if (faceIndex === 0) {
            localZ = d / 2 + offset;
            faceRot = 0;
        } else if (faceIndex === 1) {
            localZ = -d / 2 - offset;
            faceRot = Math.PI;
        } else if (faceIndex === 2) {
            localX = -w / 2 - offset;
            faceRot = -Math.PI / 2;
        } else {
            localX = w / 2 + offset;
            faceRot = Math.PI / 2;
        }

        const localY = (Math.random() - 0.5) * (h * 0.4);

        const cosR = Math.cos(rotY);
        const sinR = Math.sin(rotY);
        const wx = px + (localX * cosR + localZ * sinR);
        const wy = py + localY;
        const wz = pz + (-localX * sinR + localZ * cosR);

        billboard.position.set(wx, wy, wz);
        billboard.rotation.set(0, rotY + faceRot, 0);
        scene.add(billboard);

        // Add matching PointLight for reflection on wet ground (max 16 lights)
        if (lightCount < 16 && wy < 22 && Math.random() < 0.4) {
            const hexColor = bMat.color.getHex();
            const pLight = new THREE.PointLight(hexColor, 5, 45, 1.5);
            pLight.position.set(wx, wy, wz);
            scene.add(pLight);
            lightCount++;
        }
    }
}

buildingMesh.instanceMatrix.needsUpdate = true;
scene.add(buildingMesh);

// ── Flying Cars Instanced Mesh ──────────────────────────────────────────────
const carCount = 85;
const carGeom = new THREE.BoxGeometry(0.25, 0.12, 1.5);
// Basic material so cars glow under bloom
const carMat = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0.95
});
const carMesh = new THREE.InstancedMesh(carGeom, carMat, carCount);

// Generate vehicles with positions and flight vectors
const carsData = [];
const neonColors = [
    new THREE.Color(0x00f3ff), // Cyan
    new THREE.Color(0xff00ff), // Fuchsia
    new THREE.Color(0xeab308), // Yellow
    new THREE.Color(0xffffff)  // White
];

for (let i = 0; i < carCount; i++) {
    // Arrange cars in flight corridors/lanes
    const isLeft = Math.random() > 0.5;
    const laneX = isLeft ? -10 - Math.random() * 15 : 10 + Math.random() * 15;
    const laneY = 4 + Math.random() * 22; // fly at different altitudes
    const startZ = -120 + Math.random() * 240; // spread along flight axis
    const speed = 0.6 + Math.random() * 0.8;
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

// Helper for terminal-style typing effect
function typeText(element, text, speed) {
    return new Promise((resolve) => {
        let i = 0;
        element.innerHTML = '';
        function nextChar() {
            if (i < text.length) {
                element.innerHTML += text.charAt(i);
                i++;
                setTimeout(nextChar, speed);
            } else {
                resolve();
            }
        }
        nextChar();
    });
}

// ── GSAP Boot Sequence & UI Reveal ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const bootToast = document.getElementById('boot-notification');
    const line1 = document.getElementById('boot-line1');
    const line2 = document.getElementById('boot-line2');
    const mainPane = document.getElementById('terminal-pane');

    if (!bootToast || !line1 || !line2 || !mainPane) {
        console.error('[SYSTEM_ERR] One of the UI elements is missing.');
        return;
    }

    // Set initial state
    gsap.set(bootToast, { x: '125%', opacity: 0 });
    gsap.set(mainPane, { opacity: 0, scale: 0.95 });

    // 1. Boot Toast Entrance (Glitchy slide in)
    const tl = gsap.timeline({
        onComplete: startBootTyping
    });

    tl.to(bootToast, { opacity: 1, duration: 0.05, repeat: 3, yoyo: true })
      .to(bootToast, { x: '-20px', opacity: 1, duration: 0.25, ease: 'power2.out' })
      .to(bootToast, { x: '10px', duration: 0.1, ease: 'power1.inOut' })
      .to(bootToast, { x: '0px', duration: 0.1, ease: 'bounce.out' });

    async function startBootTyping() {
        // Type connection line
        await typeText(line1, '> VECTRA_HUB // CONNECTION ESTABLISHED...', 30);
        await new Promise(r => setTimeout(r, 400));
        
        // Type security line
        await typeText(line2, '> ENCRYPTED TUNNEL SECURED.', 25);
        
        // Hold for 3 seconds
        setTimeout(exitBootToast, 3000);
    }

    function exitBootToast() {
        const exitTl = gsap.timeline({
            onComplete: () => {
                bootToast.style.display = 'none';
                revealMainUI();
            }
        });

        // Glitch exit
        exitTl.to(bootToast, { x: '-15px', opacity: 0.7, duration: 0.05 })
              .to(bootToast, { x: '12px', opacity: 0.2, duration: 0.05 })
              .to(bootToast, { x: '-5px', opacity: 0.9, duration: 0.05 })
              .to(bootToast, { x: '125%', opacity: 0, duration: 0.4, ease: 'power2.in' });
    }

    function revealMainUI() {
        gsap.to(mainPane, {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 1.2,
            ease: 'power4.out'
        });
    }
});

// ── Window Resize adjustments ────────────────────────────────────────────────
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    composer.setSize(window.innerWidth, window.innerHeight);
});
