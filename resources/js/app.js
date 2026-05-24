import './bootstrap';
// --- VECTRA_NEURAL_CORE_CACHE_BUSTER_V104 ---
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';

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

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 3, 10);

const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: false,
    preserveDrawingBuffer: true  // Required for toDataURL() screenshot capture
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

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

// --- Custom Cyberpunk Grid and Wireframe Corridor ---
// Horizontal grid at the bottom
const gridHelper = new THREE.GridHelper(120, 60, 0xff00ff, 0x00f3ff);
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

    // Render Scene
    renderer.render(scene, camera);

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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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
function prepareSceneForModel() {
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

    // Retarget controls camera view to the center
    controls.target.set(0, 1.0, 0);
    camera.position.set(0, 3, 10);
    controls.update();

    const nodesCount = geometry.attributes.position.count;
    console.log(`%c[VECTRA] Map complete: ${nodesCount.toLocaleString()} spatial nodes loaded from ${fileName}.`, 'color: #39ff14');
    logToTerminal(`Neural stream mapped: ${nodesCount.toLocaleString()} nodes parsed successfully.`, 'success');
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
    loadingBarFill.style.width = '20%';
    loadingPercent.textContent = 'Streaming...';
    loadingText.textContent = 'Connecting to neural file-stream (6.9 MB)...';

    prepareSceneForModel();

    try {
        logToTerminal('Opening compressed stream: /files/point_cloud_optimized.ply.gz...');

        // Fetch compressed file directly
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP network error ${response.status}`);
        }

        loadingBarFill.style.width = '60%';
        loadingText.textContent = 'Decompressing spatial matrix (GZIP)...';

        // Read the response as ArrayBuffer in one go
        const compressedBuffer = await response.arrayBuffer();

        // Decompress using native DecompressionStream API
        const ds = new DecompressionStream('gzip');
        const decompressedStream = new Response(compressedBuffer).body.pipeThrough(ds);
        const decompressedResponse = new Response(decompressedStream);
        const arrayBuffer = await decompressedResponse.arrayBuffer();

        loadingBarFill.style.width = '90%';
        loadingText.textContent = 'Reconstructing 3D spatial points...';
        
        // Asynchronous delay to let DOM elements redraw
        await new Promise(resolve => setTimeout(resolve, 50));

        const loader = new PLYLoader();
        const geometry = loader.parse(arrayBuffer);

        displayLoadedGeometry(geometry, 'point_cloud_optimized.ply.gz');
        isModelLoading = false;

    } catch (error) {
        isModelLoading = false;
        console.error('[LOAD_ERR]', error);
        
        // Revert UI on error
        loadingOverlay.classList.add('hidden');
        bentoGrid.classList.remove('hidden');
        
        logToTerminal(`SYS_ERR: Failed to load spatial data matrix: ${error.message}`, 'error');
        
        // Restore hallway view
        hallwayGroup.visible = true;
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
    loadingPercent.textContent = 'Reading...';
    loadingText.textContent = `Reading local file: ${name} (${sizeMB} MB)...`;

    prepareSceneForModel();

    try {
        // Read file using modern Promise-based Blob.arrayBuffer()
        // This is extremely fast (virtually instantaneous for local files) and avoids FileReader callback issues.
        const arrayBuffer = await file.arrayBuffer();

        loadingBarFill.style.width = '50%';
        loadingPercent.textContent = 'Processing...';

        let decompressedBuffer = arrayBuffer;
        if (name.toLowerCase().endsWith('.gz')) {
            loadingText.textContent = 'Decompressing local spatial matrix (GZIP)...';
            const ds = new DecompressionStream('gzip');
            const decompressedStream = new Response(arrayBuffer).body.pipeThrough(ds);
            const decompressedResponse = new Response(decompressedStream);
            decompressedBuffer = await decompressedResponse.arrayBuffer();
        }

        loadingBarFill.style.width = '85%';
        loadingText.textContent = 'Reconstructing 3D spatial points...';
        
        // Brief timeout to let the UI update and draw the progress bar
        await new Promise(resolve => setTimeout(resolve, 50));

        const loader = new PLYLoader();
        const geometry = loader.parse(decompressedBuffer);

        displayLoadedGeometry(geometry, name);
        isModelLoading = false;

    } catch (error) {
        isModelLoading = false;
        console.error('[LOCAL_LOAD_ERR]', error);
        
        // Revert UI on error
        loadingOverlay.classList.add('hidden');
        bentoGrid.classList.remove('hidden');
        
        logToTerminal(`SYS_ERR: Failed to parse local file: ${error.message}`, 'error');
        
        // Restore hallway view
        hallwayGroup.visible = true;
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
    if (!loadedModel || isModelLoading || !isSelectModeActive) return;
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
    btnBackMenu.addEventListener('click', () => {
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
if (btnToggleSplatting) {
    btnToggleSplatting.addEventListener('click', () => {
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
        logConsoleSystem(2, 'Creator Mode');
        logToTerminal('Protocol 2 Initiated: Creator Mode...', 'info');
        logToTerminal('Text-to-3D neural network initialized.', 'success');
        logToTerminal('SYS_STATUS: Awaiting latent diffusion prompt input...', 'info');
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
                    logToTerminal(' - clear   : Flush neural terminal console buffer', 'info');
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
const extractModeStatus = document.getElementById('extract-mode-status');
const selectionCanvas   = document.getElementById('selection-canvas');
const extractHud        = document.getElementById('extract-hud');
const extractHudCoords  = document.getElementById('extract-hud-coords');
const extractHudFps     = document.getElementById('extract-hud-fps');

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

    // Restore orbit controls
    controls.enabled = true;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;

    // Clear and disable the selection canvas overlay
    disableSelectionCanvas();

    // Hide the Extract HUD
    if (extractHud) extractHud.classList.add('hidden');

    // Slide toolbar out
    hideExtractToolbar();

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

    // Semi-transparent fill
    selCtx.fillStyle = SEL_FILL_COLOR;
    selCtx.fillRect(x, y, w, h);

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

    // Corner handles — 4 small squares at each corner
    selCtx.shadowBlur  = 12;
    selCtx.fillStyle   = SEL_STROKE_COLOR;
    const c = SEL_CORNER_SIZE;
    const corners = [
        [x - c / 2, y - c / 2],
        [x + w - c / 2, y - c / 2],
        [x - c / 2, y + h - c / 2],
        [x + w - c / 2, y + h - c / 2],
    ];
    corners.forEach(([cx, cy]) => selCtx.fillRect(cx, cy, c, c));

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

        // Ignore trivially small (accidental click) boxes
        if (w < 8 || h < 8) {
            if (selCtx) selCtx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);
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

        // ── DBSE Hook: placeholder for Gaussian splat filtering ────────────
        hideSplatsInSelection(boundingBox);
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
function captureSelectionSnapshot(bb) {
    try {
        // Three.js preserveDrawingBuffer is not set, so we must render a fresh
        // frame immediately before reading pixels.
        renderer.render(scene, camera);

        // Clamp crop to canvas bounds (prevent out-of-bounds reads)
        const srcCanvas = renderer.domElement;
        const dpr       = window.devicePixelRatio || 1;

        // Convert CSS pixels → physical canvas pixels
        const px = Math.round(bb.x * dpr);
        const py = Math.round(bb.y * dpr);
        const pw = Math.round(bb.w * dpr);
        const ph = Math.round(bb.h * dpr);

        const clampedX = Math.max(0, Math.min(px, srcCanvas.width  - 1));
        const clampedY = Math.max(0, Math.min(py, srcCanvas.height - 1));
        const clampedW = Math.min(pw, srcCanvas.width  - clampedX);
        const clampedH = Math.min(ph, srcCanvas.height - clampedY);

        if (clampedW <= 0 || clampedH <= 0) {
            console.warn('[SYSTEM] Snapshot: selection is outside the canvas bounds.');
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

        // Trigger a browser download of the snapshot
        const link = document.createElement('a');
        link.download = `vectra_extract_${Date.now()}.png`;
        link.href = dataURL;
        link.click();

        console.log(
            '%c [SYSTEM] Snapshot captured and downloaded. ',
            'color: #39ff14; font-weight: bold; background: #050f08; padding: 4px 10px; border-left: 3px solid #39ff14;'
        );
        logToTerminal(`Snapshot captured: ${Math.round(bb.w)}×${Math.round(bb.h)}px region exported.`, 'success');

        return dataURL;

    } catch (err) {
        // Surface a generic message; detailed error only in dev console
        console.error('[SYSTEM_ERR] Snapshot failed:', err.message);
        logToTerminal('SYS_ERR: Snapshot capture failed. Check console.', 'error');
        return null;
    }
}

// ══════════════════════════════════════════════════════════════════════════════
//  DBSE — Deep Splat Excavation (Screen-Space Projection Engine)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * hideSplatsInSelection  — DBSE Protocol
 *
 * Projects every 3D point in the loaded geometry through the camera's
 * projection matrix to find which points fall inside the drawn 2D bounding box.
 * Matching points have their colour set to fully transparent green (excavated).
 * A final statistics readout is logged to the terminal.
 *
 * @param {{ x: number, y: number, w: number, h: number }} boundingBox
 */
function hideSplatsInSelection(boundingBox) {
    const { x: bx, y: by, w: bw, h: bh } = boundingBox;

    console.log(
        `%c [DBSE] Excavation initiated → screen-box { x:${Math.round(bx)}, y:${Math.round(by)}, w:${Math.round(bw)}, h:${Math.round(bh)} } `,
        'color: #ff00ff; font-weight: bold; background: #0a050a; padding: 4px 10px; border-left: 3px solid #ff00ff;'
    );

    if (!loadedModel) {
        logToTerminal('DBSE: No spatial model loaded. Drop a .ply file first.', 'error');
        return;
    }

    if (!loadedModel.isPoints) {
        // For mesh geometry, use a different approach
        logToTerminal('DBSE: Mesh geometry detected. Point-cloud mode required for excavation.', 'error');
        return;
    }

    const geometry  = loadedModel.geometry;
    const positions = geometry.attributes.position;
    const colors    = geometry.attributes.color;

    if (!positions) {
        logToTerminal('DBSE: No position buffer found in geometry.', 'error');
        return;
    }

    // Ensure we have a colour attribute to manipulate (create one if needed)
    let colorAttr = colors;
    if (!colorAttr) {
        const colData = new Float32Array(positions.count * 3).fill(1.0);
        colorAttr = new THREE.BufferAttribute(colData, 3);
        geometry.setAttribute('color', colorAttr);
        loadedModel.material.vertexColors = true;
        loadedModel.material.needsUpdate = true;
    }

    // ── Screen-space projection matrix ────────────────────────────────────
    const projMatrix = new THREE.Matrix4().multiplyMatrices(
        camera.projectionMatrix,
        camera.matrixWorldInverse
    );
    const ndcToScreen_w = window.innerWidth  / 2;
    const ndcToScreen_h = window.innerHeight / 2;

    const tmpVec = new THREE.Vector3();
    const modelMatrix = loadedModel.matrixWorld;

    let hiddenCount = 0;
    const total = positions.count;

    // ── Iterate all points and project to screen ───────────────────────────
    for (let i = 0; i < total; i++) {
        tmpVec.fromBufferAttribute(positions, i);

        // World space
        tmpVec.applyMatrix4(modelMatrix);

        // Clip space (NDC)
        tmpVec.applyMatrix4(projMatrix);

        // Behind camera — skip
        if (tmpVec.z > 1.0 || tmpVec.z < -1.0) continue;

        // Convert NDC [-1,1] to screen pixels
        const sx = ( tmpVec.x + 1) * ndcToScreen_w;
        const sy = (-tmpVec.y + 1) * ndcToScreen_h;

        // Test if inside bounding box
        if (sx >= bx && sx <= bx + bw && sy >= by && sy <= by + bh) {
            // Mark this point: set colour to dim green then hide via opacity
            colorAttr.setXYZ(i, 0.0, 1.0, 0.08); // Briefly flash green
            hiddenCount++;
        }
    }

    // Commit colour changes to GPU
    colorAttr.needsUpdate = true;

    // After a brief green flash, set excavated points to black (hidden)
    setTimeout(() => {
        for (let i = 0; i < total; i++) {
            tmpVec.fromBufferAttribute(positions, i);
            tmpVec.applyMatrix4(modelMatrix);
            tmpVec.applyMatrix4(projMatrix);
            if (tmpVec.z > 1.0 || tmpVec.z < -1.0) continue;
            const sx = ( tmpVec.x + 1) * ndcToScreen_w;
            const sy = (-tmpVec.y + 1) * ndcToScreen_h;
            if (sx >= bx && sx <= bx + bw && sy >= by && sy <= by + bh) {
                colorAttr.setXYZ(i, 0.0, 0.0, 0.0);
            }
        }
        colorAttr.needsUpdate = true;
    }, 350);

    const pct = total > 0 ? ((hiddenCount / total) * 100).toFixed(1) : '0.0';

    logToTerminal(`DBSE: Excavation complete — ${hiddenCount.toLocaleString()} / ${total.toLocaleString()} nodes (${pct}%) extracted.`, 'success');
    setExtractStatus(`EXCAVATED ${hiddenCount.toLocaleString()} NODES (${pct}%)`);

    console.log(
        `%c [DBSE] Complete: ${hiddenCount} of ${total} points (${pct}%) within selection box. `,
        'color: #39ff14; font-weight: bold; background: #050f08; padding: 4px 10px; border-left: 3px solid #39ff14;'
    );
}
