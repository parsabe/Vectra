import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

console.log('%c[VECTRA PRESENTATION] Initializing Pinned 3D Scrollytelling Engine...', 'color: #00f3ff; font-weight: bold;');

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
scene.background = new THREE.Color(0x020204);
scene.fog = new THREE.FogExp2(0x020204, 0.025); // Deep space volumetric fog

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

// ── Ambient and Neon Spotlight Rigs ──────────────────────────────────────────
const ambientLight = new THREE.AmbientLight(0x0a0c16, 2.5);
scene.add(ambientLight);

// Point spotlights
const cyanLight = new THREE.PointLight(0x00f3ff, 6, 60);
cyanLight.position.set(-8, 4, 15);
scene.add(cyanLight);

const magentaLight = new THREE.PointLight(0xff00ff, 1, 60);
magentaLight.position.set(8, -4, -10);
scene.add(magentaLight);

const yellowLight = new THREE.PointLight(0xeab308, 1, 50);
yellowLight.position.set(0, 6, -15);
scene.add(yellowLight);

// Rim lighting to outline meshes
const rimLight = new THREE.DirectionalLight(0xffffff, 1.5);
rimLight.position.set(5, 5, -10);
scene.add(rimLight);

// ── Background Starfield (BufferGeometry Points) ─────────────────────────────
const starCount = 4000;
const starGeometry = new THREE.BufferGeometry();
const starPositions = new Float32Array(starCount * 3);
const starColors = new Float32Array(starCount * 3);

for (let i = 0; i < starCount; i++) {
    // Distribute randomly inside a large sphere
    const radius = 100 + Math.random() * 100;
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    
    starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    starPositions[i * 3 + 2] = radius * Math.cos(phi);

    // Cyberpunk tinted stars (cyan, fuchsia, white)
    const colorChance = Math.random();
    if (colorChance < 0.25) {
        // Neon Cyan
        starColors[i * 3] = 0.0;
        starColors[i * 3 + 1] = 0.95;
        starColors[i * 3 + 2] = 1.0;
    } else if (colorChance < 0.5) {
        // Neon Fuchsia
        starColors[i * 3] = 1.0;
        starColors[i * 3 + 1] = 0.0;
        starColors[i * 3 + 2] = 1.0;
    } else {
        // Bright White
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
    opacity: 0.65
});
const starfield = new THREE.Points(starGeometry, starMaterial);
scene.add(starfield);

// ── Saturn-Like Cyber Celestial Body ────────────────────────────────────────
const planetGroup = new THREE.Group();

// Generate a procedural technical grid texture map
const pCanvas = document.createElement('canvas');
pCanvas.width = 512;
pCanvas.height = 512;
const pCtx = pCanvas.getContext('2d');
pCtx.fillStyle = '#030408';
pCtx.fillRect(0, 0, 512, 512);
pCtx.strokeStyle = 'rgba(0, 243, 255, 0.4)';
pCtx.lineWidth = 1;
for (let i = 0; i <= 512; i += 32) {
    pCtx.beginPath(); pCtx.moveTo(i, 0); pCtx.lineTo(i, 512); pCtx.stroke();
    pCtx.beginPath(); pCtx.moveTo(0, i); pCtx.lineTo(512, i); pCtx.stroke();
}
const gridTexture = new THREE.CanvasTexture(pCanvas);

// Outer Sphere (Grid structured core)
const outerGeom = new THREE.SphereGeometry(2.5, 64, 64);
const outerMat = new THREE.MeshStandardMaterial({
    map: gridTexture,
    roughness: 0.2,
    metalness: 0.85,
    emissive: 0x00f3ff,
    emissiveMap: gridTexture,
    emissiveIntensity: 0.15,
    transparent: true,
    opacity: 0.75
});
const outerPlanet = new THREE.Mesh(outerGeom, outerMat);
planetGroup.add(outerPlanet);

// Inner Sphere (Fuchsia glowing sub-core)
const innerGeom = new THREE.SphereGeometry(2.4, 32, 32);
const innerMat = new THREE.MeshBasicMaterial({
    color: 0xff00ff,
    transparent: true,
    opacity: 0.85
});
const innerPlanet = new THREE.Mesh(innerGeom, innerMat);
planetGroup.add(innerPlanet);

// Ring Geometry
const ringGeom = new THREE.RingGeometry(3.3, 7.5, 64);
ringGeom.rotateX(Math.PI / 2);

// concentric gradient texture
const rCanvas = document.createElement('canvas');
rCanvas.width = 512;
rCanvas.height = 8;
const rCtx = rCanvas.getContext('2d');
const ringGradient = rCtx.createLinearGradient(0, 0, 512, 0);
ringGradient.addColorStop(0, 'rgba(0, 243, 255, 0.65)');
ringGradient.addColorStop(0.15, 'rgba(0, 243, 255, 0.1)');
ringGradient.addColorStop(0.35, 'rgba(255, 0, 255, 0.65)');
ringGradient.addColorStop(0.5, 'rgba(255, 0, 255, 0.15)');
ringGradient.addColorStop(0.7, 'rgba(234, 179, 8, 0.75)');
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

// ── Volumetric Particle Asteroid Belt ────────────────────────────────────────
const asteroidCount = 3500;
const asteroidGeometry = new THREE.BufferGeometry();
const asteroidPositions = new Float32Array(asteroidCount * 3);
const asteroidColors = new Float32Array(asteroidCount * 3);

for (let i = 0; i < asteroidCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const radius = 4.2 + Math.random() * 8.5; // distributed between outer core and ring boundary
    
    const x = Math.cos(theta) * radius;
    const z = Math.sin(theta) * radius;
    const y = (Math.random() - 0.5) * 0.35; // Thin vertical height

    asteroidPositions[i * 3] = x;
    asteroidPositions[i * 3 + 1] = y;
    asteroidPositions[i * 3 + 2] = z;

    // Distribute color channels (cyan, fuchsia, yellow)
    const colorIndex = Math.random();
    if (colorIndex < 0.4) {
        // Cyan
        asteroidColors[i * 3] = 0.0;
        asteroidColors[i * 3 + 1] = 0.95;
        asteroidColors[i * 3 + 2] = 1.0;
    } else if (colorIndex < 0.75) {
        // Fuchsia
        asteroidColors[i * 3] = 1.0;
        asteroidColors[i * 3 + 1] = 0.0;
        asteroidColors[i * 3 + 2] = 1.0;
    } else {
        // Yellow
        asteroidColors[i * 3] = 0.92;
        asteroidColors[i * 3 + 1] = 0.7;
        asteroidColors[i * 3 + 2] = 0.03;
    }
}

asteroidGeometry.setAttribute('position', new THREE.BufferAttribute(asteroidPositions, 3));
asteroidGeometry.setAttribute('color', new THREE.BufferAttribute(asteroidColors, 3));

const asteroidMaterial = new THREE.PointsMaterial({
    size: 0.055,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
});
const asteroidBelt = new THREE.Points(asteroidGeometry, asteroidMaterial);
planetGroup.add(asteroidBelt);

// Set planet group axis tilt (Saturn's coordinate parameters)
planetGroup.rotation.x = 0.4;
planetGroup.rotation.z = 0.15;
scene.add(planetGroup);

// ── GSAP ScrollTrigger Pinned Timeline ───────────────────────────────────────
// Steps coordinate coordinates
const steps = [
    { pos: {x: 0, y: 0, z: 11.0}, target: {x: 0, y: 0, z: 0} }, // Sec 0 (Hero)
    { pos: {x: -2.5, y: 0.5, z: 8.5}, target: {x: 1.0, y: -0.2, z: 0} }, // Sec 1 (Related)
    { pos: {x: -4.2, y: 1.5, z: 6.0}, target: {x: 1.4, y: -0.3, z: -0.5} }, // Sec 2 (Methodology)
    { pos: {x: 2.2, y: -1.0, z: 4.8}, target: {x: -1.0, y: 0.3, z: 0.3} }, // Sec 3 (Experiments)
    { pos: {x: 3.2, y: -0.5, z: 3.5}, target: {x: -1.4, y: 0.2, z: 0.5} }, // Sec 4 (Discussion)
    { pos: {x: 0.0, y: 0.1, z: 2.8}, target: {x: 0, y: 0, z: 0} }, // Sec 5 (Conclusion)
    { pos: {x: 0.0, y: 3.2, z: 2.5}, target: {x: 0, y: 0, z: -0.2} }  // Sec 6 (References)
];

// Set initial camera variables
camera.position.set(steps[0].pos.x, steps[0].pos.y, steps[0].pos.z);
cameraTarget.set(steps[0].target.x, steps[0].target.y, steps[0].target.z);

// Define master ScrollTrigger timeline
const mainTimeline = gsap.timeline({
    scrollTrigger: {
        trigger: '#scroll-container',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.5,
        pin: '#scroll-wrapper',
        snap: {
            snapTo: 1 / 6,
            duration: { min: 0.3, max: 0.8 },
            delay: 0.1,
            ease: 'power1.inOut'
        }
    }
});

// Set initial DOM states for absolute sections
const totalSections = 7;
for (let i = 0; i < totalSections; i++) {
    const el = document.getElementById(`section-${i}`);
    if (el) {
        if (i === 0) {
            gsap.set(el, { autoAlpha: 1, y: 0, scale: 1, pointerEvents: 'auto' });
        } else {
            gsap.set(el, { autoAlpha: 0, y: 50, scale: 0.4, pointerEvents: 'none' });
        }
    }
}

// Build scroll-linked 3D transitions and content overlays
for (let i = 0; i < 6; i++) {
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

    // 2. Planet & starfield rotation (drives ONLY on scroll, stops when scroll stops!)
    mainTimeline.to(planetGroup.rotation, {
        y: (i + 1) * (Math.PI * 0.6),
        ease: 'none'
    }, i);

    mainTimeline.to(starfield.rotation, {
        y: (i + 1) * (Math.PI * 0.3),
        ease: 'none'
    }, i);

    // 3. Spotlight intensity variations matching the themes
    if (i === 0) {
        mainTimeline.to(cyanLight, { intensity: 1, ease: 'power1.inOut' }, i);
        mainTimeline.to(magentaLight, { intensity: 8, ease: 'power1.inOut' }, i);
    } else if (i === 1) {
        mainTimeline.to(magentaLight, { intensity: 1, ease: 'power1.inOut' }, i);
        mainTimeline.to(yellowLight, { intensity: 8, ease: 'power1.inOut' }, i);
    } else if (i === 2) {
        mainTimeline.to(yellowLight, { intensity: 1, ease: 'power1.inOut' }, i);
        mainTimeline.to(cyanLight, { intensity: 8, ease: 'power1.inOut' }, i);
    } else if (i === 3) {
        mainTimeline.to(cyanLight, { intensity: 2, ease: 'power1.inOut' }, i);
        mainTimeline.to(magentaLight, { intensity: 8, ease: 'power1.inOut' }, i);
    } else if (i === 4) {
        mainTimeline.to(magentaLight, { intensity: 2, ease: 'power1.inOut' }, i);
        mainTimeline.to(cyanLight, { intensity: 6, ease: 'power1.inOut' }, i);
        mainTimeline.to(yellowLight, { intensity: 6, ease: 'power1.inOut' }, i);
    } else if (i === 5) {
        mainTimeline.to(cyanLight, { intensity: 4, ease: 'power1.inOut' }, i);
        mainTimeline.to(yellowLight, { intensity: 4, ease: 'power1.inOut' }, i);
        mainTimeline.to(magentaLight, { intensity: 4, ease: 'power1.inOut' }, i);
    }

    // 4. Section exit/entry crossfades
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
        const currentSlide = Math.round((window.scrollY / scrollHeight) * 6);
        for (let i = 0; i < totalSections; i++) {
            const dot = document.getElementById(`dot-${i}`);
            if (dot) {
                if (i === currentSlide) dot.classList.add('active');
                else dot.classList.remove('active');
            }
        }
    }
});

// ── Interactive Related Works Panel (Section 1) ──────────────────────────────
const formulasData = [
    {
        title: "Volume Rendering integration (NeRF)",
        eq1: "C(\\mathbf{r}) = \\int_{t_n}^{t_f} T(t) \\sigma(\\mathbf{r}(t)) \\mathbf{c}(\mathbf{r}(t), \\mathbf{d}) dt",
        eq2: "T(t) = \\exp\\left( - \\int_{t_n}^{t} \\sigma(\\mathbf{r}(s)) ds \\right)",
        eq3: "t_i \\sim \\mathcal{U} \\left[ t_n + \\frac{i-1}{N}(t_f - t_n), \\; t_n + \\frac{i}{N}(t_f - t_n) \\right]",
        desc: "Models environments as continuous 5D fields. Emitted color is calculated by integrating opacities along virtual camera rays, using numerical stratified sampling to escape voxel limits.",
        fig: "/img/1.png",
        caption: "Figure 2: Neural Radiance Field differentiable rendering pipeline"
    },
    {
        title: "Diagnostics & Evaluation Metrics",
        eq1: "PSNR(I) = 10 \\cdot \\log_{10} \\left( \\frac{MAX(I)^2}{MSE(I)} \\right)",
        eq2: "SSIM(x, y) = \\frac{(2\\mu_x\\mu_y + C_1)(2\\sigma_{xy} + C_2)}{(\\mu_x^2 + \\mu_y^2 + C_1)(\\sigma_x^2 + \\sigma_y^2 + C_2)}",
        eq3: "LPIPS(x, y) = \\sum_{l=1}^L \\frac{1}{H_l W_l} \\sum_{h=1}^{H_l} \\sum_{w=1}^{W_l} ||w_l (x_{lhw} - y_{lhw})||_2^2",
        desc: "Metrics auditing synthetic frames. PSNR computes absolute variance, SSIM maps structural integrity (luminance and covariance), and LPIPS deploys a deep network to evaluate perceptual similarity.",
        fig: "/img/6.png",
        caption: "Figure 5: DTU Database Novel View Synthesis evaluation"
    },
    {
        title: "DietNeRF Semantic Loss",
        eq1: "\\mathcal{L}_{SC, \\ell_2}(I, \\hat{I}) = \\frac{\\lambda}{2} \\| \\phi(I) - \\phi(\\hat{I}) \\|_2^2",
        eq2: "\\mathcal{L}_{SC}(I, \\hat{I}) = \\lambda \\phi(I)^T \\phi(\\hat{I})",
        eq3: "",
        desc: "Prevents geometry collapse when learning from sparse angles. Guides NeRF optimizations using high-level feature maps extracted by pre-trained Vision Transformers (CLIP ViT).",
        fig: "/img/3.png",
        caption: "Figure 3: Few-shot novel view synthesis comparison"
    },
    {
        title: "RegNeRF Regularization",
        eq1: "\\hat{d}_\\theta(\\mathbf{r}) = \\int_{t_n}^{t_f} T(t)\\sigma_\\theta(\\mathbf{r}(t))t \\, dt",
        eq2: "\\mathcal{L}_{DS}(\\theta, \\mathcal{R}_r) = \\sum_{\\mathbf{r} \\in \\mathcal{R}_r} \\sum_{i,j=1}^{S_{patch}-1} \\left( (\\hat{d}(\\mathbf{r}_{i,j}) - \\hat{d}(\\mathbf{r}_{i+1,j}))^2 + (\\hat{d}(\\mathbf{r}_{i,j}) - \\hat{d}(\\mathbf{r}_{i,j+1}))^2 \\right)",
        eq3: "\\mathcal{L}_{total} = \\mathcal{L}_{MSE}(\\theta, \\mathcal{R}_i) + \\lambda_D \\mathcal{L}_{DS}(\\theta, \\mathcal{R}_r) + \\lambda_N \\mathcal{L}_{NLL}(\\theta, \\mathcal{R}_r)",
        desc: "Regularizes unseen coordinates. Samples random patches from virtual camera poses, minimizing depth smoothness gradients and color negative log-likelihoods (normalizing flows).",
        fig: "/img/4.png",
        caption: "Figure 6: RegNeRF scene space annealing and smoothness checks"
    },
    {
        title: "DreamGaussian SDS & Density",
        eq1: "\\nabla_\\Theta \\mathcal{L}_{SDS} = \\mathbb{E}_{t,p,\\epsilon} \\left[ w(t) \\left( \\epsilon_\\phi(I^p_{RGB}; t, \\tilde{I}^r_{RGB}, \\Delta p) - \\epsilon \\right) \\frac{\\partial I^p_{RGB}}{\\partial \\Theta} \right]",
        eq2: "d(\\mathbf{x}) = \\sum_{i} \\alpha_i \\exp \\left( -\\frac{1}{2} (\\mathbf{x} - \\mathbf{x}_i)^T \\Sigma_i^{-1} (\\mathbf{x} - \\mathbf{x}_i) \right)",
        eq3: "",
        desc: "Accelerates text-to-3D generation. Projects Gaussian splats to 2D for Score Distillation Sampling (SDS), and extractsContiguous polygonal surfaces using marching cubes on a volumetric density grid.",
        fig: "/img/7.png",
        caption: "Figure 7: Generative comparison on Image-to-3D models"
    },
    {
        title: "Dynamic3D Temporal Splatting",
        eq1: "f_{i,t}(p) = \\text{sig}(o_i)\\exp \\left( -\\frac{1}{2} (p - \\mu_{i,t})^T \\Sigma_{i,t}^{-1} (p - \\mu_{i,t}) \\right)",
        eq2: "\\Sigma_{2D} = J E \\Sigma E^T J^T",
        eq3: "",
        desc: "Stabilizes structural tracking loops over chronological intervals. Locks geometry features and optimizes exclusively for kinematic translations, projecting coordinates using Zwicker covariance.",
        fig: "/img/11.png",
        caption: "Figure 11: Dynamic Gaussian tracking pipeline"
    }
];

function selectFormula(index) {
    const data = formulasData[index];
    if (!data) return;

    // Update active tab styles
    for (let i = 0; i < formulasData.length; i++) {
        const tab = document.getElementById(`f-tab-${i}`);
        if (tab) {
            if (i === index) tab.classList.add('active');
            else tab.classList.remove('active');
        }
    }

    const detailContainer = document.getElementById('formula-detail-pane');
    const figContainer = document.getElementById('formula-fig-container');
    const figImg = document.getElementById('formula-fig');
    const figCap = document.getElementById('formula-fig-caption');

    if (!detailContainer || !figContainer || !figImg || !figCap) return;

    // Fade out elements before swap
    gsap.to([detailContainer, figContainer], {
        opacity: 0.05,
        y: -10,
        duration: 0.2,
        onComplete: () => {
            detailContainer.replaceChildren();

            const titleNode = document.createElement('h3');
            titleNode.className = 'font-mono text-sm text-cyan-400 font-bold uppercase mb-3 tracking-widest text-glow-cyan';
            titleNode.textContent = data.title;
            detailContainer.appendChild(titleNode);

            const descNode = document.createElement('p');
            descNode.className = 'leading-relaxed text-neutral-300 text-xs md:text-sm mb-4 font-sans';
            descNode.textContent = data.desc;
            detailContainer.appendChild(descNode);

            // Render equations
            const eqs = [data.eq1, data.eq2, data.eq3];
            eqs.forEach(eq => {
                if (eq) {
                    const block = document.createElement('div');
                    block.className = 'my-3.5 p-3.5 rounded-lg bg-neutral-950/20 backdrop-blur-sm border border-neutral-900/10 text-center font-sans text-xs md:text-sm';
                    katex.render(eq, block, { displayMode: true, throwOnError: false });
                    detailContainer.appendChild(block);
                }
            });

            // Update Image
            figImg.setAttribute('src', data.fig);
            figCap.textContent = data.caption;

            // Fade in updated details
            gsap.to([detailContainer, figContainer], { opacity: 1, y: 0, duration: 0.3 });
        }
    });
}

// ── Interactive Methodology Scenarios (Section 2) ───────────────────────────
const scenariosData = {
    extract: {
        text: "<strong>Scenario 1 (Generative Extraction)</strong> handles spatial culling and isolation. Drawing a 2D bounding frustum maps Z-buffer values to define a 3D volumetric mask. U2Net isolates the object silhoutte, applying a Solid Alpha Flattening (pure white background) to bypass TripoSR normalization errors (eliminating blob artifacts). Marching Cubes extracts meshes directly. Finally, <strong>Deep Splat Excavation (DBSE)</strong> overrides splat opacities to zero inside the fragment shader, punching a hole to inject the new GLB model centroid-aligned without clipping.",
        nodes: ['node-input', 'node-segment', 'node-forge', 'node-dbse', 'node-inject'],
        paths: ['flow-path-1', 'flow-path-2', 'flow-path-3', 'flow-path-4', 'flow-path-5'],
        legend: "Telemetry Flow: viewport coordinates -> semantic mask isolation -> TripoSR reconstruction -> shader opacity override (DBSE) -> GLB rigidbody injection."
    },
    create: {
        text: "<strong>Scenario 2 (Local Summoning)</strong> manages text-to-mesh creation locally on a constrained RTX 4060 (8GB VRAM). SDXL-Lightning loads first, utilizing float16 half-precision weights to slash VRAM footprint by 50% during image generation. Critically, to prevent OOM panics, the SDXL VRAM cache is aggressively flushed (<code>torch.cuda.empty_cache()</code>) before TripoSR initializes to convert the 2D tensor into the triplane volumetric grid.",
        nodes: ['node-input', 'node-forge', 'node-inject'],
        paths: ['flow-path-1', 'flow-path-2', 'flow-path-5'],
        legend: "Telemetry Flow: parses prompt -> SDXL-Lightning image output -> VRAM cache purge -> TripoSR volumetric forging -> GLB rigidbody injection."
    },
    physics: {
        text: "<strong>Scenario 3 (Kinematics & Middleware)</strong> binds graphical point clouds to physical realities. Invisible Static Rigidbodies (infinite mass) are mapped to lower splat coordinate density bounds (walls, floor). When a generated GLB model is spawned, a corresponding Dynamic Rigidbody is instantiated in <code>Cannon.js</code>, syncing spatial transforms (positions and quaternions) directly to <code>Three.js</code> meshes for real-time reactivity.",
        nodes: ['node-input', 'node-inject'],
        paths: ['flow-path-1', 'flow-path-5'],
        legend: "Telemetry Flow: updates Static collision bounds -> tracks GLB mass & friction -> coordinates Cannon.js middleware -> syncs visual mesh updates."
    }
};

const pipelineNodeInfo = {
    'node-input': "INPUT SOURCE: Captures viewport coordinates or prompt descriptors.",
    'node-segment': "U2NET SEGMENTER: Isolates boundaries, flattens alpha to avoid blob anomalies.",
    'node-forge': "TRIPOSR INFRASTRUCTURE: Projects pixels to orthogonal grids, marching cubes mesh extraction.",
    'node-dbse': "DBSE SHADER MASK: Non-destructive hole-punching by setting intersection opacity to zero.",
    'node-inject': "GLB RIGIDBODY: Synchronizes generated meshes to physical collider matrices."
};

function selectScenario(key) {
    const data = scenariosData[key];
    if (!data) return;

    // Toggle button styles
    const btnIds = ['extract', 'create', 'physics'];
    btnIds.forEach(id => {
        const btn = document.getElementById(`scen-btn-${id}`);
        if (btn) {
            if (id === key) btn.classList.add('active');
            else btn.classList.remove('active');
        }
    });

    const detailEl = document.getElementById('scenario-detail');
    if (detailEl) {
        detailEl.innerHTML = data.text;
    }

    const legendEl = document.getElementById('flow-node-details');
    if (legendEl) {
        legendEl.textContent = data.legend;
    }

    // Toggle active paths and nodes in SVG
    const nodes = ['node-input', 'node-segment', 'node-forge', 'node-dbse', 'node-inject'];
    nodes.forEach(nodeId => {
        const el = document.getElementById(nodeId);
        if (el) {
            const rect = el.querySelector('rect');
            if (data.nodes.includes(nodeId)) {
                rect.setAttribute('stroke-opacity', '1');
                rect.setAttribute('fill-opacity', '0.15');
                rect.setAttribute('stroke-width', '1.5');
            } else {
                rect.setAttribute('stroke-opacity', '0.25');
                rect.setAttribute('fill-opacity', '0.02');
                rect.setAttribute('stroke-width', '1');
            }
        }
    });

    const paths = ['flow-path-1', 'flow-path-2', 'flow-path-3', 'flow-path-4', 'flow-path-5'];
    paths.forEach(pathId => {
        const pathEl = document.getElementById(pathId);
        if (pathEl) {
            if (data.paths.includes(pathId)) {
                pathEl.setAttribute('stroke-opacity', '1');
                pathEl.setAttribute('stroke-width', '1.5');
                pathEl.classList.add('flow-line');
            } else {
                pathEl.setAttribute('stroke-opacity', '0.15');
                pathEl.setAttribute('stroke-width', '1');
                pathEl.classList.remove('flow-line');
            }
        }
    });
}

function initFlowchartTelemetry() {
    const nodes = ['node-input', 'node-segment', 'node-forge', 'node-dbse', 'node-inject'];
    const legendEl = document.getElementById('flow-node-details');

    nodes.forEach(nodeId => {
        const el = document.getElementById(nodeId);
        if (el) {
            el.addEventListener('mouseenter', () => {
                const telemetry = pipelineNodeInfo[nodeId];
                if (legendEl && telemetry) {
                    legendEl.textContent = telemetry;
                    legendEl.style.color = "#00f3ff";
                }
            });
            el.addEventListener('mouseleave', () => {
                if (legendEl) {
                    legendEl.style.color = "";
                    const activeBtn = document.querySelector('.flex.flex-wrap.gap-2.mb-4.font-mono button.active');
                    if (activeBtn) {
                        const key = activeBtn.id.replace('scen-btn-', '');
                        legendEl.textContent = scenariosData[key].legend;
                    }
                }
            });
        }
    });
}

// ── Global Navigation Scroll ─────────────────────────────────────────────────
function scrollToSection(index) {
    gsap.to(window, {
        duration: 1.0,
        scrollTo: { y: index * window.innerHeight, autoKill: false },
        ease: 'power2.inOut'
    });
}

// Expose handlers globally
window.selectFormula = selectFormula;
window.selectScenario = selectScenario;
window.scrollToSection = scrollToSection;

// DOMContentLoaded triggers
document.addEventListener('DOMContentLoaded', () => {
    selectFormula(0);
    selectScenario('extract');
    initFlowchartTelemetry();
});

// ── WebGL Animation and Camera render loop ───────────────────────────────────
function animate() {
    requestAnimationFrame(animate);

    // Minor procedural spins for secondary animation layers (like the stars)
    // Planet rotation is 100% scroll-bound via GSAP timeline.
    
    // Ensure camera looks at focus coordinate vector dynamically updated by GSAP
    camera.lookAt(cameraTarget);

    renderer.render(scene, camera);
}
animate();

// ── Window Resize adjustments ────────────────────────────────────────────────
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
