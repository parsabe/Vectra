import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

console.log('%c[VECTRA PRESENTATION] Booting 7-Stage Saturn Scrollytelling Engine...', 'color: #00f3ff; font-weight: bold;');

// DOM Elements
const canvas = document.getElementById('webgl-canvas');
if (!canvas) {
    console.error('[SYSTEM_ERR] WebGL Canvas not found in DOM.');
}

// ── Lenis Smooth Scrolling Setup ─────────────────────────────────────────────
const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    direction: 'vertical',
    gestureDirection: 'vertical',
    smooth: true,
    mouseMultiplier: 0.9,
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
scene.fog = new THREE.FogExp2(0x020204, 0.022); // Volumetric space depth fog

// Camera setup
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 500);

// Camera Target coordinate vector (used in lookAt loop)
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

// ── Space Lights Setup ───────────────────────────────────────────────────────
const ambientLight = new THREE.AmbientLight(0x0a0c16, 2.5);
scene.add(ambientLight);

// Neon colored spotlight rigs
const cyanLight = new THREE.PointLight(0x00f3ff, 6, 60);
cyanLight.position.set(-8, 4, 15);
scene.add(cyanLight);

const magentaLight = new THREE.PointLight(0xff00ff, 1, 60);
magentaLight.position.set(8, -4, -10);
scene.add(magentaLight);

const yellowLight = new THREE.PointLight(0xeab308, 1, 50);
yellowLight.position.set(0, 6, -15);
scene.add(yellowLight);

// Directional rim light to highlight planet curves
const rimLight = new THREE.DirectionalLight(0xffffff, 1.5);
rimLight.position.set(5, 5, -10);
scene.add(rimLight);

// ── Procedural Starfield background ──────────────────────────────────────────
const starCount = 2000;
const starGeometry = new THREE.BufferGeometry();
const starPositions = new Float32Array(starCount * 3);

for (let i = 0; i < starCount; i++) {
    const radius = 120 + Math.random() * 80;
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    
    starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    starPositions[i * 3 + 2] = radius * Math.cos(phi);
}

starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
const starMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.35,
    transparent: true,
    opacity: 0.55
});
const starfield = new THREE.Points(starGeometry, starMaterial);
scene.add(starfield);

// ── Saturn-Like Planet Creation ─────────────────────────────────────────────
const planetGroup = new THREE.Group();

// Generate a procedural technical grid texture map for the planet
const pCanvas = document.createElement('canvas');
pCanvas.width = 512;
pCanvas.height = 512;
const pCtx = pCanvas.getContext('2d');
pCtx.fillStyle = '#060810';
pCtx.fillRect(0, 0, 512, 512);
pCtx.strokeStyle = 'rgba(0, 243, 255, 0.45)';
pCtx.lineWidth = 1;
// Draw coordinate grid bands
for (let i = 0; i <= 512; i += 32) {
    pCtx.beginPath();
    pCtx.moveTo(i, 0); pCtx.lineTo(i, 512);
    pCtx.stroke();
    pCtx.beginPath();
    pCtx.moveTo(0, i); pCtx.lineTo(512, i);
    pCtx.stroke();
}
const gridTexture = new THREE.CanvasTexture(pCanvas);

// Planet core mesh
const planetGeom = new THREE.SphereGeometry(2.5, 64, 64);
const planetMat = new THREE.MeshStandardMaterial({
    map: gridTexture,
    roughness: 0.25,
    metalness: 0.8,
    emissive: 0x00f3ff,
    emissiveMap: gridTexture,
    emissiveIntensity: 0.12
});
const planetMesh = new THREE.Mesh(planetGeom, planetMat);
planetGroup.add(planetMesh);

// Saturn Ring planes
const ringGeom = new THREE.RingGeometry(3.3, 6.8, 64);
// Rotate Ring horizontal
ringGeom.rotateX(Math.PI / 2);

// Generate procedural ring concentric gradient texture
const rCanvas = document.createElement('canvas');
rCanvas.width = 512;
rCanvas.height = 8;
const rCtx = rCanvas.getContext('2d');
const ringGradient = rCtx.createLinearGradient(0, 0, 512, 0);
ringGradient.addColorStop(0, 'rgba(0, 243, 255, 0.55)');
ringGradient.addColorStop(0.18, 'rgba(0, 243, 255, 0.08)');
ringGradient.addColorStop(0.35, 'rgba(255, 0, 255, 0.55)');
ringGradient.addColorStop(0.48, 'rgba(255, 0, 255, 0.12)');
ringGradient.addColorStop(0.68, 'rgba(234, 179, 8, 0.65)');
ringGradient.addColorStop(0.8, 'rgba(234, 179, 8, 0.15)');
ringGradient.addColorStop(0.92, 'rgba(0, 243, 255, 0.4)');
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

// Apply Saturn's axis tilt (26.73 degrees = 0.466 rad)
planetGroup.rotation.x = 0.35;
planetGroup.rotation.z = 0.12;
scene.add(planetGroup);

// ── Orbiting Moons / Satellites ──────────────────────────────────────────────
const moons = [];
const moonColors = [0x00f3ff, 0xff00ff, 0xeab308];
const moonRadii = [4.5, 5.8, 7.8];
const moonSpeeds = [0.8, 0.5, 0.3];
const moonSizes = [0.08, 0.12, 0.06];

for (let i = 0; i < 3; i++) {
    const moonGeom = new THREE.SphereGeometry(moonSizes[i], 16, 16);
    const moonMat = new THREE.MeshBasicMaterial({
        color: moonColors[i],
        transparent: true,
        opacity: 0.9
    });
    const moonMesh = new THREE.Mesh(moonGeom, moonMat);
    scene.add(moonMesh);
    moons.push({
        mesh: moonMesh,
        radius: moonRadii[i],
        speed: moonSpeeds[i],
        angle: Math.random() * Math.PI * 2
    });
}

// ── GSAP ScrollTrigger 7-Phase Flight Path Mapping ────────────────────────────
// Initial camera placement
camera.position.set(0, 0, 9.5);
cameraTarget.set(0, 0, 0);

const scrollTimeline = gsap.timeline({
    scrollTrigger: {
        trigger: 'body',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.6, // Smooth lag multiplier
    }
});

// Coordinate mappings for 7 sections:
// Phase 1 (Hero to Related Work): zooms inside rings at (-3.2, 0.4, 4.5)
// Phase 2 (Related Work to Methodology): orbits side of planet at (-5.2, 2.5, 7.8)
// Phase 3 (Methodology to Experiments): orbits close to a moon at (2.5, -1.8, 5.0)
// Phase 4 (Experiments to Discussion): crosses the ring plane at (4.5, -0.8, -4.5)
// Phase 5 (Discussion to Conclusion): pulls back to a distant centered shot at (0, 0.2, 12.5)
// Phase 6 (Conclusion to References): orbits up looking down at the planet at (0, 4.2, 9.5)

scrollTimeline
    // ── Phase 1: Slide 1 -> Slide 2 (Hero to Related Work)
    .to(camera.position, { x: -3.2, y: 0.4, z: 4.5, ease: 'power1.inOut' }, 0)
    .to(cameraTarget, { x: 1.5, y: -0.2, z: 0, ease: 'power1.inOut' }, 0)
    .to(planetGroup.rotation, { y: Math.PI * 0.45, ease: 'power1.inOut' }, 0)
    .to(cyanLight, { intensity: 1, ease: 'power1.inOut' }, 0)
    .to(magentaLight, { intensity: 7, ease: 'power1.inOut' }, 0)
    
    // ── Phase 2: Slide 2 -> Slide 3 (Related Work to Methodology)
    .to(camera.position, { x: -5.2, y: 2.5, z: 7.8, ease: 'power1.inOut' }, 1)
    .to(cameraTarget, { x: 2.0, y: -0.6, z: -1, ease: 'power1.inOut' }, 1)
    .to(planetGroup.rotation, { y: Math.PI * 0.9, x: 0.52, ease: 'power1.inOut' }, 1)
    .to(magentaLight, { intensity: 1, ease: 'power1.inOut' }, 1)
    .to(yellowLight, { intensity: 7, ease: 'power1.inOut' }, 1)
    
    // ── Phase 3: Slide 3 -> Slide 4 (Methodology to Experiments)
    .to(camera.position, { x: 2.5, y: -1.8, z: 5.0, ease: 'power1.inOut' }, 2)
    .to(cameraTarget, { x: -1.5, y: 0.5, z: 0.5, ease: 'power1.inOut' }, 2)
    .to(planetGroup.rotation, { y: Math.PI * 1.3, x: 0.22, ease: 'power1.inOut' }, 2)
    .to(yellowLight, { intensity: 1, ease: 'power1.inOut' }, 2)
    .to(cyanLight, { intensity: 6, ease: 'power1.inOut' }, 2)

    // ── Phase 4: Slide 4 -> Slide 5 (Experiments to Discussion)
    .to(camera.position, { x: 4.5, y: -0.8, z: -4.5, ease: 'power1.inOut' }, 3)
    .to(cameraTarget, { x: -2.0, y: 0.4, z: 1, ease: 'power1.inOut' }, 3)
    .to(planetGroup.rotation, { y: Math.PI * 1.8, x: -0.15, ease: 'power1.inOut' }, 3)
    .to(cyanLight, { intensity: 1, ease: 'power1.inOut' }, 3)
    .to(magentaLight, { intensity: 7, ease: 'power1.inOut' }, 3)

    // ── Phase 5: Slide 5 -> Slide 6 (Discussion to Conclusion)
    .to(camera.position, { x: 0, y: 0.2, z: 12.5, ease: 'power1.inOut' }, 4)
    .to(cameraTarget, { x: 0, y: 0, z: 0, ease: 'power1.inOut' }, 4)
    .to(planetGroup.rotation, { y: Math.PI * 2.3, x: 0.35, ease: 'power1.inOut' }, 4)
    .to(magentaLight, { intensity: 1, ease: 'power1.inOut' }, 4)
    .to(cyanLight, { intensity: 6, ease: 'power1.inOut' }, 4)

    // ── Phase 6: Slide 6 -> Slide 7 (Conclusion to References)
    .to(camera.position, { x: 0, y: 4.2, z: 9.5, ease: 'power1.inOut' }, 5)
    .to(cameraTarget, { x: 0, y: 0, z: -0.5, ease: 'power1.inOut' }, 5)
    .to(planetGroup.rotation, { y: Math.PI * 2.8, x: 0.45, ease: 'power1.inOut' }, 5)
    .to(cyanLight, { intensity: 4, ease: 'power1.inOut' }, 5)
    .to(yellowLight, { intensity: 5, ease: 'power1.inOut' }, 5);

// ── Large Figures Zoom-In & Zoom-Out on Scroll ──────────────────────────────
const sections = document.querySelectorAll('section');
sections.forEach((section, i) => {
    const zoomContainer = section.querySelector('.zoom-image-container');
    if (zoomContainer) {
        const img = zoomContainer.querySelector('.zoom-image');
        if (img) {
            // Entry zoom-in
            gsap.fromTo(img,
                { scale: 0.35, opacity: 0.05 },
                {
                    scale: 1.12,
                    opacity: 1,
                    scrollTrigger: {
                        trigger: section,
                        start: 'top 85%',
                        end: 'top 25%',
                        scrub: true
                    }
                }
            );

            // Exit zoom-out (except for references action card)
            if (i < sections.length - 1) {
                gsap.to(img, {
                    scale: 0.35,
                    opacity: 0.05,
                    scrollTrigger: {
                        trigger: section,
                        start: 'bottom 75%',
                        end: 'bottom 15%',
                        scrub: true
                    }
                });
            }
        }
    }
});

// Update Scroll Progress bar and Nav dots
window.addEventListener('scroll', () => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollHeight > 0) {
        const scrollPercent = (window.scrollY / scrollHeight) * 100;
        const progressBar = document.getElementById('scroll-progress');
        if (progressBar) {
            progressBar.style.width = `${scrollPercent}%`;
        }

        // Highlight current nav dot
        const currentSlide = Math.round(window.scrollY / window.innerHeight);
        for (let i = 0; i < 7; i++) {
            const dot = document.getElementById(`dot-${i}`);
            if (dot) {
                if (i === currentSlide) dot.classList.add('active');
                else dot.classList.remove('active');
            }
        }
    }
});

// ── Interactive UI Logic ─────────────────────────────────────────────────────

// Math blueprints database extracted from related-work.tex
const formulasData = [
    {
        title: "Volume Rendering integration",
        eq1: "\\mathcal{C}(r)=\\int_{t_{n}}^{t_{f}}T(t)\\sigma(r(t))c(r(t),d)d~t",
        eq2: "T(t) = \\exp\\left( - \\int_{t_n}^{t} \\sigma(r(s)) ds \\right)",
        desc: "Models physical environments as continuous 5D fields. The predicted optical color payload is calculated by integrating differential density opacities along the tracer camera ray.",
        fig: "/img/1.png",
        caption: "Figure 2: Neural Radiance Field Scene Representation"
    },
    {
        title: "PSNR & SSIM Diagnostics",
        eq1: "PSNR(I)=10\\cdot \\log_{10}\\left(\\frac{MAX(I)^{2}}{MSE(I)}\\right)",
        eq2: "SSIM(x, y) = \\frac{(2\\mu_x\\mu_y + C_1)(2\\sigma_{xy} + C_2)}{(\\mu_x^2 + \\mu_y^2 + C_1)(\\sigma_x^2 + \\sigma_y^2 + C_2)}",
        desc: "Quality assessment standards to evaluate synthetic views. PSNR checks pixel-wise mean squared errors, while SSIM audits structural luminance and covariance similarity grids.",
        fig: "/img/6.png",
        caption: "Figure 5: Evaluation Bias"
    },
    {
        title: "Semantic Consistency",
        eq1: "\\mathcal{H}_{SC,l_{2}}(I,\\hat{I})=\\frac{\\lambda}{2}||\\phi(I)-\\phi(\\hat{I})||_{2}^{2}",
        eq2: "",
        desc: "Prevents geometry collapse in sparse training zones (e.g. DietNeRF). Compares semantic features extracted by vision transformers (CLIP ViT) from varied viewpoints.",
        fig: "/img/3.png",
        caption: "Figure 3: Novel Visual Feeds from solitary input"
    },
    {
        title: "Score Distillation & Density",
        eq1: "\\nabla_{\\Theta}\\mathcal{L}_{SDS} = \\mathbb{E}_{t,p,\\epsilon}[w(t)(\\epsilon_{\\phi}(I_{RGB}^{p};t,\\epsilon)-\\epsilon)\\frac{\\partial I_{RGB}^{p}}{\\partial\\Theta}]",
        eq2: "d(x)=\\sum_{i}\\alpha_{i}exp(-\\frac{1}{2}(x-x_{i})^{T}\\Sigma_{i}^{-1}(x-x_{i}))",
        desc: "Orchestrates text-to-3D generations (e.g. DreamGaussian). Guides Gaussian ellipsoids using 2D diffusion priors, and calculates volumetric density at arbitrary nodes.",
        fig: "/img/7.png",
        caption: "Figure 7: Comparisons on Image-to-3D"
    },
    {
        title: "Temporal Kinematics",
        eq1: "\\mathcal{L}_{rot} = \\frac{1}{K} \\sum \\sum w_{ij} ||q - q||^2",
        eq2: "",
        desc: "Regularizes spatial drift in dynamic time-steps. Imposes rotational constraints on quaternions between neighboring nodes to stabilize physics in the volumetric sequence.",
        fig: "/img/11.png",
        caption: "Figure 11: Vectra Protocol Decoupled Architecture"
    }
];

function selectFormula(index) {
    const formula = formulasData[index];
    if (!formula) return;

    for (let i = 0; i < formulasData.length; i++) {
        const tab = document.getElementById(`f-tab-${i}`);
        if (tab) {
            if (i === index) tab.classList.add('active');
            else tab.classList.remove('active');
        }
    }

    const container = document.getElementById('formula-detail-pane');
    const figContainer = document.getElementById('formula-fig-container');
    const figImg = document.getElementById('formula-fig');
    const figCap = document.getElementById('formula-fig-caption');

    if (!container || !figImg || !figCap || !figContainer) return;

    gsap.to([container, figContainer], {
        opacity: 0.05,
        duration: 0.2,
        onComplete: () => {
            container.replaceChildren();

            const titleNode = document.createElement('h3');
            titleNode.className = 'font-mono text-sm text-cyan-400 font-bold uppercase mb-2 tracking-widest text-glow-cyan';
            titleNode.textContent = formula.title;
            container.appendChild(titleNode);

            const descNode = document.createElement('p');
            descNode.className = 'leading-relaxed text-neutral-300 text-xs md:text-sm mb-4 font-sans';
            descNode.textContent = formula.desc;
            container.appendChild(descNode);

            const mathBlock1 = document.createElement('div');
            mathBlock1.className = 'my-4 p-3 rounded-lg bg-black/45 border border-cyan-900/10 text-center';
            katex.render(formula.eq1, mathBlock1, { displayMode: true, throwOnError: false });
            container.appendChild(mathBlock1);

            if (formula.eq2) {
                const mathBlock2 = document.createElement('div');
                mathBlock2.className = 'my-4 p-3 rounded-lg bg-black/45 border border-cyan-900/10 text-center';
                katex.render(formula.eq2, mathBlock2, { displayMode: true, throwOnError: false });
                container.appendChild(mathBlock2);
            }

            figImg.setAttribute('src', formula.fig);
            figCap.textContent = formula.caption;

            gsap.to([container, figContainer], { opacity: 1, duration: 0.3 });
        }
    });
}

// Scenarios Database extracted from method.tex and appendix.tex
const scenariosData = {
    extract: {
        text: "<strong>Scenario 1 (Generative Extraction Protocol)</strong> handles spatial culling and segmentation. Drawing a 2D viewport bounds frustum projects Z-buffer depths to isolate the selected volume. U2Net segments the object, solid white alpha flattening purges boundary gradients, and TripoSR constructs the mesh. Shader-level <strong>Deep Splat Excavation (DBSE)</strong> wipes opacity values to punch a hole in the dense PLY point cloud, spawning the dynamic GLB collider box at its centroid without clipping.",
        nodes: ['node-input', 'node-segment', 'node-forge', 'node-dbse', 'node-inject'],
        paths: ['flow-path-1', 'flow-path-2', 'flow-path-3', 'flow-path-4', 'flow-path-5'],
        legend: "Interactive telemetry: Captures 2D viewport coordinates -> Segments silhouette mask -> Generates mesh via TripoSR -> Shader overrides opacity values via DBSE -> Injects GLB mesh with rigidbody physics."
    },
    create: {
        text: "<strong>Scenario 2 (Local Summoning Engine)</strong> maps semantic text prompts directly to meshes on tight GPU parameters (8GB VRAM RTX 4060). SDXL-Lightning loads first to generate a half-precision (float16) 2D pixel canvas. Critically, to prevent VRAM allocation overflows, the SDXL memory cache is aggressively purged (<code>torch.cuda.empty_cache()</code>) before TripoSR boots into memory to run the Marching Cubes volumetric forge.",
        nodes: ['node-input', 'node-forge', 'node-inject'],
        paths: ['flow-path-1', 'flow-path-2'],
        legend: "Interactive telemetry: Parses text prompt -> SDXL-Lightning image generation -> Aggressive memory cache flush -> TripoSR volumetric forging -> Injects GLB mesh directly to physics terminal."
    }
};

const pipelineNodeInfo = {
    'node-input': "INPUT SOURCE: Captures viewport bounding coordinates or textual descriptors.",
    'node-segment': "U2NET SEGMENTER: Segments silhouette, flattens alpha to avoid blob artifacts.",
    'node-forge': "TRIPOSR INFRASTRUCTURE: Projects 2D pixels to triplane grids, decodes mesh.",
    'node-dbse': "DBSE MASKING: Surgically sets opacity to zero in shader, avoiding visual clipping.",
    'node-inject': "GLB INJECTION: Binds lightweight meshes to Cannon.js physics rigidbodies."
};

function selectScenario(key) {
    const data = scenariosData[key];
    if (!data) return;

    const btnExtract = document.getElementById('scen-btn-extract');
    const btnCreate = document.getElementById('scen-btn-create');
    if (key === 'extract') {
        btnExtract.classList.add('active');
        btnCreate.classList.remove('active');
    } else {
        btnCreate.classList.add('active');
        btnExtract.classList.remove('active');
    }

    const detailText = document.getElementById('scenario-detail');
    if (detailText) {
        detailText.innerHTML = data.text;
    }

    const legendText = document.getElementById('flow-node-details');
    if (legendText) {
        legendText.textContent = data.legend;
    }

    const allNodes = ['node-input', 'node-segment', 'node-forge', 'node-dbse', 'node-inject'];
    allNodes.forEach(nodeId => {
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

    const allPaths = ['flow-path-1', 'flow-path-2', 'flow-path-3', 'flow-path-4', 'flow-path-5'];
    allPaths.forEach(pathId => {
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

function scrollToSection(selector) {
    gsap.to(window, {
        duration: 0.85,
        scrollTo: selector,
        ease: 'power2.inOut'
    });
}

function initFlowchartEvents() {
    const allNodes = ['node-input', 'node-segment', 'node-forge', 'node-dbse', 'node-inject'];
    const legendText = document.getElementById('flow-node-details');

    allNodes.forEach(nodeId => {
        const nodeEl = document.getElementById(nodeId);
        if (nodeEl) {
            nodeEl.addEventListener('mouseenter', () => {
                const info = pipelineNodeInfo[nodeId];
                if (legendText && info) {
                    legendText.textContent = info;
                    legendText.style.color = "#00f3ff";
                }
            });
            nodeEl.addEventListener('mouseleave', () => {
                if (legendText) {
                    legendText.style.color = "";
                    const activeBtn = document.querySelector('.px-3.py-1.5.rounded.border.active');
                    if (activeBtn) {
                        const key = activeBtn.id === 'scen-btn-extract' ? 'extract' : 'create';
                        legendText.textContent = scenariosData[key].legend;
                    }
                }
            });
        }
    });
}

// Expose selection functions to global window namespace
window.selectFormula = selectFormula;
window.selectScenario = selectScenario;
window.scrollToSection = scrollToSection;

// On load initialization
document.addEventListener('DOMContentLoaded', () => {
    selectFormula(0);
    selectScenario('extract');
    initFlowchartEvents();
});

// ── Animation Loop ──────────────────────────────────────────────────────────
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const time = clock.getElapsedTime();

    // 1. Planet self-rotation (constant spin)
    planetMesh.rotation.y = time * 0.04;

    // 2. Animate satellite moon orbits around planet
    moons.forEach((moon) => {
        moon.angle += moon.speed * clock.getDelta();
        const x = Math.cos(moon.angle) * moon.radius;
        const z = Math.sin(moon.angle) * moon.radius;
        
        const pos = new THREE.Vector3(x, 0, z);
        pos.applyAxisAngle(new THREE.Vector3(1, 0, 0), 0.35); // matches x rotation
        pos.applyAxisAngle(new THREE.Vector3(0, 0, 1), 0.12); // matches z rotation
        
        moon.mesh.position.copy(pos);
    });

    // 3. Constant minor background starfield drift
    starfield.rotation.y = time * 0.001;

    // 4. Force camera lookAt alignment
    camera.lookAt(cameraTarget);

    // 5. Render
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
