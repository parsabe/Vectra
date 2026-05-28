import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

// Import Three.js post-processing components
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

console.log('%c[VECTRA PRESENTATION] Initializing 16-Stage Bloom Scrollytelling Engine...', 'color: #ffffff; font-weight: bold;');

// DOM Elements
const canvas = document.getElementById('bg-canvas');
if (!canvas) {
    console.error('[SYSTEM_ERR] WebGL Canvas "bg-canvas" not found in DOM.');
}

// ── Lenis Smooth Scrolling Setup ─────────────────────────────────────────────
const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    direction: 'vertical',
    gestureDirection: 'vertical',
    smooth: true,
    mouseMultiplier: 0.95,
    smoothTouch: false,
    touchMultiplier: 1.5,
    infinite: false,
});

// Update ScrollTrigger on Lenis scroll
lenis.on('scroll', ScrollTrigger.update);

// Sync GSAP ticker with Lenis raf
gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);

// ── Three.js Scene Configuration ─────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x010103);
scene.fog = new THREE.FogExp2(0x010103, 0.02); // space depth fog

// Camera setup
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 500);
const cameraTarget = new THREE.Vector3(0, 0, 0);

// WebGL Renderer Setup
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance"
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// ── Post-Processing Bloom Setup (UnrealBloomPass) ─────────────────────────────
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.8,   // Massive blown-out bloom strength
    0.5,   // bloom radius
    0.8    // bloom threshold
);
composer.addPass(bloomPass);

// ── Ambient and Neon Spotlight Rigs ──────────────────────────────────────────
const ambientLight = new THREE.AmbientLight(0x0d0e1a, 2.5);
scene.add(ambientLight);

// Neon spotlights
const cyanLight = new THREE.PointLight(0x00f3ff, 6, 60);
cyanLight.position.set(-8, 4, 15);
scene.add(cyanLight);

const magentaLight = new THREE.PointLight(0xff00ff, 1, 60);
magentaLight.position.set(8, -4, -10);
scene.add(magentaLight);

const yellowLight = new THREE.PointLight(0xeab308, 1, 50);
yellowLight.position.set(0, 6, -15);
scene.add(yellowLight);

// Rim lighting to sketch outlines
const rimLight = new THREE.DirectionalLight(0xffffff, 2.0);
rimLight.position.set(5, 5, -10);
scene.add(rimLight);

// ── Background Stardust (BufferGeometry Points with Additive Blending) ────────
const starCount = 6000;
const starGeometry = new THREE.BufferGeometry();
const starPositions = new Float32Array(starCount * 3);
const starColors = new Float32Array(starCount * 3);

for (let i = 0; i < starCount; i++) {
    // Distribute stardust in a sphere wrapping the sun
    const radius = 12 + Math.random() * 95;
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    
    starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    starPositions[i * 3 + 2] = radius * Math.cos(phi);

    // Multi-colored stardust (cyan, fuchsia, white)
    const colorChance = Math.random();
    if (colorChance < 0.25) {
        starColors[i * 3] = 0.0;
        starColors[i * 3 + 1] = 0.95;
        starColors[i * 3 + 2] = 1.0;
    } else if (colorChance < 0.5) {
        starColors[i * 3] = 1.0;
        starColors[i * 3 + 1] = 0.0;
        starColors[i * 3 + 2] = 1.0;
    } else {
        starColors[i * 3] = 1.0;
        starColors[i * 3 + 1] = 1.0;
        starColors[i * 3 + 2] = 1.0;
    }
}

starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

const starMaterial = new THREE.PointsMaterial({
    size: 0.35,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending
});
const stardust = new THREE.Points(starGeometry, starMaterial);
scene.add(stardust);

// ── Glowing Celestial Sun Core ──────────────────────────────────────────────
const planetGroup = new THREE.Group();

// Outer Shell: Emissive grid sphere
const pCanvas = document.createElement('canvas');
pCanvas.width = 512;
pCanvas.height = 512;
const pCtx = pCanvas.getContext('2d');
pCtx.fillStyle = '#010204';
pCtx.fillRect(0, 0, 512, 512);
pCtx.strokeStyle = 'rgba(0, 243, 255, 0.45)';
pCtx.lineWidth = 1.5;
for (let i = 0; i <= 512; i += 32) {
    pCtx.beginPath(); pCtx.moveTo(i, 0); pCtx.lineTo(i, 512); pCtx.stroke();
    pCtx.beginPath(); pCtx.moveTo(0, i); pCtx.lineTo(512, i); pCtx.stroke();
}
const gridTexture = new THREE.CanvasTexture(pCanvas);

const outerGeom = new THREE.SphereGeometry(2.5, 64, 64);
const outerMat = new THREE.MeshStandardMaterial({
    map: gridTexture,
    roughness: 0.1,
    metalness: 0.9,
    emissive: 0x00f3ff,
    emissiveMap: gridTexture,
    emissiveIntensity: 6.0,
    transparent: true,
    opacity: 0.7
});
const outerPlanet = new THREE.Mesh(outerGeom, outerMat);
planetGroup.add(outerPlanet);

// Inner Core: Blown-out white/cyan glow center
const innerGeom = new THREE.SphereGeometry(2.4, 32, 32);
const innerMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.95
});
const innerPlanet = new THREE.Mesh(innerGeom, innerMat);
planetGroup.add(innerPlanet);

// Corona: Cyan additive glow boundary
const coronaGeom = new THREE.SphereGeometry(2.7, 32, 32);
const coronaMat = new THREE.MeshBasicMaterial({
    color: 0x00f3ff,
    transparent: true,
    opacity: 0.45,
    blending: THREE.AdditiveBlending
});
const coronaMesh = new THREE.Mesh(coronaGeom, coronaMat);
planetGroup.add(coronaMesh);

// Saturn concentric rings
const ringGeom = new THREE.RingGeometry(3.3, 7.8, 64);
ringGeom.rotateX(Math.PI / 2);

const rCanvas = document.createElement('canvas');
rCanvas.width = 512;
rCanvas.height = 8;
const rCtx = rCanvas.getContext('2d');
const ringGradient = rCtx.createLinearGradient(0, 0, 512, 0);
ringGradient.addColorStop(0, 'rgba(0, 243, 255, 0.7)');
ringGradient.addColorStop(0.18, 'rgba(0, 243, 255, 0.15)');
ringGradient.addColorStop(0.35, 'rgba(255, 0, 255, 0.7)');
ringGradient.addColorStop(0.5, 'rgba(255, 0, 255, 0.18)');
ringGradient.addColorStop(0.7, 'rgba(234, 179, 8, 0.8)');
ringGradient.addColorStop(0.85, 'rgba(234, 179, 8, 0.2)');
ringGradient.addColorStop(1.0, 'rgba(0, 243, 255, 0)');
rCtx.fillStyle = ringGradient;
rCtx.fillRect(0, 0, 512, 8);
const ringTexture = new THREE.CanvasTexture(rCanvas);

const ringMat = new THREE.MeshBasicMaterial({
    map: ringTexture,
    transparent: true,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
});
const ringMesh = new THREE.Mesh(ringGeom, ringMat);
planetGroup.add(ringMesh);

// Apply Saturn axis tilt
planetGroup.rotation.x = 0.4;
planetGroup.rotation.z = 0.15;
scene.add(planetGroup);

// ── GSAP ScrollTrigger 16-Stage Timeline ────────────────────────────────────
// Stage Coordinates Mapping for 16 Snap Sections (0 to 15)
const steps = [
    { pos: {x: 0, y: 0, z: 11.5}, target: {x: 0, y: 0, z: 0} }, // Sec 0: Hero
    { pos: {x: -2.2, y: 0.4, z: 9.0}, target: {x: 0.8, y: -0.2, z: 0} }, // Sec 1: Related Work Math
    { pos: {x: 0.0, y: 0.0, z: 6.5}, target: {x: 0, y: 0, z: 0} }, // Sec 2: Figure 1
    { pos: {x: 0.0, y: 0.0, z: 5.8}, target: {x: 0, y: 0, z: 0} }, // Sec 3: Figure 6
    { pos: {x: -3.5, y: 1.2, z: 8.5}, target: {x: 1.2, y: -0.3, z: -0.5} }, // Sec 4: Semantic Consistency Math
    { pos: {x: 0.0, y: 0.0, z: 6.0}, target: {x: 0, y: 0, z: 0} }, // Sec 5: Figure 3
    { pos: {x: 0.0, y: -1.8, z: 5.5}, target: {x: 0.0, y: 0.5, z: 0.5} }, // Sec 6: Figure 2
    { pos: {x: 2.2, y: -1.0, z: 7.5}, target: {x: -0.8, y: 0.3, z: 0.3} }, // Sec 7: Generative 3D Math
    { pos: {x: 0.0, y: 0.0, z: 5.0}, target: {x: 0, y: 0, z: 0} }, // Sec 8: Figure 7
    { pos: {x: 3.5, y: 0.0, z: 4.5}, target: {x: -1.2, y: 0.0, z: 0.6} }, // Sec 9: Figure 13
    { pos: {x: 0.0, y: 0.1, z: 7.0}, target: {x: 1.0, y: -0.2, z: 0} }, // Sec 10: Methodology Text
    { pos: {x: 0.0, y: 0.0, z: 6.5}, target: {x: 0, y: 0, z: 0} }, // Sec 11: Methodology Flowchart
    { pos: {x: 0.0, y: 0.1, z: 4.2}, target: {x: 0, y: 0, z: 0} }, // Sec 12: Figure 11
    { pos: {x: 0.0, y: 3.2, z: 3.5}, target: {x: 0, y: 0, z: -0.2} }, // Sec 13: Figure 12
    { pos: {x: 0.0, y: 0.0, z: 10.0}, target: {x: 0, y: 0, z: 0} }, // Sec 14: Conclusion
    { pos: {x: 0.0, y: 0.0, z: 12.0}, target: {x: 0, y: 0, z: 0} }  // Sec 15: References & Launch Portal
];

// Set initial camera variables
camera.position.set(steps[0].pos.x, steps[0].pos.y, steps[0].pos.z);
cameraTarget.set(steps[0].target.x, steps[0].target.y, steps[0].target.z);

// Define master ScrollTrigger timeline for 16 sections
const mainTimeline = gsap.timeline({
    scrollTrigger: {
        trigger: '#scroll-container',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.5,
        pin: '#scroll-wrapper',
        snap: {
            snapTo: 1 / 15, // Snapping intervals across 16 sections
            duration: { min: 0.3, max: 0.8 },
            delay: 0.1,
            ease: 'power1.inOut'
        }
    }
});

// Set initial states for absolute sections
const totalSections = 16;
for (let i = 0; i < totalSections; i++) {
    const el = document.getElementById(`section-${i}`);
    if (el) {
        if (i === 0) {
            gsap.set(el, { autoAlpha: 1, y: 0, scale: 1, pointerEvents: 'auto' });
        } else {
            gsap.set(el, { autoAlpha: 0, y: 50, scale: 0.35, pointerEvents: 'none' });
        }
    }
}

// Build scroll-bound 3D orbits and content entries
for (let i = 0; i < 15; i++) {
    const next = steps[i + 1];
    
    // 1. Camera flight path
    mainTimeline.to(camera.position, {
        x: next.pos.x,
        y: next.pos.y,
        z: next.pos.z,
        ease: 'power1.inOut'
    }, i);

    mainTimeline.to(cameraTarget, {
        x: next.target.x,
        y: next.target.y,
        z: next.target.z,
        ease: 'power1.inOut'
    }, i);

    // 2. Stardust and planet Y-rotation (ONLY on scroll, stops when scroll stops!)
    mainTimeline.to(planetGroup.rotation, {
        y: (i + 1) * (Math.PI * 0.35),
        ease: 'none'
    }, i);

    mainTimeline.to(stardust.rotation, {
        y: (i + 1) * (Math.PI * 0.17),
        ease: 'none'
    }, i);

    // 3. Spotlight adjustments
    if (i === 0) {
        mainTimeline.to(cyanLight, { intensity: 1, ease: 'power1.inOut' }, i);
        mainTimeline.to(magentaLight, { intensity: 8, ease: 'power1.inOut' }, i);
    } else if (i === 3) {
        mainTimeline.to(magentaLight, { intensity: 2, ease: 'power1.inOut' }, i);
        mainTimeline.to(yellowLight, { intensity: 8, ease: 'power1.inOut' }, i);
    } else if (i === 6) {
        mainTimeline.to(yellowLight, { intensity: 1, ease: 'power1.inOut' }, i);
        mainTimeline.to(cyanLight, { intensity: 8, ease: 'power1.inOut' }, i);
    } else if (i === 9) {
        mainTimeline.to(cyanLight, { intensity: 2, ease: 'power1.inOut' }, i);
        mainTimeline.to(magentaLight, { intensity: 8, ease: 'power1.inOut' }, i);
    } else if (i === 12) {
        mainTimeline.to(cyanLight, { intensity: 6, ease: 'power1.inOut' }, i);
        mainTimeline.to(yellowLight, { intensity: 6, ease: 'power1.inOut' }, i);
    }

    // 4. Section crossfades
    const curSec = document.getElementById(`section-${i}`);
    const nextSec = document.getElementById(`section-${i + 1}`);

    const exitScale = (i % 2 === 0) ? 1.55 : 0.35; // Alternate zoom past screen and zoom away
    mainTimeline.to(curSec, {
        autoAlpha: 0,
        y: -50,
        scale: exitScale,
        pointerEvents: 'none',
        duration: 0.8
    }, i);

    mainTimeline.fromTo(nextSec, {
        autoAlpha: 0,
        y: 50,
        scale: 0.35,
        pointerEvents: 'none'
    }, {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        pointerEvents: 'auto',
        duration: 0.8
    }, i + 0.2); // starts slightly late to overlay transition beautifully
}

// Update Scroll Progress bar and highlight Nav dots on window scroll
window.addEventListener('scroll', () => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollHeight > 0) {
        const scrollPercent = (window.scrollY / scrollHeight) * 100;
        const progressBar = document.getElementById('scroll-progress');
        if (progressBar) {
            progressBar.style.width = `${scrollPercent}%`;
        }

        // Highlight active nav dot
        const currentSlide = Math.round((window.scrollY / scrollHeight) * 15);
        for (let i = 0; i < totalSections; i++) {
            const dot = document.getElementById(`dot-${i}`);
            if (dot) {
                if (i === currentSlide) dot.classList.add('active');
                else dot.classList.remove('active');
            }
        }
    }
});

// ── Methodology Automatic Flowchart Loop (Section 11) ────────────────────────
const pipelineNodeInfo = {
    'node-input': "INPUT SOURCE: Parses viewport coordinate boundaries or text prompt streams.",
    'node-segment': "U2NET SEGMENTER: Isolates boundaries, flattens alpha to white, purging blob artifacts.",
    'node-forge': "TRIPOSR INFRASTRUCTURE: Projects pixels to orthogonal planes, marching cubes mesh extrusion.",
    'node-dbse': "DBSE SHADER MASK: Surgically punch-holes by overriding intersection opacity values to zero.",
    'node-inject': "GLB RIGIDBODY: Synchronizes generated meshes to physical Cannon.js collider grids."
};

function runFlowchartAutoLoop() {
    const nodes = ['node-input', 'node-segment', 'node-forge', 'node-dbse', 'node-inject'];
    const paths = ['flow-path-1', 'flow-path-2', 'flow-path-3', 'flow-path-4', 'flow-path-5'];
    const legendEl = document.getElementById('flow-node-details');

    let activeIdx = 0;

    setInterval(() => {
        // Update nodes opacities
        nodes.forEach((nodeId, idx) => {
            const el = document.getElementById(nodeId);
            if (el) {
                const rect = el.querySelector('rect');
                if (idx === activeIdx) {
                    rect.setAttribute('stroke-opacity', '1');
                    rect.setAttribute('fill-opacity', '0.22');
                    rect.setAttribute('stroke-width', '1.8');
                } else {
                    rect.setAttribute('stroke-opacity', '0.25');
                    rect.setAttribute('fill-opacity', '0.02');
                    rect.setAttribute('stroke-width', '1');
                }
            }
        });

        // Update path indicators
        paths.forEach((pathId, idx) => {
            const pathEl = document.getElementById(pathId);
            if (pathEl) {
                if (idx === activeIdx) {
                    pathEl.setAttribute('stroke-opacity', '1');
                    pathEl.setAttribute('stroke-width', '1.8');
                    pathEl.classList.add('flow-line');
                } else {
                    pathEl.setAttribute('stroke-opacity', '0.15');
                    pathEl.setAttribute('stroke-width', '1');
                    pathEl.classList.remove('flow-line');
                }
            }
        });

        // Update telemetry caption text
        const activeNodeId = nodes[activeIdx];
        if (legendEl && pipelineNodeInfo[activeNodeId]) {
            legendEl.textContent = `Telemetry Logs: ${pipelineNodeInfo[activeNodeId]}`;
        }

        activeIdx = (activeIdx + 1) % nodes.length;
    }, 2500); // changes every 2.5 seconds automatically
}

// DOMContentLoaded triggers
document.addEventListener('DOMContentLoaded', () => {
    runFlowchartAutoLoop();
});

// ── WebGL Animation and Post-Processing Render Loop ──────────────────────────
function animate() {
    requestAnimationFrame(animate);

    // Stardust slowly drifting internally (planet core is controlled via GSAP scrub)
    stardust.rotation.y += 0.0003;

    // Force camera alignment with current target coordinates
    camera.lookAt(cameraTarget);

    // Render using the post-processing composer (UnrealBloomPass)
    composer.render();
}
animate();

// ── Window Resize adjustments ────────────────────────────────────────────────
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    composer.setSize(window.innerWidth, window.innerHeight);
});
