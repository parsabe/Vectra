import './bootstrap';
// --- VECTRA_NEURAL_CORE_CACHE_BUSTER_V104 ---
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d';
import SortWorker from './splat-sort.worker.js?worker';

const LoaderStatus = { Downloading: 0, Processing: 1, Done: 2 };
let viewer = null;
let pendingSplatDisplay = null;

// Global splatScale multiplier configuration
window.VECTRA_SPLAT_SCALE = 0.05; // Default multiplier to shrink bloated splats

// Hook into PlyParser.parseToUncompressedSplatArray
const originalParseArray = GaussianSplats3D.PlyParser.parseToUncompressedSplatArray;
GaussianSplats3D.PlyParser.parseToUncompressedSplatArray = function(plyBuffer, outSphericalHarmonicsDegree) {
    const splatArray = originalParseArray(plyBuffer, outSphericalHarmonicsDegree);
    if (splatArray && splatArray.splats) {
        adjustSplatArrayScales(splatArray);
    }
    return splatArray;
};

// Hook into PlyParser.parseToUncompressedSplatBuffer
const originalParseBuffer = GaussianSplats3D.PlyParser.parseToUncompressedSplatBuffer;
GaussianSplats3D.PlyParser.parseToUncompressedSplatBuffer = function(plyBuffer, outSphericalHarmonicsDegree) {
    const splatBuffer = originalParseBuffer(plyBuffer, outSphericalHarmonicsDegree);
    if (splatBuffer) {
        adjustSplatBufferScales(splatBuffer);
    }
    return splatBuffer;
};

// Helper: Adjust scale array
function adjustSplatArrayScales(splatArray) {
    const splatScale = window.VECTRA_SPLAT_SCALE !== undefined ? window.VECTRA_SPLAT_SCALE : 1.0;
    const splats = splatArray.splats;
    const SCALE0_IDX = 3;
    const SCALE1_IDX = 4;
    const SCALE2_IDX = 5;

    if (splats.length === 0) return;

    // Detect if scales are linear (where Math.exp incorrectly bloated them)
    let sumScale = 0;
    const sampleCount = Math.min(splats.length, 100);
    for (let i = 0; i < sampleCount; i++) {
        sumScale += splats[i][SCALE0_IDX];
    }
    const avgScale = sumScale / sampleCount;
    const isExponentiatedLinear = avgScale > 0.5;

    console.log(`[VECTRA] Array Scale Diagnostics: avgScale=${avgScale.toFixed(4)}, isExponentiatedLinear=${isExponentiatedLinear}`);

    for (let i = 0; i < splats.length; i++) {
        const splat = splats[i];
        let s0 = splat[SCALE0_IDX];
        let s1 = splat[SCALE1_IDX];
        let s2 = splat[SCALE2_IDX];

        if (isExponentiatedLinear) {
            s0 = Math.log(Math.max(s0, 1e-5));
            s1 = Math.log(Math.max(s1, 1e-5));
            s2 = Math.log(Math.max(s2, 1e-5));
        }

        splat[SCALE0_IDX] = Math.max(s0 * splatScale, 1e-5);
        splat[SCALE1_IDX] = Math.max(s1 * splatScale, 1e-5);
        splat[SCALE2_IDX] = Math.max(s2 * splatScale, 1e-5);
    }
}

// Helper: Adjust scale buffer
function adjustSplatBufferScales(splatBuffer) {
    const splatScale = window.VECTRA_SPLAT_SCALE !== undefined ? window.VECTRA_SPLAT_SCALE : 1.0;
    const bufferData = splatBuffer.bufferData;
    const splatCount = splatBuffer.splatCount;

    if (splatBuffer.compressionLevel !== 0) {
        console.warn('[VECTRA] SplatBuffer compression level is not 0, skipping scale adjustment.');
        return;
    }

    const bytesPerSplat = splatBuffer.bytesPerSplat;
    const splatBufferDataOffsetBytes = splatBuffer.headerSizeBytes + splatBuffer.sectionHeaderSizeBytes;
    const scaleOffset = 12;

    let sumScale = 0;
    const sampleCount = Math.min(splatCount, 100);
    const view = new DataView(bufferData);

    for (let i = 0; i < sampleCount; i++) {
        const offset = splatBufferDataOffsetBytes + i * bytesPerSplat + scaleOffset;
        sumScale += view.getFloat32(offset, true);
    }
    const avgScale = sumScale / sampleCount;
    const isExponentiatedLinear = avgScale > 0.5;

    console.log(`[VECTRA] Buffer Scale Diagnostics: avgScale=${avgScale.toFixed(4)}, isExponentiatedLinear=${isExponentiatedLinear}`);

    for (let i = 0; i < splatCount; i++) {
        const offset = splatBufferDataOffsetBytes + i * bytesPerSplat + scaleOffset;
        let s0 = view.getFloat32(offset, true);
        let s1 = view.getFloat32(offset + 4, true);
        let s2 = view.getFloat32(offset + 8, true);

        if (isExponentiatedLinear) {
            s0 = Math.log(Math.max(s0, 1e-5));
            s1 = Math.log(Math.max(s1, 1e-5));
            s2 = Math.log(Math.max(s2, 1e-5));
        }

        view.setFloat32(offset, Math.max(s0 * splatScale, 1e-5), true);
        view.setFloat32(offset + 4, Math.max(s1 * splatScale, 1e-5), true);
        view.setFloat32(offset + 8, Math.max(s2 * splatScale, 1e-5), true);
    }
}

// Intercept window.Worker during setupSortWorker to bind the Vite worker
const originalSetupSortWorker = GaussianSplats3D.Viewer.prototype.setupSortWorker;
GaussianSplats3D.Viewer.prototype.setupSortWorker = function(splatMesh) {
    const originalWorker = window.Worker;
    window.Worker = function(url, options) {
        if (typeof url === 'string' && url.startsWith('blob:')) {
            console.log('[VECTRA] Intercepted splat sort worker creation, using Vite worker.');
            return new SortWorker();
        }
        return new originalWorker(url, options);
    };

    try {
        return originalSetupSortWorker.call(this, splatMesh);
    } finally {
        window.Worker = originalWorker;
    }
};

// --- System Telemetry DOM Elements ---
window.VECTRA_VERSION = "1.0.9-NEURAL-CB-108";
const telemetryRotX = document.getElementById('telemetry-rot-x');
const telemetryRotY = document.getElementById('telemetry-rot-y');
const terminalOutput = document.getElementById('terminal-output');
const terminalInput = document.getElementById('terminal-input');
const btnCreator = document.getElementById('btn-creator-mode');

// --- Splat Mode UI Elements ---
const bentoGrid = document.querySelector('main');
const splatToolbar = document.getElementById('splat-toolbar');
const loadingOverlay = document.getElementById('loading-overlay');
const loadingText = document.getElementById('loading-text');
const loadingBarFill = document.getElementById('loading-bar-fill');
const loadingPercent = document.getElementById('loading-percent');

const btnBackMenu = document.getElementById('btn-back-menu');
const btnToggleSelect = document.getElementById('btn-toggle-select');
const btnToggleSplatting = document.getElementById('btn-toggle-splatting');

// --- Drag & Drop / Local Upload UI Elements ---
const dropZoneOverlay = document.getElementById('drop-zone-overlay');
const fileUploader = document.getElementById('file-uploader');
const btnUploadFile = document.getElementById('btn-upload-file');

// --- 3D Scene Initialization ---
const canvas = document.getElementById('vectra-canvas');
if (!canvas) {
    console.error('[SYSTEM_ERR] Three.js canvas element not found.');
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020204);
scene.fog = new THREE.FogExp2(0x020204, 0.025);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(0, 3, 10);

const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: false,
    preserveDrawingBuffer: true  // Required for toDataURL() screenshot capture
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// --- Lights ---
const ambientLight = new THREE.AmbientLight(0x0a0c10, 1.2);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0x00f3ff, 1.8);
dirLight.position.set(5, 12, 8);
scene.add(dirLight);

// Neon Floating lights to scan the scene
const cyanPointLight = new THREE.PointLight(0x00f3ff, 4, 30);
cyanPointLight.position.set(-3, 1, 0);
scene.add(cyanPointLight);

const magentaPointLight = new THREE.PointLight(0xff00ff, 4, 30);
magentaPointLight.position.set(3, 1, 0);
scene.add(magentaPointLight);

// Bright white lights for GLB viewport mode
const glbAmbientLight = new THREE.AmbientLight(0xffffff, 2.5);
glbAmbientLight.visible = false;
scene.add(glbAmbientLight);

const glbDirectionalLight = new THREE.DirectionalLight(0xffffff, 3.0);
glbDirectionalLight.position.set(5, 10, 7);
glbDirectionalLight.visible = false;
scene.add(glbDirectionalLight);

// --- Custom Cyberpunk Grid and Wireframe Corridor ---
// Horizontal grid at the bottom
let gridHelper = new THREE.GridHelper(120, 60, 0xff00ff, 0x00f3ff);
gridHelper.position.y = -1.5;
scene.add(gridHelper);

// Scanned corridor/hallway using neon boxes
const hallwayGroup = new THREE.Group();
const corridorLength = 12; // Number of corridor nodes

for (let i = -corridorLength; i <= corridorLength; i++) {
    const zOffset = i * 8;
    const isEven = i % 2 === 0;
    const themeColor = isEven ? 0x00f3ff : 0xff00ff;

    // Outer column structures (left)
    const colGeomL = new THREE.BoxGeometry(1.2, 4, 1.2);
    const edgesL = new THREE.EdgesGeometry(colGeomL);
    const colMatL = new THREE.LineBasicMaterial({
        color: themeColor,
        transparent: true,
        opacity: 0.55
    });
    const colL = new THREE.LineSegments(edgesL, colMatL);
    colL.position.set(-5, 0.5, zOffset);
    hallwayGroup.add(colL);

    // Outer column structures (right)
    const colR = colL.clone();
    colR.position.set(5, 0.5, zOffset);
    // Alternate color
    colR.material = new THREE.LineBasicMaterial({
        color: isEven ? 0xff00ff : 0x00f3ff,
        transparent: true,
        opacity: 0.55
    });
    hallwayGroup.add(colR);

    // Ceiling beams connecting left and right columns
    if (isEven) {
        const beamGeom = new THREE.BoxGeometry(10, 0.2, 0.2);
        const beamEdges = new THREE.EdgesGeometry(beamGeom);
        const beamMat = new THREE.LineBasicMaterial({
            color: 0x00f3ff,
            transparent: true,
            opacity: 0.4
        });
        const beam = new THREE.LineSegments(beamEdges, beamMat);
        beam.position.set(0, 2.5, zOffset);
        hallwayGroup.add(beam);
    }
}
scene.add(hallwayGroup);

// --- Model State & Containers ---
let loadedModel = null;
let loadedPointCloud = null; // Specifically for loaded .ply point clouds
let extractedGLB = null; // Specifically for generated .glb models
let isModelLoading = false;
let isSelectModeActive = false;

const pointSizes = [0.02, 0.06, 0.12, 0.20];
let currentSizeIndex = 1; // Default 0.06

const markersGroup = new THREE.Group();
scene.add(markersGroup);

// --- Orbit Controls ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2 - 0.05; // Lock camera from going below floor level
controls.minDistance = 1;
controls.maxDistance = 50;
controls.target.set(0, 0.5, 0);

// ── WASD + QE Keyboard Movement (6DoF fly-through) ──────────────────────────
// Active in both main mode and Extract Orbit mode
const keysDown = {};
const MOVE_SPEED      = 0.12;  // Base movement speed per frame
const MOVE_SPRINT     = 0.38;  // Shift-held sprint speed
const MOVE_SMOOTH     = 0.88;  // Velocity decay factor (higher = glider feel)
const moveVelocity    = new THREE.Vector3();
const tmpDir          = new THREE.Vector3();
const tmpRight        = new THREE.Vector3();
const tmpUp           = new THREE.Vector3(0, 1, 0);

document.addEventListener('keydown', (e) => {
    // Ignore if user is typing in terminal input
    if (document.activeElement === terminalInput) return;
    keysDown[e.code] = true;
});
document.addEventListener('keyup', (e) => {
    keysDown[e.code] = false;
});

function applyWASDMovement() {
    // Only move camera when orbit controls are enabled (no bbox drawing)
    if (!controls.enabled) return;

    // Check if any movement key is actually pressed
    const anyKey = keysDown['KeyW'] || keysDown['KeyS'] || keysDown['KeyA'] || keysDown['KeyD']
                || keysDown['KeyQ'] || keysDown['KeyE']
                || keysDown['ArrowUp'] || keysDown['ArrowDown'] || keysDown['ArrowLeft'] || keysDown['ArrowRight']
                || keysDown['Space'] || keysDown['ControlLeft'];

    // Decay existing velocity toward zero even if no keys are held
    moveVelocity.multiplyScalar(MOVE_SMOOTH);

    // Hard-zero when negligible — prevents endless drift fighting OrbitControls
    if (moveVelocity.lengthSq() < 1e-8) {
        moveVelocity.set(0, 0, 0);
    }

    // NaN self-heal (triggered if camera once looked exactly straight up/down)
    if (isNaN(moveVelocity.x) || isNaN(moveVelocity.y) || isNaN(moveVelocity.z)) {
        moveVelocity.set(0, 0, 0);
    }

    if (!anyKey) {
        // Apply residual glide to camera + target only if still moving
        if (moveVelocity.lengthSq() > 0) {
            camera.position.add(moveVelocity);
            controls.target.add(moveVelocity);
        }
        return;
    }

    const speed = keysDown['ShiftLeft'] || keysDown['ShiftRight'] ? MOVE_SPRINT : MOVE_SPEED;

    // Get forward direction from camera (ignore vertical component for W/S)
    camera.getWorldDirection(tmpDir);
    tmpDir.y = 0;

    // ── NaN guard: camera pointing exactly up or down makes horizontal vector zero
    if (tmpDir.lengthSq() < 0.0001) {
        // Fallback: use camera's local -Z projected to XZ plane
        tmpDir.set(-camera.matrix.elements[8], 0, -camera.matrix.elements[10]);
        if (tmpDir.lengthSq() < 0.0001) tmpDir.set(0, 0, -1); // last resort
    }
    tmpDir.normalize();

    // Right = cross(forward, world-up)
    tmpRight.crossVectors(tmpDir, tmpUp).normalize();

    const accel = new THREE.Vector3();

    if (keysDown['KeyW'] || keysDown['ArrowUp'])     accel.addScaledVector(tmpDir,   speed);
    if (keysDown['KeyS'] || keysDown['ArrowDown'])   accel.addScaledVector(tmpDir,  -speed);
    if (keysDown['KeyA'] || keysDown['ArrowLeft'])   accel.addScaledVector(tmpRight, -speed);
    if (keysDown['KeyD'] || keysDown['ArrowRight'])  accel.addScaledVector(tmpRight,  speed);
    if (keysDown['KeyQ'] || keysDown['Space'])       accel.y +=  speed;  // Float up
    if (keysDown['KeyE'] || keysDown['ControlLeft']) accel.y -=  speed;  // Sink down

    moveVelocity.add(accel);

    // Apply movement: shift camera AND orbit target by the same delta
    camera.position.add(moveVelocity);
    controls.target.add(moveVelocity);
}

// --- Animation Loop ---
let clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const elapsedTime = clock.getElapsedTime();

    // Animate point lights moving back and forth in the corridor
    cyanPointLight.position.z = Math.sin(elapsedTime * 0.7) * 20;
    cyanPointLight.position.x = -3 + Math.sin(elapsedTime * 1.2) * 1.5;

    magentaPointLight.position.z = -Math.sin(elapsedTime * 0.7) * 20;
    magentaPointLight.position.x = 3 + Math.cos(elapsedTime * 1.2) * 1.5;

    // Slow rotation to make the loaded model feel active
    if (loadedModel) {
        loadedModel.rotation.y = elapsedTime * 0.03;
    } else {
        // Slow drift of the corridor if no custom model is loaded
        hallwayGroup.rotation.y = Math.sin(elapsedTime * 0.05) * 0.02;
    }

    // Animate selection markers (pulsing scale and rotation)
    markersGroup.children.forEach(marker => {
        const pulse = 1 + Math.sin(elapsedTime * 8) * 0.08;
        marker.scale.set(pulse, pulse, pulse);
        
        const outerWire = marker.children[0];
        if (outerWire) {
            outerWire.rotation.x += 0.01;
            outerWire.rotation.y += 0.02;
        }
    });

    // Apply WASD keyboard movement every frame
    applyWASDMovement();

    // Update controls
    controls.update();

    // Animate Extract Mode scene effects
    if (isExtractModeActive) {
        animateExtractScene(elapsedTime);
    }

    // Update headlight position if visible
    if (glbDirectionalLight && glbDirectionalLight.visible) {
        glbDirectionalLight.position.copy(camera.position);
    }

    // Render Scene (Viewer vs Fallback)
    if (viewer && viewer.initialized) {
        viewer.update();

        if (viewer.splatRenderReady) {
            if (pendingSplatDisplay) {
                const { fileName, objectURL: blobURL } = pendingSplatDisplay;
                pendingSplatDisplay = null;
                displayLoadedSplatViewer(fileName);
                if (blobURL) URL.revokeObjectURL(blobURL);
            }
            viewer.render();
        } else {
            controls.update();
            renderer.render(scene, camera);
        }
    } else {
        renderer.render(scene, camera);
    }

    // Update telemetry in UI (only when main menu bento grid is visible)
    if (telemetryRotX && telemetryRotY && !bentoGrid.classList.contains('hidden')) {
        telemetryRotX.textContent = controls.object.rotation.x.toFixed(2);
        telemetryRotY.textContent = controls.object.rotation.y.toFixed(2);
    }

    // Update Extract HUD coordinate readout
    updateExtractHUD(elapsedTime);
}

animate();

// --- Responsive Window Resize ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
});

// --- Cyberpunk Terminal Utilities ---
function logToTerminal(message, status = 'info') {
    if (!terminalOutput) return;

    const line = document.createElement('div');
    line.textContent = `> ${message}`;

    if (status === 'success') {
        line.className = 'text-glow-green text-green-400';
    } else if (status === 'error') {
        line.className = 'text-glow-magenta text-fuchsia-400';
    } else {
        line.className = 'text-cyan-400';
    }

    terminalOutput.appendChild(line);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function logConsoleSystem(protocolIndex, protocolName) {
    const timestamp = new Date().toISOString().slice(11, 19);
    const consoleMsg = `[SYSTEM] Protocol ${protocolIndex} Initiated: ${protocolName} at ${timestamp}`;
    
    console.log(
        `%c ${consoleMsg} `,
        'color: #00f3ff; font-weight: bold; background: #05080f; padding: 6px 12px; border: 1px solid #00f3ff; border-radius: 4px; box-shadow: 0 0 10px rgba(0, 243, 255, 0.3);'
    );
}

function clearThreeGroup(group) {
    while (group.children.length > 0) {
        const child = group.children[0];
        group.remove(child);
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
            if (Array.isArray(child.material)) {
                child.material.forEach(m => m.dispose());
            } else {
                child.material.dispose();
            }
        }
    }
}

// --- PLY Loader with Native GZIP Streaming Decompression ---
async function prepareSceneForModel() {
    // If a viewer already exists, dispose of it first
    if (viewer) {
        const oldViewer = viewer;
        viewer = null;
        try {
            await oldViewer.dispose();
        } catch (e) {
            console.error('[DISPOSE_ERR]', e);
        }
    }

    // Clear previous model if exists
    if (loadedModel) {
        scene.remove(loadedModel);
        loadedModel.geometry.dispose();
        if (Array.isArray(loadedModel.material)) {
            loadedModel.material.forEach(m => m.dispose());
        } else {
            loadedModel.material.dispose();
        }
        loadedModel = null;
    }

    // Clear point cloud and extracted GLB references
    if (loadedPointCloud) {
        scene.remove(loadedPointCloud);
        loadedPointCloud.geometry.dispose();
        if (Array.isArray(loadedPointCloud.material)) {
            loadedPointCloud.material.forEach(m => m.dispose());
        } else {
            loadedPointCloud.material.dispose();
        }
        loadedPointCloud = null;
    }

    if (extractedGLB) {
        scene.remove(extractedGLB);
        extractedGLB.traverse(child => {
            if (child.isMesh) {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            }
        });
        extractedGLB = null;
    }
    
    // Clear previous selection markers safely
    clearThreeGroup(markersGroup);

    // Make the corridor invisible so only the splat model shows up
    hallwayGroup.visible = false;
}

function displayLoadedGeometry(geometry, fileName) {
    // Hide loading overlay, show floating splat toolbar
    loadingOverlay.classList.add('hidden');
    splatToolbar.classList.remove('hidden');

    // Reset toolbar buttons state
    isSelectModeActive = false;
    if (btnToggleSelect) {
        btnToggleSelect.textContent = '[Select Objects: OFF]';
        btnToggleSelect.classList.remove('btn-cyber-magenta');
        btnToggleSelect.classList.add('btn-cyber-cyan');
    }
    if (btnToggleSplatting) {
        btnToggleSplatting.textContent = '[3D Splatting: Point Size 0.06]';
    }

    // Set up Material. Supporting both mesh geometries and raw point clouds
    let material;
    const isMesh = geometry.index !== null;

    if (isMesh) {
        geometry.computeVertexNormals();
        material = new THREE.MeshStandardMaterial({
            vertexColors: geometry.attributes.color !== undefined,
            roughness: 0.4,
            metalness: 0.2,
            flatShading: true
        });

        if (geometry.attributes.color === undefined) {
            material.color.setHex(0x00f3ff);
            material.emissive.setHex(0x001a33);
        }

        loadedModel = new THREE.Mesh(geometry, material);
    } else {
        // Point cloud scan styling
        material = new THREE.PointsMaterial({
            size: 0.06,
            vertexColors: geometry.attributes.color !== undefined,
            transparent: true,
            opacity: 0.85
        });

        if (geometry.attributes.color === undefined) {
            material.color.setHex(0x00f3ff);
        }

        loadedModel = new THREE.Points(geometry, material);
    }

    // Center and scale the geometry
    geometry.computeBoundingBox();
    geometry.center();

    const size = new THREE.Vector3();
    geometry.boundingBox.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    const targetScale = 9.0 / maxDim; // Fit within 9 units box
    loadedModel.scale.set(targetScale, targetScale, targetScale);

    // Position at grid center
    loadedModel.position.set(0, 1.0, 0);
    scene.add(loadedModel);
    loadedPointCloud = loadedModel;

    // Retarget controls camera view to the center
    controls.target.set(0, 1.0, 0);
    camera.position.set(0, 3, 10);
    controls.update();

    const nodesCount = geometry.attributes.position.count;
    console.log(`%c[VECTRA] Map complete: ${nodesCount.toLocaleString()} spatial nodes loaded from ${fileName}.`, 'color: #39ff14');
    logToTerminal(`Neural stream mapped: ${nodesCount.toLocaleString()} nodes parsed successfully.`, 'success');
}

function displayLoadedSplatViewer(fileName) {
    // Hide loading overlay, show floating splat toolbar
    loadingOverlay.classList.add('hidden');
    splatToolbar.classList.remove('hidden');

    // Reset toolbar buttons state
    isSelectModeActive = false;
    if (btnToggleSelect) {
        btnToggleSelect.textContent = '[Select Objects: OFF]';
        btnToggleSelect.classList.remove('btn-cyber-magenta');
        btnToggleSelect.classList.add('btn-cyber-cyan');
    }
    if (btnToggleSplatting) {
        btnToggleSplatting.textContent = '[3D Splatting: Mode DENSE SPLAT]';
    }

    // Keep OrbitControls enabled
    controls.enabled = true;
    controls.target.set(0, 1.0, 0);
    camera.position.set(0, 3, 10);
    controls.update();

    // Log success
    const splatMesh = viewer.splatMesh;
    const splatCount = splatMesh.getSplatCount(true);
    console.log(`%c[VECTRA] Splat viewer active: ${splatCount.toLocaleString()} spatial nodes loaded from ${fileName}.`, 'color: #39ff14');
    logToTerminal(`Neural stream mapped: ${splatCount.toLocaleString()} splat nodes parsed successfully.`, 'success');
}

async function loadPLYModel(url) {
    if (isModelLoading) {
        logToTerminal('SYS_ALERT: Extraction process already in progress.', 'error');
        return;
    }

    isModelLoading = true;

    // Transition UI to Splat loading state (everything disappears)
    bentoGrid.classList.add('hidden');
    loadingOverlay.classList.remove('hidden');
    loadingBarFill.style.width = '10%';
    loadingPercent.textContent = '0%';
    loadingText.textContent = 'Connecting to neural file-stream...';

    await prepareSceneForModel();

    let objectURL = null;
    try {
        logToTerminal(`Opening compressed stream: ${url}...`);

        // Fetch compressed file directly
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP network error ${response.status}`);
        }

        loadingBarFill.style.width = '30%';
        loadingText.textContent = 'Decompressing spatial matrix (GZIP)...';

        // Read the response as ArrayBuffer in one go
        const compressedBuffer = await response.arrayBuffer();

        // Decompress using native DecompressionStream API
        const ds = new DecompressionStream('gzip');
        const decompressedStream = new Response(compressedBuffer).body.pipeThrough(ds);
        const decompressedResponse = new Response(decompressedStream);
        const arrayBuffer = await decompressedResponse.arrayBuffer();

        objectURL = URL.createObjectURL(new Blob([arrayBuffer], { type: 'application/octet-stream' }));

        logToTerminal('Initializing splat render pipeline...');

        // Initialize GaussianSplats3D.Viewer
        viewer = new GaussianSplats3D.Viewer({
            'selfDrivenMode': false,
            'useBuiltInControls': false,
            'renderer': renderer,
            'threeScene': scene,
            'camera': camera,
            'gpuAcceleratedSort': false, // Force WebWorker-based sorting to fix depth-sorting failures
            'enableOptionalEffects': true,
            'sharedMemoryForWorkers': false, // Avoid COOP/COEP SharedArrayBuffer CORS issues
            'optimizeSplatData': false, // Ensure parseToUncompressedSplatArray path is hit
            'showLoadingUI': false
        });

        camera.rotation.order = 'YXZ';

        // Load splat scene with smart two-phase progress mapping:
        // Downloading phase → 0–49%, Processing phase → 50–99%
        await viewer.addSplatScene(objectURL, {
            'splatAlphaRemovalThreshold': 5,
            'format': GaussianSplats3D.SceneFormat.Ply,
            'onProgress': (percentComplete, percentCompleteLabel, loaderStatus) => {
                let mappedPercent;
                if (loaderStatus === LoaderStatus.Downloading) {
                    mappedPercent = Math.round(percentComplete * 0.49);
                    loadingText.textContent = `Streaming neural matrix (${percentCompleteLabel || Math.round(percentComplete) + '%'} downloaded)...`;
                } else if (loaderStatus === LoaderStatus.Processing) {
                    mappedPercent = 50 + Math.round(percentComplete * 0.49);
                    loadingText.textContent = `Reconstructing 3D spatial matrix (${Math.round(percentComplete)}% built)...`;
                } else if (loaderStatus === LoaderStatus.Done) {
                    loadingBarFill.style.width = '99%';
                    loadingPercent.textContent = '99%';
                    loadingText.textContent = `Neural matrix compiled. Awaiting sort worker...`;
                    return;
                } else {
                    mappedPercent = Math.round(percentComplete);
                }
                loadingBarFill.style.width = `${mappedPercent}%`;
                loadingPercent.textContent = `${mappedPercent}%`;
                console.log(`[VECTRA LOADER] Stream progress: ${mappedPercent}% (raw ${percentComplete.toFixed(1)}%, phase ${loaderStatus})`);
            }
        });

        isModelLoading = false;
        loadingText.textContent = 'Initialising render pipeline...';
        pendingSplatDisplay = { fileName: url, objectURL };
        objectURL = null; // Transfer ownership to pendingSplatDisplay

    } catch (error) {
        console.error('[GS_LOAD_ERR] Falling back to standard PLYLoader.', error);
        logToTerminal('GS_LOAD_ERR: Falling back to standard point cloud rendering...', 'info');

        // Cleanup viewer if created
        if (viewer) {
            await viewer.dispose();
            viewer = null;
        }

        // Retry with fallback PLYLoader
        try {
            // Re-fetch and decompress if objectURL failed
            const response = await fetch(url);
            const compressedBuffer = await response.arrayBuffer();
            const ds = new DecompressionStream('gzip');
            const decompressedStream = new Response(compressedBuffer).body.pipeThrough(ds);
            const decompressedResponse = new Response(decompressedStream);
            const arrayBuffer = await decompressedResponse.arrayBuffer();

            const loader = new PLYLoader();
            const geometry = loader.parse(arrayBuffer);

            displayLoadedGeometry(geometry, 'point_cloud_optimized.ply.gz');
            isModelLoading = false;
        } catch (fallbackError) {
            isModelLoading = false;
            console.error('[FALLBACK_LOAD_ERR]', fallbackError);
            loadingOverlay.classList.add('hidden');
            bentoGrid.classList.remove('hidden');
            logToTerminal(`SYS_ERR: Failed to load spatial data: ${fallbackError.message}`, 'error');
            hallwayGroup.visible = true;
        }
    } finally {
        if (objectURL) {
            URL.revokeObjectURL(objectURL);
        }
    }
}

async function handleLocalFile(file) {
    if (!file) return;
    const name = file.name;
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    logToTerminal(`Loading local file: ${name} (${sizeMB} MB)...`);

    if (isModelLoading) {
        logToTerminal('SYS_ALERT: Extraction process already in progress.', 'error');
        return;
    }

    isModelLoading = true;

    // Transition UI to Splat loading state (everything disappears)
    bentoGrid.classList.add('hidden');
    loadingOverlay.classList.remove('hidden');
    loadingBarFill.style.width = '10%';
    loadingPercent.textContent = '0%';
    loadingText.textContent = `Reading local file: ${name}...`;

    await prepareSceneForModel();

    let objectURL = null;
    try {
        const arrayBuffer = await file.arrayBuffer();

        let decompressedBuffer = arrayBuffer;
        if (name.toLowerCase().endsWith('.gz')) {
            loadingText.textContent = 'Decompressing local spatial matrix (GZIP)...';
            const ds = new DecompressionStream('gzip');
            const decompressedStream = new Response(arrayBuffer).body.pipeThrough(ds);
            const decompressedResponse = new Response(decompressedStream);
            decompressedBuffer = await decompressedResponse.arrayBuffer();
        }

        objectURL = URL.createObjectURL(new Blob([decompressedBuffer], { type: 'application/octet-stream' }));

        // Determine correct SceneFormat
        let format = GaussianSplats3D.SceneFormat.Ply;
        const nameLower = name.toLowerCase();
        if (nameLower.endsWith('.ksplat')) {
            format = GaussianSplats3D.SceneFormat.KSplat;
        } else if (nameLower.endsWith('.splat')) {
            format = GaussianSplats3D.SceneFormat.Splat;
        } else if (nameLower.endsWith('.spz')) {
            format = GaussianSplats3D.SceneFormat.Spz;
        }

        // Initialize GaussianSplats3D.Viewer
        viewer = new GaussianSplats3D.Viewer({
            'selfDrivenMode': false,
            'useBuiltInControls': false,
            'renderer': renderer,
            'threeScene': scene,
            'camera': camera,
            'gpuAcceleratedSort': false,
            'enableOptionalEffects': true,
            'sharedMemoryForWorkers': false,
            'optimizeSplatData': false,
            'showLoadingUI': false
        });

        camera.rotation.order = 'YXZ';

        await viewer.addSplatScene(objectURL, {
            'splatAlphaRemovalThreshold': 5,
            'format': format,
            'onProgress': (percentComplete, percentCompleteLabel, loaderStatus) => {
                let mappedPercent;
                if (loaderStatus === LoaderStatus.Downloading) {
                    mappedPercent = Math.round(percentComplete * 0.49);
                    loadingText.textContent = `Reading local buffer (${percentCompleteLabel || Math.round(percentComplete) + '%'} buffered)...`;
                } else if (loaderStatus === LoaderStatus.Processing) {
                    mappedPercent = 50 + Math.round(percentComplete * 0.49);
                    loadingText.textContent = `Reconstructing 3D spatial matrix (${Math.round(percentComplete)}% built)...`;
                } else if (loaderStatus === LoaderStatus.Done) {
                    loadingBarFill.style.width = '99%';
                    loadingPercent.textContent = '99%';
                    loadingText.textContent = `Neural matrix compiled. Awaiting sort worker...`;
                    return;
                } else {
                    mappedPercent = Math.round(percentComplete);
                }
                loadingBarFill.style.width = `${mappedPercent}%`;
                loadingPercent.textContent = `${mappedPercent}%`;
                console.log(`[VECTRA LOADER] Local progress: ${mappedPercent}% (raw ${percentComplete.toFixed(1)}%, phase ${loaderStatus})`);
            }
        });

        isModelLoading = false;
        loadingText.textContent = 'Initialising render pipeline...';
        pendingSplatDisplay = { fileName: name, objectURL };
        objectURL = null; // Transfer ownership to pendingSplatDisplay

    } catch (error) {
        console.error('[GS_LOCAL_LOAD_ERR] Falling back to standard PLYLoader.', error);
        logToTerminal('GS_LOAD_ERR: Falling back to standard point cloud rendering...', 'info');

        if (viewer) {
            await viewer.dispose();
            viewer = null;
        }

        try {
            const arrayBuffer = await file.arrayBuffer();
            let decompressedBuffer = arrayBuffer;
            if (name.toLowerCase().endsWith('.gz')) {
                const ds = new DecompressionStream('gzip');
                const decompressedStream = new Response(arrayBuffer).body.pipeThrough(ds);
                const decompressedResponse = new Response(decompressedStream);
                decompressedBuffer = await decompressedResponse.arrayBuffer();
            }

            const loader = new PLYLoader();
            const geometry = loader.parse(decompressedBuffer);

            displayLoadedGeometry(geometry, name);
            isModelLoading = false;
        } catch (fallbackError) {
            isModelLoading = false;
            console.error('[LOCAL_FALLBACK_LOAD_ERR]', fallbackError);
            loadingOverlay.classList.add('hidden');
            bentoGrid.classList.remove('hidden');
            logToTerminal(`SYS_ERR: Failed to parse local file: ${fallbackError.message}`, 'error');
            hallwayGroup.visible = true;
        }
    } finally {
        if (objectURL) {
            URL.revokeObjectURL(objectURL);
        }
    }
}

// --- Drag & Drop listeners bound to window ---
if (dropZoneOverlay) {
    window.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        dropZoneOverlay.classList.remove('hidden');
    });

    window.addEventListener('dragenter', (e) => {
        e.preventDefault();
    });

    window.addEventListener('dragleave', (e) => {
        e.preventDefault();
        // Only hide if we drag completely outside the document or window
        if (!e.relatedTarget || e.clientY <= 0 || e.clientX <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
            dropZoneOverlay.classList.add('hidden');
        }
    });

    window.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZoneOverlay.classList.add('hidden');

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            const name = file.name.toLowerCase();
            if (name.endsWith('.ply') || name.endsWith('.ply.gz') || name.endsWith('.gz')) {
                handleLocalFile(file);
            } else {
                logToTerminal('SYS_ERR: Invalid file format. Only .ply and .ply.gz are supported.', 'error');
            }
        }
    });
}

// --- File Input selectors triggers ---
if (btnUploadFile && fileUploader) {
    btnUploadFile.addEventListener('click', () => {
        fileUploader.click();
    });

    fileUploader.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            handleLocalFile(file);
            // Reset value so same file can be selected again
            e.target.value = '';
        }
    });
}

// --- Raycaster & Point/Object Selection ---
const raycaster = new THREE.Raycaster();
raycaster.params.Points.threshold = 0.2; // Expand selection threshold for thin point clouds
const mouse = new THREE.Vector2();

canvas.addEventListener('click', (event) => {
    // Raycast only if splat mode is active, model is loaded, and Select mode is toggled ON
    if ((!loadedModel && !viewer) || isModelLoading || !isSelectModeActive) return;
    if (event.target !== canvas) return;

    // Calculate normalized device coordinates
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(loadedModel, true);

    if (intersects.length > 0) {
        const hit = intersects[0];
        const point = hit.point;

        // Visual indicator creation at clicked intersection
        const markerGeom = new THREE.SphereGeometry(0.12, 16, 16);
        const markerMat = new THREE.MeshBasicMaterial({
            color: 0xff00ff,
            transparent: true,
            opacity: 0.9,
            depthTest: true
        });
        const marker = new THREE.Mesh(markerGeom, markerMat);
        marker.position.copy(point);

        // Tech accent ring
        const outerRingGeom = new THREE.SphereGeometry(0.24, 8, 8);
        const outerEdges = new THREE.EdgesGeometry(outerRingGeom);
        const outerMat = new THREE.LineBasicMaterial({
            color: 0x00f3ff,
            transparent: true,
            opacity: 0.7
        });
        const outerWire = new THREE.LineSegments(outerEdges, outerMat);
        marker.add(outerWire);

        markersGroup.add(marker);

        // Max 10 coordinate logs stored concurrently in scene (FIFO)
        if (markersGroup.children.length > 10) {
            markersGroup.remove(markersGroup.children[0]);
        }

        console.log(
            `%c [VECTRA COORDINATE LOCK] X: ${point.x.toFixed(4)} | Y: ${point.y.toFixed(4)} | Z: ${point.z.toFixed(4)} `,
            'color: #ff00ff; font-weight: bold; background: #05080f; padding: 4px; border-left: 3px solid #ff00ff;'
        );
    }
});

// --- Splat Toolbar Interactive Functions ---

// 1. Back to Menu
if (btnBackMenu) {
    btnBackMenu.addEventListener('click', async () => {
        // Dispose of viewer safely
        if (viewer) {
            const oldViewer = viewer;
            viewer = null;
            try {
                await oldViewer.dispose();
            } catch (e) {
                console.error('[DISPOSE_ERR]', e);
            }
        }

        // Remove loaded model
        if (loadedModel) {
            scene.remove(loadedModel);
            loadedModel.geometry.dispose();
            if (Array.isArray(loadedModel.material)) {
                loadedModel.material.forEach(m => m.dispose());
            } else {
                loadedModel.material.dispose();
            }
            loadedModel = null;
        }
        
        // Clear selection markers safely
        clearThreeGroup(markersGroup);

        // Transition UI (reveal bento grid, hide toolbar)
        splatToolbar.classList.add('hidden');
        bentoGrid.classList.remove('hidden');

        // Restore scanned hallway background
        hallwayGroup.visible = true;

        // Reset controls targets
        controls.target.set(0, 0.5, 0);
        camera.position.set(0, 3, 10);
        controls.update();

        // Reset state values
        isSelectModeActive = false;
        if (btnToggleSelect) {
            btnToggleSelect.textContent = '[Select Objects: OFF]';
            btnToggleSelect.classList.remove('btn-cyber-magenta');
            btnToggleSelect.classList.add('btn-cyber-cyan');
        }

        logToTerminal('Returned to Spatial Command Core. Telemetry link restored.', 'info');
    });
}

// 2. Select Objects mode toggle
if (btnToggleSelect) {
    btnToggleSelect.addEventListener('click', () => {
        isSelectModeActive = !isSelectModeActive;

        if (isSelectModeActive) {
            btnToggleSelect.textContent = '[Select Objects: ON]';
            btnToggleSelect.classList.remove('btn-cyber-cyan');
            btnToggleSelect.classList.add('btn-cyber-magenta');
            console.log('%c[VECTRA] Selection Mode Active. Click points on model to select.', 'color: #ff00ff');
        } else {
            btnToggleSelect.textContent = '[Select Objects: OFF]';
            btnToggleSelect.classList.remove('btn-cyber-magenta');
            btnToggleSelect.classList.add('btn-cyber-cyan');
            console.log('%c[VECTRA] Selection Mode Deactivated.', 'color: #00f3ff');
        }
    });
}

// 3. 3D Splatting rendering adjustments
// 3. 3D Splatting rendering adjustments
if (btnToggleSplatting) {
    btnToggleSplatting.addEventListener('click', () => {
        if (viewer && viewer.initialized && viewer.splatRenderReady) {
            // For Gaussian Splatting, toggle between point cloud mode and standard splat mode
            const splatMesh = viewer.splatMesh;
            const isPointCloud = !splatMesh.getPointCloudModeEnabled();
            splatMesh.setPointCloudModeEnabled(isPointCloud);
            btnToggleSplatting.textContent = `[3D Splatting: Mode ${isPointCloud ? 'POINT CLOUD' : 'DENSE SPLAT'}]`;
            console.log(`%c[VECTRA] Gaussian splat mode toggled: ${isPointCloud ? 'Point Cloud' : 'Dense Splat'}`, 'color: #00f3ff');
            viewer.forceRenderNextFrame();
            return;
        }

        if (!loadedModel) return;

        if (loadedModel.isPoints) {
            // Cycle Point Cloud sizes
            currentSizeIndex = (currentSizeIndex + 1) % pointSizes.length;
            const nextSize = pointSizes[currentSizeIndex];
            loadedModel.material.size = nextSize;
            loadedModel.material.needsUpdate = true;
            btnToggleSplatting.textContent = `[3D Splatting: Point Size ${nextSize}]`;
            console.log(`%c[VECTRA] Point cloud rendering size set to: ${nextSize}`, 'color: #00f3ff');
        } else if (loadedModel.isMesh) {
            // Cycle Mesh wireframe state for standard geometries
            loadedModel.material.wireframe = !loadedModel.material.wireframe;
            loadedModel.material.needsUpdate = true;
            btnToggleSplatting.textContent = `[3D Splatting: Wireframe: ${loadedModel.material.wireframe ? 'ON' : 'OFF'}]`;
            console.log(`%c[VECTRA] Mesh wireframe state set to: ${loadedModel.material.wireframe}`, 'color: #00f3ff');
        }
    });
}

// --- Main Menu Buttons binding ---
if (btnCreator) {
    btnCreator.addEventListener('click', () => {
        activateCreatorMode();
    });
}

// Terminal commands listener
if (terminalInput) {
    terminalInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && terminalInput.value.trim() !== '') {
            const inputVal = terminalInput.value.trim();
            logToTerminal(`USER@VECTRA: ${inputVal}`, 'info');
            terminalInput.value = '';

            // Process inputs
            setTimeout(() => {
                const query = inputVal.toLowerCase();
                if (query === 'help') {
                    logToTerminal('Available Protocols:', 'info');
                    logToTerminal(' - upload  : Initialize custom .ply cloud upload', 'info');
                    logToTerminal(' - creator : Trigger Text-to-3D spatial diffusion', 'info');
                    logToTerminal(' - scale <val> : Set splatScale multiplier (e.g. scale 0.05)', 'info');
                    logToTerminal(' - clear   : Flush neural terminal console buffer', 'info');
                } else if (query.startsWith('scale ')) {
                    const newScale = parseFloat(query.split(' ')[1]);
                    if (!isNaN(newScale)) {
                        window.VECTRA_SPLAT_SCALE = newScale;
                        logToTerminal(`Splat scale multiplier set to: ${newScale}. Re-upload/inject PLY to apply.`, 'success');
                    } else {
                        logToTerminal('SYS_ERR: Invalid scale value. Use e.g. "scale 0.05"', 'error');
                    }
                } else if (query === 'upload' || query === 'protocol 1') {
                    btnUploadFile.click();
                } else if (query === 'extract' || query === 'protocol 3') {
                    btnExtractMode && btnExtractMode.click();
                } else if (query === 'creator' || query === 'protocol 2') {
                    btnCreator.click();
                } else if (query === 'clear') {
                    if (terminalOutput) {
                        terminalOutput.replaceChildren();
                        logToTerminal('Console cleared. System listening.', 'success');
                    }
                } else {
                    logToTerminal(`[CO-PILOT] Latent matrix query "${inputVal}" accepted. Awaiting protocol execution parameters.`, 'info');
                }
            }, 300);
        }
    });
}

// ══════════════════════════════════════════════════════════════════════════════
//  EXTRACT MODE — Image-to-3D Protocol (Protocol 3)
//  SuperSplat-style bounding-box selection engine + DBSE hook
// ══════════════════════════════════════════════════════════════════════════════

// ── DOM references ──────────────────────────────────────────────────────────
const btnExtractMode    = document.getElementById('btn-extract-mode');
const extractToolbar    = document.getElementById('extract-toolbar');
const btnExtractAbort   = document.getElementById('btn-extract-abort');
const btnExtractOrbit   = document.getElementById('btn-extract-orbit');
const btnExtractSelect  = document.getElementById('btn-extract-select');
const btnExtractClear   = document.getElementById('btn-extract-clear');
const extractModeStatus = document.getElementById('extract-mode-status');
const selectionCanvas   = document.getElementById('selection-canvas');
const extractHud        = document.getElementById('extract-hud');
const extractHudCoords  = document.getElementById('extract-hud-coords');
const extractHudFps     = document.getElementById('extract-hud-fps');
const extractLoadingOverlay = document.getElementById('extract-loading-overlay');
const extractLoadingText    = document.getElementById('extract-loading-text');
const extractLoadingBar     = document.getElementById('extract-loading-bar-fill');
const extractLoadingPercent = document.getElementById('extract-loading-percent');

// ── Extract Mode state ──────────────────────────────────────────────────────
let isExtractModeActive  = false;
let isSelectionDrawing   = false; // true = bbox draw mode, false = orbit mode

// Bounding-box mouse tracking (raw client pixels)
let selBoxStart   = { x: 0, y: 0 };
let selBoxCurrent = { x: 0, y: 0 };
let isMouseDown   = false;

// Extract scene state
let extractSceneOriginalFog = null;
let extractSceneOriginalBg  = null;
let extractFpsFrames = 0;
let extractFpsLast   = performance.now();
let extractFps       = 0;

// ── Utility: set status label text safely ──────────────────────────────────
function setExtractStatus(text) {
    if (extractModeStatus) extractModeStatus.textContent = text;
}

// ── Utility: swap active highlight between Orbit and Select buttons ────────
function setExtractActiveButton(mode) {
    if (!btnExtractOrbit || !btnExtractSelect) return;
    if (mode === 'orbit') {
        btnExtractOrbit.classList.add('extract-btn-active');
        btnExtractSelect.classList.remove('extract-btn-active');
    } else {
        btnExtractSelect.classList.add('extract-btn-active');
        btnExtractOrbit.classList.remove('extract-btn-active');
    }
}

// ── Fade helpers ────────────────────────────────────────────────────────────
function fadeOutMainUI() {
    if (!bentoGrid) return;
    bentoGrid.classList.add('ui-fade-out');
    setTimeout(() => bentoGrid.classList.add('hidden'), 460);
}

function fadeInMainUI() {
    if (!bentoGrid) return;
    bentoGrid.classList.remove('hidden');
    requestAnimationFrame(() => {
        bentoGrid.classList.remove('ui-fade-out');
        bentoGrid.classList.add('ui-fade-in');
        setTimeout(() => bentoGrid.classList.remove('ui-fade-in'), 460);
    });
}

function showExtractToolbar() {
    if (!extractToolbar) return;
    // Force a reflow to restart the CSS transition cleanly
    void extractToolbar.offsetHeight;
    requestAnimationFrame(() => {
        extractToolbar.classList.add('extract-toolbar-visible');
    });
}

function hideExtractToolbar() {
    if (!extractToolbar) return;
    extractToolbar.classList.remove('extract-toolbar-visible');
}

// ── Extract Scene Animation (green tint, pulsing fog) ───────────────────────
let extractGreenLight = null;
function animateExtractScene(t) {
    // Pulse a green light around the scene in Extract mode
    if (extractGreenLight) {
        extractGreenLight.intensity = 2.5 + Math.sin(t * 3.0) * 1.5;
        extractGreenLight.position.x = Math.sin(t * 0.6) * 8;
        extractGreenLight.position.z = Math.cos(t * 0.6) * 8;
    }
    // FPS counter
    extractFpsFrames++;
    const now = performance.now();
    if (now - extractFpsLast >= 500) {
        extractFps = Math.round(extractFpsFrames * 1000 / (now - extractFpsLast));
        extractFpsFrames = 0;
        extractFpsLast = now;
    }
}

// ── Extract HUD update ───────────────────────────────────────────────────────
function updateExtractHUD(t) {
    if (!isExtractModeActive || !extractHud) return;
    if (extractHudCoords) {
        const pos = camera.position;
        extractHudCoords.textContent =
            `X:${pos.x.toFixed(2)} Y:${pos.y.toFixed(2)} Z:${pos.z.toFixed(2)}`;
    }
    if (extractHudFps) {
        extractHudFps.textContent = `${extractFps} FPS`;
    }
}

// ── Activate Extract Mode ───────────────────────────────────────────────────
function activateExtractMode() {
    if (isExtractModeActive) return;
    isExtractModeActive = true;

    logConsoleSystem(3, 'Extract Mode (Image-to-3D Protocol)');
    logToTerminal('Protocol 3 Initiated: Extract Mode (DBSE Engine)...', 'info');
    logToTerminal('DBSE: Spatial extraction viewport active. WASD to navigate.', 'info');
    logToTerminal('DBSE: Click [SELECT] then drag to lock target area.', 'success');

    // ── Dramatic scene transformation ──
    // Save original scene state
    extractSceneOriginalFog = scene.fog ? { color: scene.fog.color.clone(), density: scene.fog.density } : null;
    extractSceneOriginalBg  = scene.background ? scene.background.clone() : null;

    // Shift scene to green extraction tint
    scene.background = new THREE.Color(0x010802);
    scene.fog = new THREE.FogExp2(0x010802, 0.018);

    // Add a sweeping green extraction light
    extractGreenLight = new THREE.PointLight(0x39ff14, 4, 40);
    extractGreenLight.position.set(0, 5, 0);
    scene.add(extractGreenLight);

    // Tint the grid to green
    gridHelper.material = new THREE.LineBasicMaterial({ color: 0x39ff14, opacity: 0.4, transparent: true });

    // Ensure orbit controls are ON as default entry state
    controls.enabled = true;
    controls.maxPolarAngle = Math.PI; // Unlock full vertical rotation in extract mode
    isSelectionDrawing = false;
    setExtractActiveButton('orbit');
    setExtractStatus('ORBIT MODE — WASD + MOUSE');

    // Disable the old 3D raycaster selection mode
    isSelectModeActive = false;

    // Fade out main UI
    fadeOutMainUI();

    // Slide toolbar in
    showExtractToolbar();

    // Show the Extract HUD
    if (extractHud) extractHud.classList.remove('hidden');

    console.log(
        '%c [SYSTEM] Extract Mode Activated — DBSE Engine Online | WASD to fly ',
        'color: #39ff14; font-weight: bold; background: #050f08; padding: 6px 12px; border: 1px solid #39ff14; border-radius: 4px;'
    );
}

// ── Deactivate Extract Mode ─────────────────────────────────────────────────
function deactivateExtractMode() {
    if (!isExtractModeActive) return;
    isExtractModeActive = false;
    isSelectionDrawing = false;
    isMouseDown = false;

    // Remove extracted GLB if exists
    if (extractedGLB) {
        scene.remove(extractedGLB);
        extractedGLB.traverse(child => {
            if (child.isMesh) {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            }
        });
        extractedGLB = null;
    }

    // Restore original .ply model (point cloud or splats)
    if (loadedPointCloud) {
        loadedPointCloud.visible = true;
    }
    if (viewer && viewer.splatMesh) {
        viewer.splatMesh.visible = true;
        viewer.forceRenderNextFrame();
    }

    // Disable GLB lights
    glbAmbientLight.visible = false;
    glbDirectionalLight.visible = false;
    cyanPointLight.visible = true;
    magentaPointLight.visible = true;
    gridHelper.visible = true;

    // Restore scene visuals
    if (extractSceneOriginalBg) {
        scene.background = extractSceneOriginalBg;
    } else {
        scene.background = new THREE.Color(0x020204);
    }
    if (extractSceneOriginalFog) {
        scene.fog = new THREE.FogExp2(extractSceneOriginalFog.color.getHex(), extractSceneOriginalFog.density);
    } else {
        scene.fog = new THREE.FogExp2(0x020204, 0.025);
    }

    // Remove extract green light
    if (extractGreenLight) {
        scene.remove(extractGreenLight);
        extractGreenLight.dispose();
        extractGreenLight = null;
    }

    // Restore grid color
    gridHelper.material = new THREE.LineBasicMaterial({ vertexColors: false });
    gridHelper.geometry.dispose();
    // Rebuild grid with original colors
    const newGrid = new THREE.GridHelper(120, 60, 0xff00ff, 0x00f3ff);
    newGrid.position.y = -1.5;
    scene.remove(gridHelper);
    scene.add(newGrid);
    gridHelper = newGrid;

    // Restore orbit controls
    controls.enabled = true;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;

    // Clear and disable the selection canvas overlay
    disableSelectionCanvas();

    // Hide the Extract HUD
    if (extractHud) extractHud.classList.add('hidden');

    // Slide toolbar out
    hideExtractToolbar();

    // Hide clear button
    if (btnExtractClear) btnExtractClear.classList.add('hidden');

    // Fade main UI back in after toolbar finishes hiding
    setTimeout(() => {
        fadeInMainUI();
        logToTerminal('Extract Mode aborted. Returning to Spatial Command Core.', 'info');
    }, 300);

    // Reset camera to default overview
    controls.target.set(0, 0.5, 0);
    camera.position.set(0, 3, 10);
    controls.update();

    console.log(
        '%c [SYSTEM] Extract Mode Aborted — Returning to Command Core ',
        'color: #ff2d55; font-weight: bold; background: #0f0508; padding: 6px 12px; border: 1px solid #ff2d55; border-radius: 4px;'
    );
}

// ── Button: [Extract Mode] in main panel ────────────────────────────────────
if (btnExtractMode) {
    btnExtractMode.addEventListener('click', () => {
        activateExtractMode();
    });
}

// ── Button: [Abort] ─────────────────────────────────────────────────────────
if (btnExtractAbort) {
    btnExtractAbort.addEventListener('click', () => {
        deactivateExtractMode();
    });
}

// ── Button: [Orbit Mode] ────────────────────────────────────────────────────
if (btnExtractOrbit) {
    btnExtractOrbit.addEventListener('click', () => {
        if (!isExtractModeActive) return;
        isSelectionDrawing = false;

        // Re-enable Three.js orbit controls
        controls.enabled = true;

        // Deactivate 2D selection canvas
        disableSelectionCanvas();

        setExtractActiveButton('orbit');
        setExtractStatus('ORBIT MODE ACTIVE');

        console.log(
            '%c [SYSTEM] Orbit Mode Engaged — Camera Navigation Unlocked ',
            'color: #39ff14; font-weight: bold; background: #050f08; padding: 4px 10px; border-left: 3px solid #39ff14;'
        );
    });
}

// ── Button: [Select / Extract] ───────────────────────────────────────────────
if (btnExtractSelect) {
    btnExtractSelect.addEventListener('click', () => {
        if (!isExtractModeActive) return;
        isSelectionDrawing = true;

        // Lock the camera — disable OrbitControls so mouse draws, not orbits
        controls.enabled = false;

        // Activate 2D selection canvas
        enableSelectionCanvas();

        setExtractActiveButton('select');
        setExtractStatus('SELECT MODE — DRAW BOUNDING BOX');

        console.log(
            '%c [SYSTEM] Select/Extract Mode Engaged — Draw Bounding Box to Lock Target ',
            'color: #39ff14; font-weight: bold; background: #050f08; padding: 4px 10px; border-left: 3px solid #39ff14;'
        );
    });
}

// ── Button: [Clear 3D] ──────────────────────────────────────────────────────
if (btnExtractClear) {
    btnExtractClear.addEventListener('click', () => {
        // 1. Remove and dispose extracted GLB
        if (extractedGLB) {
            scene.remove(extractedGLB);
            extractedGLB.traverse(child => {
                if (child.isMesh) {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(m => m.dispose());
                        } else {
                            child.material.dispose();
                        }
                    }
                }
            });
            extractedGLB = null;
        }

        // 2. Restore original .ply model (point cloud or splats)
        if (loadedPointCloud) {
            loadedPointCloud.visible = true;
        }
        if (viewer && viewer.splatMesh) {
            viewer.splatMesh.visible = true;
            viewer.forceRenderNextFrame();
        }

        // 3. Restore original lights and background
        glbAmbientLight.visible = false;
        glbDirectionalLight.visible = false;
        cyanPointLight.visible = true;
        magentaPointLight.visible = true;
        gridHelper.visible = true;

        if (isExtractModeActive) {
            scene.background = new THREE.Color(0x010802);
            scene.fog = new THREE.FogExp2(0x010802, 0.018);
            if (extractGreenLight) {
                extractGreenLight.visible = true;
            }
            gridHelper.material = new THREE.LineBasicMaterial({ color: 0x39ff14, opacity: 0.4, transparent: true });
        } else {
            scene.background = new THREE.Color(0x020204);
            scene.fog = new THREE.FogExp2(0x020204, 0.025);
            gridHelper.material = new THREE.LineBasicMaterial({ vertexColors: false });
        }

        // 4. Reset controls/camera
        if (loadedPointCloud) {
            loadedPointCloud.geometry.computeBoundingBox();
            const center = new THREE.Vector3();
            loadedPointCloud.geometry.boundingBox.getCenter(center);
            controls.target.copy(center).add(loadedPointCloud.position);
        } else {
            controls.target.set(0, 1.0, 0);
        }
        camera.position.set(0, 3, 10);
        controls.update();

        btnExtractClear.classList.add('hidden');
        logToTerminal("Extract: 3D model output cleared. Spatial scan view restored.", "info");
    });
}

// ══════════════════════════════════════════════════════════════════════════════
//  2D BOUNDING-BOX CANVAS OVERLAY ENGINE
// ══════════════════════════════════════════════════════════════════════════════

let selCtx = null; // 2D context for the selection canvas

// Colours used when painting the selection rectangle
const SEL_STROKE_COLOR = 'rgba(57, 255, 20, 0.95)';
const SEL_FILL_COLOR   = 'rgba(57, 255, 20, 0.07)';
const SEL_CORNER_SIZE  = 6; // px — corner handle size

function enableSelectionCanvas() {
    if (!selectionCanvas) return;

    // Size the canvas to exactly match the viewport
    selectionCanvas.width  = window.innerWidth;
    selectionCanvas.height = window.innerHeight;

    selCtx = selectionCanvas.getContext('2d');

    // Make it interactive (receives mouse events)
    selectionCanvas.style.pointerEvents = 'auto';
    selectionCanvas.classList.add('select-drawing-mode');
}

function disableSelectionCanvas() {
    if (!selectionCanvas) return;

    selectionCanvas.style.pointerEvents = 'none';
    selectionCanvas.classList.remove('select-drawing-mode');

    // Clear any drawn rectangle
    if (selCtx) {
        selCtx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);
    }
    selCtx = null;
    isMouseDown = false;
}

// ── Draw the neon selection rectangle ───────────────────────────────────────
function drawSelectionRect(x, y, w, h) {
    if (!selCtx) return;
    selCtx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);

    // Glowing neon border — draw twice for bloom effect
    selCtx.lineWidth   = 1.5;
    selCtx.strokeStyle = 'rgba(57, 255, 20, 0.25)';
    selCtx.shadowColor = '#39ff14';
    selCtx.shadowBlur  = 18;
    selCtx.strokeRect(x, y, w, h);

    selCtx.lineWidth   = 1;
    selCtx.strokeStyle = SEL_STROKE_COLOR;
    selCtx.shadowBlur  = 8;
    selCtx.strokeRect(x, y, w, h);

    // Corner handles — 4 small hollow squares at each corner (no fillRect)
    selCtx.lineWidth   = 1;
    selCtx.strokeStyle = SEL_STROKE_COLOR;
    selCtx.shadowBlur  = 12;
    const c = SEL_CORNER_SIZE;
    const corners = [
        [x - c / 2, y - c / 2],
        [x + w - c / 2, y - c / 2],
        [x - c / 2, y + h - c / 2],
        [x + w - c / 2, y + h - c / 2],
    ];
    corners.forEach(([cx, cy]) => selCtx.strokeRect(cx, cy, c, c));

    // Dimension label (safe textContent-equivalent via canvas fillText)
    selCtx.shadowBlur  = 6;
    selCtx.fillStyle   = 'rgba(57, 255, 20, 0.85)';
    selCtx.font        = '10px "Share Tech Mono", monospace';
    const label = `${Math.abs(Math.round(w))} × ${Math.abs(Math.round(h))} px`;
    selCtx.fillText(label, x + 4, y > 16 ? y - 4 : y + Math.abs(h) + 12);

    // Reset shadow so it doesn't bleed into other draws
    selCtx.shadowBlur  = 0;
}

// ── Mouse events on the selection canvas ────────────────────────────────────
if (selectionCanvas) {
    selectionCanvas.addEventListener('mousedown', (e) => {
        if (!isSelectionDrawing || !isExtractModeActive) return;
        e.preventDefault();
        isMouseDown      = true;
        selBoxStart      = { x: e.clientX, y: e.clientY };
        selBoxCurrent    = { x: e.clientX, y: e.clientY };
    });

    selectionCanvas.addEventListener('mousemove', (e) => {
        if (!isMouseDown || !isSelectionDrawing) return;
        selBoxCurrent = { x: e.clientX, y: e.clientY };

        const x = Math.min(selBoxStart.x, selBoxCurrent.x);
        const y = Math.min(selBoxStart.y, selBoxCurrent.y);
        const w = Math.abs(selBoxCurrent.x - selBoxStart.x);
        const h = Math.abs(selBoxCurrent.y - selBoxStart.y);

        drawSelectionRect(x, y, w, h);
    });

    selectionCanvas.addEventListener('mouseup', (e) => {
        if (!isMouseDown || !isSelectionDrawing) return;
        e.preventDefault();
        isMouseDown = false;

        const x = Math.min(selBoxStart.x, e.clientX);
        const y = Math.min(selBoxStart.y, e.clientY);
        const w = Math.abs(e.clientX - selBoxStart.x);
        const h = Math.abs(e.clientY - selBoxStart.y);

        // Clear the green box from the 2D overlay context first so it doesn't appear in the screenshot
        if (selCtx) {
            selCtx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);
        }

        // Ignore trivially small (accidental click) boxes
        if (w < 8 || h < 8) {
            return;
        }

        const boundingBox = { x, y, w, h };

        // ── [SYSTEM] Target Area Locked: log bounding box ──────────────────
        console.log(
            `%c [SYSTEM] Target Area Locked: { x: ${Math.round(x)}, y: ${Math.round(y)}, w: ${Math.round(w)}, h: ${Math.round(h)} } `,
            'color: #39ff14; font-weight: bold; background: #050f08; padding: 6px 14px; border: 1px solid #39ff14; border-radius: 4px; box-shadow: 0 0 10px rgba(57,255,20,0.3);'
        );

        setExtractStatus(`TARGET LOCKED [ ${Math.round(w)}×${Math.round(h)} ]`);

        // ── Screenshot: capture the 3D canvas within selection bounds ──────
        captureSelectionSnapshot(boundingBox);
    });

    // Cancel draw if mouse leaves the overlay area entirely
    selectionCanvas.addEventListener('mouseleave', () => {
        if (isMouseDown && isSelectionDrawing) {
            isMouseDown = false;
            if (selCtx) selCtx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);
        }
    });
}

// Also resize the selection canvas when the window resizes
window.addEventListener('resize', () => {
    if (selectionCanvas && selCtx) {
        selectionCanvas.width  = window.innerWidth;
        selectionCanvas.height = window.innerHeight;
    }
});

// ══════════════════════════════════════════════════════════════════════════════
//  SNAPSHOT — Capture selected region from the Three.js canvas
// ══════════════════════════════════════════════════════════════════════════════

/**
 * captureSelectionSnapshot
 *
 * Reads the current Three.js WebGL canvas pixels within the supplied
 * 2D bounding box, draws them onto a temporary off-screen canvas, and
 * returns a PNG data-URL.  Also triggers a browser download of the crop.
 *
 * Security note: all data stays in memory / the user's own browser — no
 * external origin involved, no user-controlled strings are used in any
 * path or innerHTML context.
 *
 * @param {{ x: number, y: number, w: number, h: number }} bb
 * @returns {string|null} PNG data-URL of the captured region, or null on error
 */
function showExtractLoader(text, percent) {
    if (!extractLoadingOverlay) return;
    extractLoadingOverlay.classList.remove('hidden');
    if (extractLoadingText) extractLoadingText.textContent = text;
    if (extractLoadingBar) extractLoadingBar.style.width = `${percent}%`;
    if (extractLoadingPercent) extractLoadingPercent.textContent = `${percent}% Processed`;
}

function hideExtractLoader() {
    if (extractLoadingOverlay) extractLoadingOverlay.classList.add('hidden');
}

function captureSelectionSnapshot(bb) {
    try {
        // Save current visual states to prevent visual impact on user
        const prevBg = scene.background ? scene.background.clone() : null;
        const prevFog = scene.fog;
        const prevGridVisible = gridHelper.visible;
        const prevGreenLightVisible = extractGreenLight ? extractGreenLight.visible : true;

        // Temporarily set a solid white background and hide grid, fog, and green sweeping light
        scene.background = new THREE.Color(0xffffff);
        scene.fog = null;
        gridHelper.visible = false;
        if (extractGreenLight) {
            extractGreenLight.visible = false;
        }

        // Ensure the Three.js renderer has just rendered a clean frame
        if (viewer && viewer.initialized && viewer.splatRenderReady) {
            viewer.update();
            viewer.render();
        } else {
            renderer.render(scene, camera);
        }

        // Clamp crop to canvas bounds (prevent out-of-bounds reads)
        const srcCanvas = renderer.domElement;
        
        // Convert CSS pixels to canvas coordinate system using bounding client rect
        const rect = srcCanvas.getBoundingClientRect();
        const rx = bb.x - rect.left;
        const ry = bb.y - rect.top;

        const scaleX = srcCanvas.width / rect.width;
        const scaleY = srcCanvas.height / rect.height;

        const px = Math.round(rx * scaleX);
        const py = Math.round(ry * scaleY);
        const pw = Math.round(bb.w * scaleX);
        const ph = Math.round(bb.h * scaleY);

        const clampedX = Math.max(0, Math.min(px, srcCanvas.width  - 1));
        const clampedY = Math.max(0, Math.min(py, srcCanvas.height - 1));
        const clampedW = Math.min(pw, srcCanvas.width  - clampedX);
        const clampedH = Math.min(ph, srcCanvas.height - clampedY);

        if (clampedW <= 0 || clampedH <= 0) {
            console.warn('[SYSTEM] Snapshot: selection is outside the canvas bounds.');
            // Restore original states
            scene.background = prevBg;
            scene.fog = prevFog;
            gridHelper.visible = prevGridVisible;
            if (extractGreenLight) {
                extractGreenLight.visible = prevGreenLightVisible;
            }
            return null;
        }

        // Off-screen canvas to receive the cropped pixels
        const offCanvas = document.createElement('canvas');
        offCanvas.width  = clampedW;
        offCanvas.height = clampedH;
        const offCtx = offCanvas.getContext('2d');

        // Draw the portion of the 3D canvas we selected
        offCtx.drawImage(srcCanvas, clampedX, clampedY, clampedW, clampedH, 0, 0, clampedW, clampedH);

        const dataURL = offCanvas.toDataURL('image/png');

        // Restore original visual states immediately after capture
        scene.background = prevBg;
        scene.fog = prevFog;
        gridHelper.visible = prevGridVisible;
        if (extractGreenLight) {
            extractGreenLight.visible = prevGreenLightVisible;
        }

        // Re-render original scene immediately so user doesn't see a white flash
        if (viewer && viewer.initialized && viewer.splatRenderReady) {
            viewer.update();
            viewer.render();
        } else {
            renderer.render(scene, camera);
        }

        console.log(
            '%c [SYSTEM] Snapshot captured in memory. ',
            'color: #39ff14; font-weight: bold; background: #050f08; padding: 4px 10px; border-left: 3px solid #39ff14;'
        );
        logToTerminal(`Snapshot captured: ${Math.round(bb.w)}×${Math.round(bb.h)}px region cropped.`, 'success');

        // Initiate Transmission & Loading Pipeline
        showExtractLoader("Isolating selected bounding region...", 15);
        logToTerminal("Extract: Transmitting viewport slice to AI extraction server...");

        fetch('/api-fastapi/extract', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: dataURL })
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errData => {
                    throw new Error(errData.detail || `Server error ${response.status}`);
                });
            }
            showExtractLoader("Reconstructing 3D spatial geometry (TripoSR Space)...", 65);
            logToTerminal("Extract: Bounding slice accepted. Generating mesh in cloud space...");
            return response.arrayBuffer();
        })
        .then(arrayBuffer => {
            showExtractLoader("Mesh generated. Compiling spatial nodes...", 90);
            logToTerminal("Extract: Reconstructing mesh polygons...");

            const loader = new GLTFLoader();
            loader.parse(arrayBuffer, '', (gltf) => {
                const model = gltf.scene;

                // Position in front of the camera (center of camera view)
                const forward = new THREE.Vector3();
                camera.getWorldDirection(forward);
                const targetPos = new THREE.Vector3().copy(camera.position).addScaledVector(forward, 5);
                model.position.copy(targetPos);

                // Center and scale the loaded mesh automatically
                const box = new THREE.Box3().setFromObject(model);
                const size = new THREE.Vector3();
                box.getSize(size);
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 3.5 / maxDim; // Fit inside 3.5 units
                model.scale.set(scale, scale, scale);

                // Re-center around the target position
                const center = new THREE.Vector3();
                box.getCenter(center);
                model.position.x += (targetPos.x - center.x);
                model.position.y += (targetPos.y - center.y);
                model.position.z += (targetPos.z - center.z);

                // 1. Hide the original .ply file (splats and point cloud)
                if (loadedPointCloud) {
                    loadedPointCloud.visible = false;
                }
                if (viewer && viewer.splatMesh) {
                    viewer.splatMesh.visible = false;
                }

                // 2. Clear previous extracted GLB if exists
                if (extractedGLB) {
                    scene.remove(extractedGLB);
                    extractedGLB.traverse(child => {
                        if (child.isMesh) {
                            if (child.geometry) child.geometry.dispose();
                            if (child.material) {
                                if (Array.isArray(child.material)) {
                                    child.material.forEach(m => m.dispose());
                                } else {
                                    child.material.dispose();
                                }
                            }
                        }
                    });
                }

                // 3. Add newly generated mesh to the scene
                scene.add(model);
                extractedGLB = model;

                // 4. Set bright white lighting and clean background
                scene.background = new THREE.Color(0x0c0c0e);
                scene.fog = new THREE.FogExp2(0x0c0c0e, 0.015);
                glbAmbientLight.visible = true;
                glbDirectionalLight.visible = true;

                // Hide original cyberpunk point lights and grid
                cyanPointLight.visible = false;
                magentaPointLight.visible = false;
                gridHelper.visible = false;
                if (extractGreenLight) {
                    extractGreenLight.visible = false;
                }

                // 5. Retarget controls camera view to the center of the extracted model
                controls.target.copy(targetPos);
                camera.position.copy(targetPos).add(new THREE.Vector3(0, 1.5, 4));
                controls.update();

                // Show Clear 3D button
                if (btnExtractClear) {
                    btnExtractClear.classList.remove('hidden');
                }

                // Hide loaders
                hideExtractLoader();
                logToTerminal("Extract: 3D model successfully injected in plain viewport.", "success");

                // Switch back to orbit controls automatically
                if (btnExtractOrbit) btnExtractOrbit.click();
            }, (err) => {
                throw new Error(`GLTF parser error: ${err.message}`);
            });
        })
        .catch(err => {
            console.error(err);
            hideExtractLoader();
            logToTerminal(`SYS_ERR: Spatial extraction failed: ${err.message}`, 'error');
            if (btnExtractOrbit) btnExtractOrbit.click();
        });

        return dataURL;

    } catch (err) {
        console.error('[SYSTEM_ERR] Snapshot failed:', err.message);
        logToTerminal('SYS_ERR: Snapshot capture failed. Check console.', 'error');
        return null;
    }
}

// ============================================================================
// ── CREATOR MODE (TEXT-TO-3D PROTOCOL) IMPLEMENTATION ──────────────────────
// ============================================================================

// --- State Variables ---
let isCreatorModeActive = false;
let creatorSceneOriginalFog = null;
let creatorSceneOriginalBg = null;
let creatorFuchsiaLight = null;

// --- DOM Elements ---
const creatorToolbar = document.getElementById('creator-toolbar');
const creatorPromptInput = document.getElementById('creator-prompt-input');
const btnCreatorSummon = document.getElementById('btn-creator-summon');
const btnCreatorConfigToggle = document.getElementById('btn-creator-config-toggle');
const btnCreatorAbort = document.getElementById('btn-creator-abort');
const creatorModeStatus = document.getElementById('creator-mode-status');

const creatorConfigPanel = document.getElementById('creator-config-panel');
const btnConfigClose = document.getElementById('btn-config-close');
const cfgEngineUrl = document.getElementById('cfg-engine-url');
const cfgFalKey = document.getElementById('cfg-fal-key');
const cfgFalStatus = document.getElementById('cfg-fal-status');
const cfgReplicateKey = document.getElementById('cfg-replicate-key');
const cfgReplicateStatus = document.getElementById('cfg-replicate-status');
const btnConfigSave = document.getElementById('btn-config-save');

const creatorLoadingOverlay = document.getElementById('creator-loading-overlay');
const creatorLoadingText = document.getElementById('creator-loading-text');
const creatorLoadingBarFill = document.getElementById('creator-loading-bar-fill');
const creatorLoadingPercent = document.getElementById('creator-loading-percent');

// --- Helper: Loader ---
function showCreatorLoader(text, percent) {
    if (creatorLoadingOverlay && creatorLoadingText && creatorLoadingBarFill && creatorLoadingPercent) {
        creatorLoadingOverlay.classList.remove('hidden');
        creatorLoadingText.textContent = text;
        creatorLoadingBarFill.style.width = `${percent}%`;
        creatorLoadingPercent.textContent = `${percent}%`;
    }
}

function hideCreatorLoader() {
    if (creatorLoadingOverlay) {
        creatorLoadingOverlay.classList.add('hidden');
    }
}

// --- Mode Activation / Deactivation ---
function activateCreatorMode() {
    if (isCreatorModeActive) return;
    isCreatorModeActive = true;

    // Automatically deactivate Extract Mode if active
    if (typeof isExtractModeActive !== 'undefined' && isExtractModeActive) {
        deactivateExtractMode();
    }

    logConsoleSystem(2, 'Creator Mode (Text-to-3D Protocol)');
    logToTerminal('Protocol 2 Initiated: Creator Mode (VPS Gateway Proxy)...', 'info');
    logToTerminal('Creator Mode panel active. Ready to summon 3D assets.', 'info');

    // ── Visual Transformation ──
    creatorSceneOriginalFog = scene.fog ? { color: scene.fog.color.clone(), density: scene.fog.density } : null;
    creatorSceneOriginalBg = scene.background ? scene.background.clone() : null;

    // Shift to fuchsia tint
    scene.background = new THREE.Color(0x0a0108);
    scene.fog = new THREE.FogExp2(0x0a0108, 0.018);

    // Fuchsia point light
    creatorFuchsiaLight = new THREE.PointLight(0xff00ff, 4, 40);
    creatorFuchsiaLight.position.set(0, 5, 0);
    scene.add(creatorFuchsiaLight);

    // Tint grid to fuchsia
    if (gridHelper) {
        gridHelper.material = new THREE.LineBasicMaterial({ color: 0xff00ff, opacity: 0.4, transparent: true });
    }

    // Enable orbit controls
    controls.enabled = true;
    controls.maxPolarAngle = Math.PI;

    // Fade out main UI
    fadeOutMainUI();

    // Show Creator Toolbar
    if (creatorToolbar) {
        creatorToolbar.classList.remove('hidden');
        if (creatorPromptInput) {
            creatorPromptInput.value = '';
            creatorPromptInput.focus();
        }
    }

    // Refresh credentials status display
    fetchConfigStatus();
}

function deactivateCreatorMode() {
    if (!isCreatorModeActive) return;
    isCreatorModeActive = false;

    // Restore scene visuals
    if (creatorSceneOriginalBg) {
        scene.background = creatorSceneOriginalBg;
    } else {
        scene.background = new THREE.Color(0x020204);
    }
    if (creatorSceneOriginalFog) {
        scene.fog = new THREE.FogExp2(creatorSceneOriginalFog.color.getHex(), creatorSceneOriginalFog.density);
    } else {
        scene.fog = new THREE.FogExp2(0x020204, 0.025);
    }

    // Remove fuchsia light
    if (creatorFuchsiaLight) {
        scene.remove(creatorFuchsiaLight);
        creatorFuchsiaLight.dispose();
        creatorFuchsiaLight = null;
    }

    // Restore grid
    if (gridHelper) {
        gridHelper.material = new THREE.LineBasicMaterial({ vertexColors: false });
        gridHelper.geometry.dispose();
        const newGrid = new THREE.GridHelper(120, 60, 0xff00ff, 0x00f3ff);
        newGrid.position.y = -1.5;
        scene.remove(gridHelper);
        scene.add(newGrid);
        gridHelper = newGrid;
    }

    // Hide toolbar and config
    if (creatorToolbar) creatorToolbar.classList.add('hidden');
    if (creatorConfigPanel) creatorConfigPanel.classList.add('hidden');

    // Fade main UI back in
    setTimeout(() => {
        fadeInMainUI();
        logToTerminal('Creator Mode exited. Back to Spatial Command Core.', 'info');
    }, 300);
}

// --- Config Management ---
function fetchConfigStatus() {
    fetch('/api-proxy/api/config')
        .then(res => res.json())
        .then(data => {
            if (cfgEngineUrl) cfgEngineUrl.value = data.local_engine_url || 'http://127.0.0.1:8001';
            
            if (cfgFalStatus) {
                if (data.fal_key_configured) {
                    cfgFalStatus.textContent = `Status: Active (${data.fal_key_masked})`;
                    cfgFalStatus.className = 'text-[8px] text-green-400';
                } else {
                    cfgFalStatus.textContent = 'Status: Not Configured';
                    cfgFalStatus.className = 'text-[8px] text-red-500';
                }
            }
            if (cfgReplicateStatus) {
                if (data.replicate_key_configured) {
                    cfgReplicateStatus.textContent = `Status: Active (${data.replicate_key_masked})`;
                    cfgReplicateStatus.className = 'text-[8px] text-green-400';
                } else {
                    cfgReplicateStatus.textContent = 'Status: Not Configured';
                    cfgReplicateStatus.className = 'text-[8px] text-red-500';
                }
            }
            
            // Log active status to terminal
            let activeGenerators = [];
            if (data.fal_key_configured) activeGenerators.push('Fal.ai');
            if (data.replicate_key_configured) activeGenerators.push('Replicate');
            
            if (activeGenerators.length > 0) {
                logToTerminal(`System: Connected to SD3 via ${activeGenerators.join(' & ')}.`, 'success');
            } else {
                logToTerminal('System warning: No SD3 API credentials configured. Click settings gear.', 'error');
            }
        })
        .catch(err => {
            console.error('Error fetching config status:', err);
            logToTerminal('SYS_ERR: Failed to retrieve gateway configuration.', 'error');
        });
}

function saveConfig() {
    const payload = {
        local_engine_url: cfgEngineUrl ? cfgEngineUrl.value.trim() : null,
        fal_key: cfgFalKey && cfgFalKey.value.trim() ? cfgFalKey.value.trim() : null,
        replicate_key: cfgReplicateKey && cfgReplicateKey.value.trim() ? cfgReplicateKey.value.trim() : null
    };
    
    fetch('/api-proxy/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    })
    .then(data => {
        logToTerminal('Protocol config updated successfully!', 'success');
        if (creatorConfigPanel) creatorConfigPanel.classList.add('hidden');
        if (cfgFalKey) cfgFalKey.value = '';
        if (cfgReplicateKey) cfgReplicateKey.value = '';
        fetchConfigStatus();
    })
    .catch(err => {
        console.error('Error saving config:', err);
        logToTerminal(`SYS_ERR: Config save failed: ${err.message}`, 'error');
    });
}

// --- Summon Pipeline ---
function executePromptSummon() {
    if (!creatorPromptInput) return;
    const prompt = creatorPromptInput.value.trim();
    if (!prompt) {
        logToTerminal('SYS_ERR: Prompt cannot be empty.', 'error');
        return;
    }
    
    logToTerminal(`Summon Protocol initiated: "${prompt}"`, 'info');
    showCreatorLoader('Connecting to Stable Diffusion SD3 generator...', 15);
    
    fetch('/api-proxy/summon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(errData => {
                throw new Error(errData.detail || errData.status || `HTTP ${response.status}`);
            }).catch(e => {
                throw new Error(`HTTP ${response.status}: ${response.statusText || 'Server Error'}`);
            });
        }
        showCreatorLoader('Image generated. Forging 3D geometry locally via TripoSR...', 55);
        logToTerminal('Summon: SD3 image generated. Beginning local TripoSR mesh extraction...');
        return response.arrayBuffer();
    })
    .then(arrayBuffer => {
        showCreatorLoader('Reconstruction complete. Loading 3D spatial mesh...', 85);
        logToTerminal('Summon: Mesh extraction complete. Compiling model...');
        
        const loader = new GLTFLoader();
        loader.parse(arrayBuffer, '', (gltf) => {
            const model = gltf.scene;
            
            // Set scale and position (centered, matching extract flow)
            const forward = new THREE.Vector3();
            camera.getWorldDirection(forward);
            const targetPos = new THREE.Vector3().copy(camera.position).addScaledVector(forward, 5);
            model.position.copy(targetPos);
            
            const box = new THREE.Box3().setFromObject(model);
            const size = new THREE.Vector3();
            box.getSize(size);
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 3.5 / maxDim;
            model.scale.set(scale, scale, scale);
            
            const center = new THREE.Vector3();
            box.getCenter(center);
            model.position.x += (targetPos.x - center.x);
            model.position.y += (targetPos.y - center.y);
            model.position.z += (targetPos.z - center.z);
            
            // Hide existing clouds/splats
            if (loadedPointCloud) loadedPointCloud.visible = false;
            if (viewer && viewer.splatMesh) viewer.splatMesh.visible = false;
            
            // Clear previous extracted GLB
            if (extractedGLB) {
                scene.remove(extractedGLB);
                extractedGLB.traverse(child => {
                    if (child.isMesh) {
                        if (child.geometry) child.geometry.dispose();
                        if (child.material) {
                            if (Array.isArray(child.material)) {
                                child.material.forEach(m => m.dispose());
                            } else {
                                child.material.dispose();
                            }
                        }
                    }
                });
            }
            
            // Inject new mesh
            scene.add(model);
            extractedGLB = model;
            
            // Set lighting and background for viewing
            scene.background = new THREE.Color(0x0c0c0e);
            scene.fog = new THREE.FogExp2(0x0c0c0e, 0.015);
            glbAmbientLight.visible = true;
            glbDirectionalLight.visible = true;
            
            cyanPointLight.visible = false;
            magentaPointLight.visible = false;
            gridHelper.visible = false;
            if (creatorFuchsiaLight) creatorFuchsiaLight.visible = false;
            
            // Update camera/controls
            controls.target.copy(targetPos);
            camera.position.copy(targetPos).add(new THREE.Vector3(0, 1.5, 4));
            controls.update();
            
            // Show Clear 3D button
            const btnClear = document.getElementById('btn-extract-clear');
            if (btnClear) btnClear.classList.remove('hidden');
            
            hideCreatorLoader();
            logToTerminal(`Summon: Model "${prompt}" successfully rendered!`, 'success');
            
            // Deactivate creator toolbar
            deactivateCreatorMode();
        }, (err) => {
            throw new Error(`GLTF parser error: ${err.message}`);
        });
    })
    .catch(err => {
        console.error(err);
        hideCreatorLoader();
        logToTerminal(`SYS_ERR: Summon failed: ${err.message}`, 'error');
    });
}

// --- Event Bindings ---
if (btnCreatorAbort) {
    btnCreatorAbort.addEventListener('click', () => {
        deactivateCreatorMode();
    });
}

if (btnCreatorConfigToggle) {
    btnCreatorConfigToggle.addEventListener('click', () => {
        if (creatorConfigPanel) {
            creatorConfigPanel.classList.toggle('hidden');
            if (!creatorConfigPanel.classList.contains('hidden')) {
                fetchConfigStatus();
            }
        }
    });
}

if (btnConfigClose) {
    btnConfigClose.addEventListener('click', () => {
        if (creatorConfigPanel) creatorConfigPanel.classList.add('hidden');
    });
}

if (btnConfigSave) {
    btnConfigSave.addEventListener('click', () => {
        saveConfig();
    });
}

if (btnCreatorSummon) {
    btnCreatorSummon.addEventListener('click', () => {
        executePromptSummon();
    });
}

if (creatorPromptInput) {
    creatorPromptInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            executePromptSummon();
        }
    });
}


