import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

console.log('%c[VECTRA PRESENTATION] Initializing Smooth Kinetic Scrollytelling Engine...', 'color: #39ff14; font-weight: bold;');

// DOM Elements
const canvas = document.getElementById('webgl-canvas');
if (!canvas) {
    console.error('[SYSTEM_ERR] WebGL Canvas not found in DOM.');
}

// ── Lenis Smooth Scrolling Setup ─────────────────────────────────────────────
// Setup Lenis smooth scroll for a premium, buttery feel (like peachweb.io)
const lenis = new Lenis({
    duration: 1.4,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // smooth exponential out
    direction: 'vertical',
    gestureDirection: 'vertical',
    smooth: true,
    mouseMultiplier: 0.95,
    smoothTouch: false,
    touchMultiplier: 1.5,
    infinite: false,
});

// Update ScrollTrigger on Lenis scroll tick
lenis.on('scroll', ScrollTrigger.update);

// Sync GSAP ticker with Lenis requestAnimationFrame loop
gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);

// ── Three.js Scene Configuration ─────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020204);
scene.fog = new THREE.FogExp2(0x020204, 0.015); // Volumetric depths fog

// Camera setup
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);

// Camera Target coordinate vector (used in lookAt loop)
const cameraTarget = new THREE.Vector3(0, 1.5, 0);

// WebGL Renderer Setup
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance"
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// ── Lights Setup ─────────────────────────────────────────────────────────────
const ambientLight = new THREE.AmbientLight(0x0a0d14, 1.8);
scene.add(ambientLight);

// Neon colored floating point lights
const cyanLight = new THREE.PointLight(0x00f3ff, 5, 55);
cyanLight.position.set(-6, 3, 20);
scene.add(cyanLight);

const magentaLight = new THREE.PointLight(0xff00ff, 5, 55);
magentaLight.position.set(6, 3, -30);
scene.add(magentaLight);

const yellowLight = new THREE.PointLight(0xeab308, 4, 45);
yellowLight.position.set(0, 5, -80);
scene.add(yellowLight);

// ── Procedural Environment (Quarantine Matrix) ───────────────────────────────
// Technical ground grid
const gridHelper = new THREE.GridHelper(300, 120, 0xff00ff, 0x00f3ff);
gridHelper.position.y = -2.5;
scene.add(gridHelper);

// Twistable wireframe corridor tunnel
const tunnelGroup = new THREE.Group();
const numGates = 35;
const gateSpacing = 6.5;

for (let i = 0; i < numGates; i++) {
    const zPos = 35 - i * gateSpacing; // Z from 35 down to -192
    const sizeWidth = 14 + Math.sin(i * 0.4) * 2;
    const sizeHeight = 7.5 + Math.cos(i * 0.4) * 1.5;

    const geom = new THREE.BoxGeometry(sizeWidth, sizeHeight, 2);
    const edges = new THREE.EdgesGeometry(geom);

    let themeColor;
    if (i % 3 === 0) themeColor = 0x00f3ff;
    else if (i % 3 === 1) themeColor = 0xff00ff;
    else themeColor = 0xeab308;

    const mat = new THREE.LineBasicMaterial({
        color: themeColor,
        transparent: true,
        opacity: Math.max(0.42 - (i / numGates) * 0.28, 0.08)
    });

    const gate = new THREE.LineSegments(edges, mat);
    gate.position.set(0, 1.25, zPos);
    tunnelGroup.add(gate);
}
scene.add(tunnelGroup);

// Volumetric Neural Particle Nodes (represent Gaussian splat coordinates)
const particleCount = 3800;
const particleGeometry = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);
const colors = new Float32Array(particleCount * 3);

const colorCyan = new THREE.Color(0x00f3ff);
const colorMagenta = new THREE.Color(0xff00ff);
const colorYellow = new THREE.Color(0xeab308);

for (let i = 0; i < particleCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const radius = 5.0 + Math.random() * 16; // Distribution envelope
    const x = Math.cos(theta) * radius;
    const y = Math.sin(theta) * radius + 1.25;
    const z = Math.random() * 250 - 190; // Z coordinates range

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

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

// Glowing circular particle texture via Canvas
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
    size: 0.3,
    map: pTexture,
    vertexColors: true,
    transparent: true,
    opacity: 0.88,
    blending: THREE.AdditiveBlending,
    depthWrite: false
});

const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
scene.add(particleSystem);

// ── GSAP ScrollTrigger Collaborative Animations ──────────────────────────────
// Define initial positions
camera.position.set(0, 3, 40);
cameraTarget.set(0, 1.25, 5);

// Create timeline scrub bound directly to viewport scroll
const scrollTimeline = gsap.timeline({
    scrollTrigger: {
        trigger: 'body',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.8, // Slightly higher scrub lag for smoother float transitions
    }
});

// Animate camera position and target through the matrix (Z-axis flight path)
scrollTimeline
    // Phase 1 (Hero to Radiance)
    .to(camera.position, { x: 4.5, y: 1.8, z: 15, ease: 'power1.inOut' }, 0)
    .to(cameraTarget, { x: -2.5, y: 0.6, z: -15, ease: 'power1.inOut' }, 0)
    
    // Phase 2 (Radiance to Semantic)
    .to(camera.position, { x: -5.5, y: 2.8, z: -20, ease: 'power1.inOut' }, 1)
    .to(cameraTarget, { x: 3, y: 0.9, z: -55, ease: 'power1.inOut' }, 1)
    
    // Phase 3 (Semantic to Gaussian)
    .to(camera.position, { x: 0, y: 0.15, z: -70, ease: 'power1.inOut' }, 2)
    .to(cameraTarget, { x: 0, y: 0.75, z: -105, ease: 'power1.inOut' }, 2)
    
    // Phase 4 (Gaussian to Methodology)
    .to(camera.position, { x: 0, y: 2.8, z: -115, ease: 'power1.inOut' }, 3)
    .to(cameraTarget, { x: 0, y: 1.25, z: -170, ease: 'power1.inOut' }, 3);

// BACKGROUND SCROLL COLLABORATION: Make environment react dynamically to scroll!
scrollTimeline
    // 1. Twist the wireframe tunnel gates based on scroll progress
    .to(tunnelGroup.rotation, { z: Math.PI * 1.5, ease: 'none' }, 0)
    
    // 2. Morph the particle swarm scale (breathing warp effect)
    .to(particleSystem.scale, { x: 1.25, y: 1.25, z: 0.8, ease: 'power1.inOut' }, 0)
    .to(particleSystem.scale, { x: 0.75, y: 0.75, z: 1.25, ease: 'power1.inOut' }, 1.5)
    .to(particleSystem.scale, { x: 1.0, y: 1.0, z: 1.0, ease: 'power1.inOut' }, 3)
    
    // 3. Move point lights alongside Z-axis path to stay with the camera
    .to(cyanLight.position, { z: -100, ease: 'none' }, 0)
    .to(magentaLight.position, { z: -110, ease: 'none' }, 0)
    .to(yellowLight.position, { z: -130, ease: 'none' }, 0)
    
    // 4. Animate light intensity peaks to light up active sections
    .to(cyanLight, { intensity: 10, ease: 'power1.inOut' }, 0.5)
    .to(cyanLight, { intensity: 4, ease: 'power1.inOut' }, 2.0)
    .to(magentaLight, { intensity: 10, ease: 'power1.inOut' }, 1.5)
    .to(magentaLight, { intensity: 4, ease: 'power1.inOut' }, 3.0)

    // 5. Morph Fog parameters & Color signatures dynamically
    .to(scene.fog.color, { r: 0.005, g: 0.065, b: 0.095, ease: 'power1.inOut' }, 0.5) // Cyan zone
    .to(scene.fog.color, { r: 0.08, g: 0.005, b: 0.095, ease: 'power1.inOut' }, 1.5)  // Magenta zone
    .to(scene.fog.color, { r: 0.095, g: 0.085, b: 0.005, ease: 'power1.inOut' }, 2.5) // Yellow zone
    .to(scene.fog.color, { r: 0.008, g: 0.008, b: 0.016, ease: 'power1.inOut' }, 3.5) // Reset dark
    
    .to(scene.fog, { density: 0.024, ease: 'power1.inOut' }, 0.5)
    .to(scene.fog, { density: 0.012, ease: 'power1.inOut' }, 2.0);

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

    // 1. Constant minor background drift (prevents visual staticness when scroll stops)
    particleSystem.rotation.z = time * 0.006;
    particleSystem.rotation.x = Math.sin(time * 0.02) * 0.015;

    // 2. Continuous floating light orbits
    cyanLight.position.x += Math.sin(time * 1.2) * 0.05;
    cyanLight.position.y += Math.cos(time * 0.9) * 0.03;
    
    magentaLight.position.x += Math.cos(time * 1.2) * 0.05;
    magentaLight.position.y += Math.sin(time * 0.9) * 0.03;

    // 3. Force camera lookAt coordinate focus
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
