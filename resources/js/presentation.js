import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

// Initialize system version log
console.log('%c[VECTRA PRESENTATION] Booting 3D Scroll Presentation Engine...', 'color: #00f3ff; font-weight: bold;');

// DOM Elements
const canvas = document.getElementById('webgl-canvas');
if (!canvas) {
    console.error('[SYSTEM_ERR] WebGL Canvas not found in DOM.');
}

// ── Three.js Scene Configuration ─────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020204);
scene.fog = new THREE.FogExp2(0x020204, 0.018); // Cyberpunk volumetric depth fog

// Camera setup
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);

// Camera Target (for smooth lookAt sweep animations)
const cameraTarget = new THREE.Vector3(0, 1.5, 0);

// Renderer setup
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance"
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// ── Lights Setup ─────────────────────────────────────────────────────────────
const ambientLight = new THREE.AmbientLight(0x0d0f14, 1.5);
scene.add(ambientLight);

// Floating neon scanning point lights
const cyanLight = new THREE.PointLight(0x00f3ff, 6, 60);
cyanLight.position.set(-6, 3, 20);
scene.add(cyanLight);

const magentaLight = new THREE.PointLight(0xff00ff, 6, 60);
magentaLight.position.set(6, 3, -30);
scene.add(magentaLight);

const yellowLight = new THREE.PointLight(0xeab308, 4, 45);
yellowLight.position.set(0, 5, -80);
scene.add(yellowLight);

// ── Procedural Geometry Generation ───────────────────────────────────────────
// Technical floor grid helper
const gridHelper = new THREE.GridHelper(300, 120, 0xff00ff, 0x00f3ff);
gridHelper.position.y = -2.5;
scene.add(gridHelper);

// Cyberpunk Wireframe Tunnel/Corridor
const tunnelGroup = new THREE.Group();
const numGates = 30;
const gateSpacing = 7; // distance between gates

for (let i = 0; i < numGates; i++) {
    const zPos = 35 - i * gateSpacing; // Z positions stretching from 35 to -175
    const sizeWidth = 14 + Math.sin(i * 0.4) * 2;
    const sizeHeight = 8 + Math.cos(i * 0.4) * 1.5;

    const geom = new THREE.BoxGeometry(sizeWidth, sizeHeight, 2);
    const edges = new THREE.EdgesGeometry(geom);
    
    // Alternating cyan, magenta, and electric yellow colors
    let themeColor;
    if (i % 3 === 0) themeColor = 0x00f3ff; // Cyan
    else if (i % 3 === 1) themeColor = 0xff00ff; // Magenta
    else themeColor = 0xeab308; // Yellow

    const mat = new THREE.LineBasicMaterial({
        color: themeColor,
        transparent: true,
        opacity: Math.max(0.4 - (i / numGates) * 0.25, 0.1) // Fade out gates in distance
    });
    
    const gate = new THREE.LineSegments(edges, mat);
    gate.position.set(0, 1.5, zPos);
    tunnelGroup.add(gate);
}
scene.add(tunnelGroup);

// Volumetric Neural Particle Nodes (simulating Gaussian nodes matrix)
const particleCount = 3500;
const particleGeometry = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);
const colors = new Float32Array(particleCount * 3);

const colorCyan = new THREE.Color(0x00f3ff);
const colorMagenta = new THREE.Color(0xff00ff);
const colorYellow = new THREE.Color(0xeab308);

for (let i = 0; i < particleCount; i++) {
    // Tunnel cylinder coordinate mapping
    const theta = Math.random() * Math.PI * 2;
    const radius = 5.5 + Math.random() * 18; // Keep particles outside immediate corridor center
    const x = Math.cos(theta) * radius;
    const y = Math.sin(theta) * radius + 1.5;
    const z = Math.random() * 260 - 200; // Z from -200 to +60

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    // Randomize accent colors
    const rand = Math.random();
    let pColor;
    if (rand < 0.45) {
        pColor = colorCyan;
    } else if (rand < 0.85) {
        pColor = colorMagenta;
    } else {
        pColor = colorYellow;
    }

    colors[i * 3] = pColor.r;
    colors[i * 3 + 1] = pColor.g;
    colors[i * 3 + 2] = pColor.b;
}

particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

// Create a glowing particle dot texture using offscreen canvas
const pCanvas = document.createElement('canvas');
pCanvas.width = 16;
pCanvas.height = 16;
const pCtx = pCanvas.getContext('2d');
const gradient = pCtx.createRadialGradient(8, 8, 0, 8, 8, 8);
gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
gradient.addColorStop(0.35, 'rgba(255, 255, 255, 0.8)');
gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
pCtx.fillStyle = gradient;
pCtx.fillRect(0, 0, 16, 16);
const pTexture = new THREE.CanvasTexture(pCanvas);

const particleMaterial = new THREE.PointsMaterial({
    size: 0.28,
    map: pTexture,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false
});

const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
scene.add(particleSystem);

// ── GSAP ScrollTrigger Camera Path Orchestration ────────────────────────────
// Initial camera coordinates
camera.position.set(0, 3, 40);
cameraTarget.set(0, 1.5, 5);

// Create a master timeline that scrubs through the scroll progress
const scrollTimeline = gsap.timeline({
    scrollTrigger: {
        trigger: 'body',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.2, // Smooth follow scrub
    }
});

// Section-by-section flight coordinates mapping:
// Section 1 (Hero): Camera (0, 3, 40) looking at (0, 1.5, 5)
// Section 2 (Radiance): Camera flies to right (5, 1.8, 15) looking at (-2, 0.5, -15)
// Section 3 (Semantic): Camera sweeps left (-6, 3, -15) looking at (3, 1, -40)
// Section 4 (Gaussian): Camera sinks down (0, 0.2, -60) looking at (0, 0.8, -95) (inside dense particle zone)
// Section 5 (Methodology): Camera rises at the end (0, 2.5, -105) looking at (0, 1.5, -160)

scrollTimeline
    // Phase 1: Scroll towards Section 2
    .to(camera.position, { x: 5, y: 1.8, z: 15, ease: 'power1.inOut' }, 0)
    .to(cameraTarget, { x: -2, y: 0.5, z: -15, ease: 'power1.inOut' }, 0)
    
    // Phase 2: Scroll towards Section 3
    .to(camera.position, { x: -6, y: 3, z: -20, ease: 'power1.inOut' }, 1)
    .to(cameraTarget, { x: 3, y: 1, z: -55, ease: 'power1.inOut' }, 1)
    
    // Phase 3: Scroll towards Section 4
    .to(camera.position, { x: 0, y: 0.2, z: -70, ease: 'power1.inOut' }, 2)
    .to(cameraTarget, { x: 0, y: 0.8, z: -105, ease: 'power1.inOut' }, 2)
    
    // Phase 4: Scroll towards Section 5
    .to(camera.position, { x: 0, y: 3, z: -115, ease: 'power1.inOut' }, 3)
    .to(cameraTarget, { x: 0, y: 1.5, z: -170, ease: 'power1.inOut' }, 3);

// ── Content Panels Fade In/Out on Scroll ──────────────────────────────────────
const sections = document.querySelectorAll('section');
sections.forEach((section) => {
    const card = section.querySelector('div');
    if (card) {
        // Fade in card as it reaches center of the screen
        gsap.fromTo(card,
            { opacity: 0.05, y: 60, scale: 0.95 },
            {
                opacity: 1,
                y: 0,
                scale: 1,
                scrollTrigger: {
                    trigger: section,
                    start: 'top 80%',
                    end: 'top 35%',
                    scrub: true,
                }
            }
        );
        
        // Fade out card as it scrolls away
        gsap.to(card, {
            opacity: 0.05,
            y: -60,
            scale: 0.95,
            scrollTrigger: {
                trigger: section,
                start: 'bottom 65%',
                end: 'bottom 20%',
                scrub: true,
            }
        });
    }
});

// Update Scroll Progress bar width based on scroll percentage
window.addEventListener('scroll', () => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollHeight > 0) {
        const scrollPercent = (window.scrollY / scrollHeight) * 100;
        const progressBar = document.getElementById('scroll-progress');
        if (progressBar) {
            progressBar.style.width = `${scrollPercent}%`;
        }
    }
});

// ── Animation Loop ──────────────────────────────────────────────────────────
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const time = clock.getElapsedTime();

    // 1. Slow background drift animations
    particleSystem.rotation.z = time * 0.008;
    particleSystem.rotation.x = Math.sin(time * 0.03) * 0.02;

    // 2. Animate point lights floating to scan the corridor
    cyanLight.position.x = -6 + Math.sin(time * 1.5) * 2;
    cyanLight.position.y = 3 + Math.cos(time * 1.2) * 1.2;
    cyanLight.position.z = 20 + Math.sin(time * 0.8) * 15;

    magentaLight.position.x = 6 + Math.cos(time * 1.5) * 2;
    magentaLight.position.y = 3 + Math.sin(time * 1.2) * 1.2;
    magentaLight.position.z = -30 - Math.cos(time * 0.8) * 15;

    yellowLight.position.y = 5 + Math.sin(time * 2.0) * 1.5;

    // 3. Make camera look at target coordinate
    camera.lookAt(cameraTarget);

    // 4. Render
    renderer.render(scene, camera);
}

// Start loop
animate();

// ── Window Resize Listener ───────────────────────────────────────────────────
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
