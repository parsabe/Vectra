import './bootstrap';
// --- VECTRA_NEURAL_CORE_CACHE_BUSTER_V105 ---
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d';

// --- System Telemetry DOM Elements ---
window.VECTRA_VERSION = "1.1.0-NEURAL-CB-110";
const telemetryRotX = document.getElementById('telemetry-rot-x');
const telemetryRotY = document.getElementById('telemetry-rot-y');
const terminalOutput = document.getElementById('terminal-output');
const terminalInput = document.getElementById('terminal-input');
const btnCreator = document.getElementById('btn-creator-mode');

// --- Extract Mode DOM Elements ---
const btnExtractMode = document.getElementById('btn-extract-mode');
const extractToolbar = document.getElementById('extract-toolbar');
const btnExtractAbort = document.getElementById('btn-extract-abort');
const btnExtractOrbit = document.getElementById('btn-extract-orbit');
const btnExtractSelect = document.getElementById('btn-extract-select');
const selectionCanvas = document.getElementById('selection-canvas');

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
    alpha: false
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

// --- Splat Viewer & First-Person Controls State ---
let viewer = null;
const LoaderStatus = {
    Downloading: 0,
    Processing: 1,
    Done: 2
};
let pendingSplatDisplay = null; // { fileName } — set after load, cleared once splatRenderReady
let isFlightControlsActive = true;
const keys = { w: false, a: false, s: false, d: false, q: false, e: false };
let isMouseDown = false;
let previousMousePosition = { x: 0, y: 0 };
let yaw = 0;
let pitch = 0;
let lastFrameTime = performance.now();

// --- First-Person Keyboard Event Listeners ---
window.addEventListener('keydown', (e) => {
    if (document.activeElement === terminalInput) return;
    const key = e.key.toLowerCase();
    if (key in keys) {
        keys[key] = true;
    }
});

window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (key in keys) {
        keys[key] = false;
    }
});

// --- Mouse look-around events for WebGL Canvas ---
canvas.addEventListener('mousedown', (e) => {
    if (!viewer || !viewer.initialized || !viewer.splatRenderReady) return;
    if (isSelectModeActive || isSelectionDrawingMode) return;
    isMouseDown = true;
    previousMousePosition = { x: e.clientX, y: e.clientY };
});

window.addEventListener('mousemove', (e) => {
    if (!isMouseDown) return;
    const deltaX = e.clientX - previousMousePosition.x;
    const deltaY = e.clientY - previousMousePosition.y;

    const sensitivity = 0.002;
    yaw -= deltaX * sensitivity;
    pitch -= deltaY * sensitivity;

    // Lock pitch to -85 and +85 degrees to avoid camera flip
    const maxPitch = Math.PI / 2 - 0.05;
    pitch = Math.max(-maxPitch, Math.min(maxPitch, pitch));

    camera.rotation.x = pitch;
    camera.rotation.y = yaw;

    previousMousePosition = { x: e.clientX, y: e.clientY };
});

window.addEventListener('mouseup', () => {
    isMouseDown = false;
});

// --- Orbit Controls ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2 - 0.05; // Lock camera from going below floor level
controls.minDistance = 1;
controls.maxDistance = 50;
controls.target.set(0, 0.5, 0);

function updateFlyControls(delta) {
    const speedPerSecond = 8.0; // 8 units per second
    const moveSpeed = speedPerSecond * delta;
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);

    forward.normalize();
    right.normalize();

    if (keys.w) camera.position.addScaledVector(forward, moveSpeed);
    if (keys.s) camera.position.addScaledVector(forward, -moveSpeed);
    if (keys.a) camera.position.addScaledVector(right, -moveSpeed);
    if (keys.d) camera.position.addScaledVector(right, moveSpeed);
    if (keys.q) camera.position.y -= moveSpeed; // Descend
    if (keys.e) camera.position.y += moveSpeed; // Ascend
}

// --- Animation Loop ---
let clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const elapsedTime = clock.getElapsedTime();
    const now = performance.now();
    let delta = (now - lastFrameTime) / 1000;
    lastFrameTime = now;
    if (delta > 0.1) delta = 0.1;

    // Animate point lights moving back and forth in the corridor
    cyanPointLight.position.z = Math.sin(elapsedTime * 0.7) * 20;
    cyanPointLight.position.x = -3 + Math.sin(elapsedTime * 1.2) * 1.5;

    magentaPointLight.position.z = -Math.sin(elapsedTime * 0.7) * 20;
    magentaPointLight.position.x = 3 + Math.cos(elapsedTime * 1.2) * 1.5;

    // Slow rotation to make the loaded model feel active
    if (viewer && viewer.initialized && viewer.splatRenderReady) {
        // Splat mesh is active, do not rotate automatically to avoid flight disorientation
    } else if (loadedModel) {
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

    if (viewer && viewer.initialized && viewer.splatRenderReady) {
        // First frame that splatRenderReady becomes true — trigger UI reveal
        if (pendingSplatDisplay) {
            const { fileName, objectURL: blobURL } = pendingSplatDisplay;
            pendingSplatDisplay = null;
            displayLoadedSplatViewer(fileName);
            // Safe to revoke blob URL now: sort worker has completed its first pass
            if (blobURL) URL.revokeObjectURL(blobURL);
        }
        if (isFlightControlsActive && !isSelectModeActive && !isSelectionDrawingMode) {
            updateFlyControls(delta);
        }
        viewer.update();
        viewer.render();
    } else {
        controls.update();
        renderer.render(scene, camera);
    }

    // Update telemetry in UI (only when main menu bento grid is visible)
    if (telemetryRotX && telemetryRotY && !bentoGrid.classList.contains('hidden')) {
        const activeCamera = camera;
        telemetryRotX.textContent = activeCamera.rotation.x.toFixed(2);
        telemetryRotY.textContent = activeCamera.rotation.y.toFixed(2);
    }
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

    // Disable OrbitControls, align first-person controls starting state
    controls.enabled = false;
    isFlightControlsActive = true;
    yaw = camera.rotation.y;
    pitch = camera.rotation.x;
    isMouseDown = false;

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

    try {
        logToTerminal(`Opening compressed stream: ${url}...`);

        // Initialize GaussianSplats3D.Viewer
        viewer = new GaussianSplats3D.Viewer({
            'selfDrivenMode': false,
            'useBuiltInControls': false,
            'renderer': renderer,
            'threeScene': scene,
            'camera': camera,
            'gpuAcceleratedSort': true,
            'enableOptionalEffects': true,
            'sharedMemoryForWorkers': false,
            'showLoadingUI': false
        });

        camera.rotation.order = 'YXZ';

        // Load splat scene with smart two-phase progress mapping:
        // Downloading phase → 0–49%, Processing phase → 50–99%
        // NOTE: We do NOT finalize the UI here — splatRenderReady is set async by the sort
        // worker after addSplatScene resolves. The animate() loop detects it and calls
        // displayLoadedSplatViewer on the first rendered frame.
        await viewer.addSplatScene(url, {
            'splatAlphaRemovalThreshold': 5,
            'onProgress': (percentComplete, percentCompleteLabel, loaderStatus) => {
                let mappedPercent;
                if (loaderStatus === LoaderStatus.Downloading) {
                    mappedPercent = Math.round(percentComplete * 0.49);
                    loadingText.textContent = `Streaming neural matrix (${percentCompleteLabel || Math.round(percentComplete) + '%'} downloaded)...`;
                } else if (loaderStatus === LoaderStatus.Processing) {
                    mappedPercent = 50 + Math.round(percentComplete * 0.49);
                    loadingText.textContent = `Reconstructing 3D spatial matrix (${Math.round(percentComplete)}% built)...`;
                } else if (loaderStatus === LoaderStatus.Done) {
                    // Show 99% — the animate loop will snap to 100% on first rendered frame
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

        // addSplatScene resolved — data is built but the GPU sort worker hasn't run yet.
        // Set a pending flag; the animate loop will call displayLoadedSplatViewer once ready.
        isModelLoading = false;
        loadingText.textContent = 'Initialising render pipeline...';
        pendingSplatDisplay = { fileName: url };

    } catch (error) {
        isModelLoading = false;
        console.error('[LOAD_ERR]', error);

        // Revert UI on error
        loadingOverlay.classList.add('hidden');
        bentoGrid.classList.remove('hidden');

        logToTerminal(`SYS_ERR: Failed to load spatial data matrix: ${error.message}`, 'error');

        // Restore hallway view
        hallwayGroup.visible = true;

        if (viewer) {
            await viewer.dispose();
            viewer = null;
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
        let fileBlob = file;

        // If file is compressed GZIP, decompress in browser memory
        if (name.toLowerCase().endsWith('.gz')) {
            loadingText.textContent = 'Decompressing local spatial matrix (GZIP)...';
            const arrayBuffer = await file.arrayBuffer();
            const ds = new DecompressionStream('gzip');
            const decompressedStream = new Response(arrayBuffer).body.pipeThrough(ds);
            const decompressedResponse = new Response(decompressedStream);
            const decompressedBuffer = await decompressedResponse.arrayBuffer();
            fileBlob = new Blob([decompressedBuffer], { type: 'application/octet-stream' });
        }

        objectURL = URL.createObjectURL(fileBlob);

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
            'gpuAcceleratedSort': true,
            'enableOptionalEffects': true,
            'sharedMemoryForWorkers': false,
            'showLoadingUI': false
        });

        camera.rotation.order = 'YXZ';

        // Load local splat scene with smart two-phase progress mapping:
        // Downloading phase (reading blob) → 0–49%, Processing → 50–99%
        // NOTE: We do NOT finalize the UI here — splatRenderReady is set async by the sort
        // worker after addSplatScene resolves. The animate() loop detects it and calls
        // displayLoadedSplatViewer on the first rendered frame.
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
                    // Show 99% — the animate loop will snap to 100% on first rendered frame
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

        // addSplatScene resolved — data is built but the GPU sort worker hasn't run yet.
        // Set a pending flag; the animate loop will call displayLoadedSplatViewer once ready.
        // Keep objectURL alive until then — revoked inside displayLoadedSplatViewer.
        isModelLoading = false;
        loadingText.textContent = 'Initialising render pipeline...';
        pendingSplatDisplay = { fileName: name, objectURL };
        objectURL = null; // prevent finally block from revoking it prematurely

    } catch (error) {
        isModelLoading = false;
        console.error('[LOCAL_LOAD_ERR]', error);

        // Revert UI on error
        loadingOverlay.classList.add('hidden');
        bentoGrid.classList.remove('hidden');

        logToTerminal(`SYS_ERR: Failed to parse local file: ${error.message}`, 'error');

        // Restore hallway view
        hallwayGroup.visible = true;

        if (viewer) {
            await viewer.dispose();
            viewer = null;
        }
    } finally {
        // Only revoke if not transferred to pendingSplatDisplay (error path)
        if (objectURL) {
            URL.revokeObjectURL(objectURL);
        }
    }
}

// --- Splat Index Extraction & Visibility Modification Functions ---
function findSplatIndicesInBox(x, y, w, h) {
    if (!viewer || !viewer.splatMesh) return [];

    const splatMesh = viewer.splatMesh;
    const splatCount = splatMesh.getSplatCount(true);
    const baseData = splatMesh.splatDataTextures.baseData;
    if (!baseData || !baseData.centers) return [];

    const centers = baseData.centers;
    const selectedIndices = [];

    const width = window.innerWidth;
    const height = window.innerHeight;

    const xMin = x;
    const xMax = x + w;
    const yMin = y;
    const yMax = y + h;

    // Project points from 3D world space to 2D NDC and filter by selection bounding box
    const modelViewProjectionMatrix = new THREE.Matrix4();
    modelViewProjectionMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    modelViewProjectionMatrix.multiply(splatMesh.matrixWorld);

    const e = modelViewProjectionMatrix.elements;

    for (let i = 0; i < splatCount; i++) {
        const cx = centers[i * 3];
        const cy = centers[i * 3 + 1];
        const cz = centers[i * 3 + 2];

        // Pre-multiplied projection elements for high-performance iteration without GC churn
        const w_coord = e[3] * cx + e[7] * cy + e[11] * cz + e[15];
        if (w_coord <= 0) continue;

        const px = (e[0] * cx + e[4] * cy + e[8] * cz + e[12]) / w_coord;
        const py = (e[1] * cx + e[5] * cy + e[9] * cz + e[13]) / w_coord;
        const pz = (e[2] * cx + e[6] * cy + e[10] * cz + e[14]) / w_coord;

        if (pz < -1 || pz > 1) continue;

        const screenX = ((px + 1) * width) / 2;
        const screenY = ((-py + 1) * height) / 2;

        if (screenX >= xMin && screenX <= xMax && screenY >= yMin && screenY <= yMax) {
            selectedIndices.push(i);
        }
    }

    return selectedIndices;
}

function updateSplatAlphas(selectedIndices, alphaValue) {
    if (!viewer || !viewer.splatMesh) return;
    const splatMesh = viewer.splatMesh;
    const baseData = splatMesh.splatDataTextures.baseData;
    if (!baseData || !baseData.colors) return;

    const colors = baseData.colors;
    const val = alphaValue <= 1.0 ? Math.round(alphaValue * 255) : Math.round(alphaValue);
    for (let i = 0; i < selectedIndices.length; i++) {
        const idx = selectedIndices[i];
        colors[idx * 4 + 3] = val; // Set the A channel
    }

    const splatCount = splatMesh.getSplatCount(true);
    // Push updated CPU color buffer arrays into GPU texture buffers
    splatMesh.updateDataTexturesFromBaseData(0, splatCount - 1);
    viewer.forceRenderNextFrame();
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
    if (isModelLoading || !isSelectModeActive) return;
    if (event.target !== canvas) return;

    if (viewer && viewer.initialized && viewer.splatRenderReady) {
        const outHits = [];
        const renderDimensions = new THREE.Vector2();
        renderer.getSize(renderDimensions);
        const screenPosition = { x: event.clientX, y: event.clientY };

        viewer.raycaster.setFromCameraAndScreenPosition(camera, screenPosition, renderDimensions);
        viewer.raycaster.intersectSplatMesh(viewer.splatMesh, outHits);

        if (outHits.length > 0) {
            const hit = outHits[0];
            const point = hit.origin; // World-space point
            const splatIndex = hit.splatIndex;

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
                `%c [VECTRA COORDINATE LOCK] Splat: ${splatIndex} | X: ${point.x.toFixed(4)} | Y: ${point.y.toFixed(4)} | Z: ${point.z.toFixed(4)} `,
                'color: #ff00ff; font-weight: bold; background: #05080f; padding: 4px; border-left: 3px solid #ff00ff;'
            );

            // Dissolve the selected splat node
            updateSplatAlphas([splatIndex], 0);
            logToTerminal(`Splat node #${splatIndex} isolated and dissolved.`, 'success');
        }
    } else if (loadedModel) {
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

        // Restore OrbitControls
        controls.enabled = true;
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
        if (selectionCanvas) {
            selectionCanvas.classList.add('hidden');
            selectionCanvas.classList.add('pointer-events-none');
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

            // Enable selection canvas drawing overlay
            if (selectionCanvas) {
                selectionCanvas.classList.remove('pointer-events-none');
                selectionCanvas.classList.remove('hidden');
            }
            controls.enabled = false;
            isMouseDown = false;

            console.log('%c[VECTRA] Selection Mode Active. Click points or draw box to select.', 'color: #ff00ff');
        } else {
            btnToggleSelect.textContent = '[Select Objects: OFF]';
            btnToggleSelect.classList.remove('btn-cyber-magenta');
            btnToggleSelect.classList.add('btn-cyber-cyan');

            // Hide selection canvas drawing overlay
            if (selectionCanvas) {
                selectionCanvas.classList.add('hidden');
                selectionCanvas.classList.add('pointer-events-none');
            }
            if (!viewer) {
                controls.enabled = true;
            }

            console.log('%c[VECTRA] Selection Mode Deactivated.', 'color: #00f3ff');
        }
    });
}

// 3. 3D Splatting rendering adjustments
if (btnToggleSplatting) {
    btnToggleSplatting.addEventListener('click', () => {
        if (viewer && viewer.initialized && viewer.splatRenderReady) {
            const splatMesh = viewer.splatMesh;
            const currentMode = splatMesh.getPointCloudModeEnabled();
            const nextMode = !currentMode;
            splatMesh.setPointCloudModeEnabled(nextMode);
            btnToggleSplatting.textContent = `[3D Splatting: Mode ${nextMode ? 'POINT CLOUD' : 'DENSE SPLAT'}]`;
            console.log(`[VECTRA] Splat rendering mode set to: ${nextMode ? 'Point Cloud' : 'Dense Splat'}`);
            logToTerminal(`Splat rendering mode set to: ${nextMode ? 'Point Cloud' : 'Dense Splat'}`, 'info');
            viewer.forceRenderNextFrame();
        } else if (loadedModel) {
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
        }
    });
}

// --- Extract Mode State and Interaction Logic ---
let isExtractMode = false;
let isSelectionDrawingMode = false;
let isDrawing = false;
let startX = 0;
let startY = 0;

// Setup Selection Canvas size on resize
function resizeSelectionCanvas() {
    if (selectionCanvas) {
        selectionCanvas.width = window.innerWidth;
        selectionCanvas.height = window.innerHeight;
    }
}
window.addEventListener('resize', resizeSelectionCanvas);
resizeSelectionCanvas();

// Helper to update Extract Toolbar button active styles
function updateExtractToolbarUI() {
    if (!btnExtractOrbit || !btnExtractSelect || !selectionCanvas) return;

    if (isSelectionDrawingMode) {
        btnExtractSelect.classList.add('btn-active-cyber');
        btnExtractOrbit.classList.remove('btn-active-cyber');

        selectionCanvas.classList.remove('pointer-events-none');
        selectionCanvas.classList.remove('hidden');
    } else {
        btnExtractOrbit.classList.add('btn-active-cyber');
        btnExtractSelect.classList.remove('btn-active-cyber');

        selectionCanvas.classList.add('pointer-events-none');

        // Clear canvas context on leaving draw mode
        const ctx = selectionCanvas.getContext('2d');
        ctx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);
    }
}

// Bounding Box Drawing & Event Listeners
if (selectionCanvas) {
    const ctx = selectionCanvas.getContext('2d');

    selectionCanvas.addEventListener('pointerdown', (e) => {
        if (!isExtractMode || !isSelectionDrawingMode) return;
        isDrawing = true;
        startX = e.clientX;
        startY = e.clientY;
    });

    selectionCanvas.addEventListener('pointermove', (e) => {
        if (!isDrawing) return;

        const currentX = e.clientX;
        const currentY = e.clientY;

        // Clear canvas for redraw
        ctx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);

        // Draw glowing bounding box
        ctx.strokeStyle = '#00f3ff';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = 10;

        ctx.strokeRect(startX, startY, currentX - startX, currentY - startY);

        // Draw matching transparent inner fill
        ctx.fillStyle = 'rgba(0, 243, 255, 0.1)';
        ctx.fillRect(startX, startY, currentX - startX, currentY - startY);
    });

    const endDrawing = (e) => {
        if (!isDrawing) return;
        isDrawing = false;

        const currentX = e.clientX;
        const currentY = e.clientY;

        // Clear box drawing overlay
        ctx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);
        ctx.shadowBlur = 0; // reset shadow glow

        // Calculate box dimensions
        const x = Math.min(startX, currentX);
        const y = Math.min(startY, currentY);
        const w = Math.abs(currentX - startX);
        const h = Math.abs(currentY - startY);

        // Check for meaningful drag size (e.g. > 10px) to ignore simple clicks
        if (w > 10 && h > 10) {
            console.log(`[SYSTEM] Target Area Locked: {x: ${x}, y: ${y}, w: ${w}, h: ${h}}`);
            logToTerminal(`Target Area Locked: x=${x}, y=${y}, w=${w}, h=${h}`, 'success');

            // Take 3D Canvas crop snapshot
            captureSelectedArea(x, y, w, h);

            // If viewer is active, find indices inside box and hide them!
            if (viewer && viewer.initialized && viewer.splatRenderReady) {
                const indices = findSplatIndicesInBox(x, y, w, h);
                if (indices.length > 0) {
                    logToTerminal(`Isolating ${indices.length.toLocaleString()} splat nodes within volume...`, 'info');
                    updateSplatAlphas(indices, 0); // Hide splats (opacity = 0)
                    logToTerminal(`Excavation complete. ${indices.length.toLocaleString()} nodes dissolved.`, 'success');
                } else {
                    logToTerminal(`No splats detected within volume.`, 'info');
                }
            } else {
                // Trigger mock DBSE splat hide function
                hideSplatsInSelection({ x, y, width: w, height: h });
            }
        }
    };

    selectionCanvas.addEventListener('pointerup', endDrawing);
    selectionCanvas.addEventListener('pointerleave', endDrawing);
}

// 3D Canvas Crop Snapshot Capture Function
function captureSelectedArea(x, y, w, h) {
    try {
        logToTerminal(`Deep Splat Excavation (DBSE) triggered. Capturing snapshot...`, 'info');

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = w;
        tempCanvas.height = h;
        const tempCtx = tempCanvas.getContext('2d');

        // Render Three.js immediately before copying to fill the WebGL drawing buffer
        renderer.render(scene, camera);

        // Draw the 3D WebGL canvas into the temporary 2D canvas (accounting for high-DPI scaling)
        const scale = window.devicePixelRatio || 1;
        tempCtx.drawImage(
            canvas,
            x * scale,
            y * scale,
            w * scale,
            h * scale,
            0,
            0,
            w,
            h
        );

        const dataUrl = tempCanvas.toDataURL('image/png');
        console.log(`%c[SYSTEM] Snapshot captured:`, 'color: #39ff14', dataUrl);

        const previewMsg = `[SYSTEM] Target Snapshot Extracted.`;
        logToTerminal(`${previewMsg}`, 'success');

        // Create a cool floating micro-preview in the terminal log
        const img = new Image();
        img.src = dataUrl;
        img.style.border = '1px solid #00f3ff';
        img.style.boxShadow = '0 0 10px rgba(0, 243, 255, 0.5)';
        img.style.maxWidth = '150px';
        img.style.marginTop = '6px';
        img.style.borderRadius = '4px';

        const line = document.createElement('div');
        line.className = 'text-glow-green text-green-400 mt-1 flex flex-col gap-1';
        line.textContent = `> SNAPSHOT PREVIEW:`;
        line.appendChild(img);

        if (terminalOutput) {
            terminalOutput.appendChild(line);
            terminalOutput.scrollTop = terminalOutput.scrollHeight;
        }

    } catch (err) {
        console.error('[SNAPSHOT_ERR]', err);
        logToTerminal(`SYS_ERR: Failed to capture target snapshot: ${err.message}`, 'error');
    }
}

// Mock DBSE Hook
function hideSplatsInSelection(boundingBox) {
    console.log(`[SYSTEM] hideSplatsInSelection called with bounding box:`, boundingBox);
    logToTerminal(`DBSE Hook: Recalculating frustum volume. Splats within coordinates isolated.`, 'info');
}

// --- Main Menu Buttons binding ---
if (btnExtractMode) {
    btnExtractMode.addEventListener('click', () => {
        logConsoleSystem(1, 'Extract Mode');
        logToTerminal('Protocol 1 Initiated: Extract Mode (Image-to-3D)...', 'info');

        isExtractMode = true;
        isSelectionDrawingMode = false; // Start in orbit controls mode by default

        // Fade out bento grid UI
        bentoGrid.classList.add('fade-out');

        // Fade in minimal extract toolbar
        if (extractToolbar) {
            extractToolbar.classList.remove('hidden');
            setTimeout(() => {
                extractToolbar.classList.add('fade-in');
                extractToolbar.classList.remove('opacity-0');
            }, 50);
        }

        // Initialize orbit/drawing modes
        controls.enabled = true;
        updateExtractToolbarUI();

        // Clear any previous markers
        clearThreeGroup(markersGroup);
    });
}

if (btnExtractAbort) {
    btnExtractAbort.addEventListener('click', () => {
        logToTerminal('Aborting Extract Mode. Restoring core link...', 'info');

        isExtractMode = false;
        isSelectionDrawingMode = false;
        isDrawing = false;

        // Reset camera positions & controls
        if (viewer && viewer.initialized && viewer.splatRenderReady) {
            controls.enabled = false;
            isFlightControlsActive = true;
            yaw = camera.rotation.y;
            pitch = camera.rotation.x;
        } else {
            controls.enabled = true;
            controls.target.set(0, 0.5, 0);
            camera.position.set(0, 3, 10);
            controls.update();
        }

        // Hide selection canvas
        if (selectionCanvas) {
            selectionCanvas.classList.add('hidden');
            selectionCanvas.classList.add('pointer-events-none');
        }

        // Fade out extract toolbar
        if (extractToolbar) {
            extractToolbar.classList.remove('fade-in');
            extractToolbar.classList.add('opacity-0');
            setTimeout(() => {
                extractToolbar.classList.add('hidden');
            }, 500);
        }

        // Fade in bento grid UI
        bentoGrid.classList.remove('fade-out');
    });
}

if (btnExtractOrbit) {
    btnExtractOrbit.addEventListener('click', () => {
        isSelectionDrawingMode = false;
        isFlightControlsActive = false; // Suspend flight controls during orbit
        controls.enabled = true;

        // Set orbit target in front of camera
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        controls.target.copy(camera.position).addScaledVector(forward, 5);
        controls.update();

        updateExtractToolbarUI();
        logToTerminal('Orbit Navigation Mode active. Hold Left Click + Drag to rotate.', 'info');
    });
}

if (btnExtractSelect) {
    btnExtractSelect.addEventListener('click', () => {
        isSelectionDrawingMode = true;
        isFlightControlsActive = false; // Suspend movement during selection box drawing
        controls.enabled = false;
        updateExtractToolbarUI();
        logToTerminal('Select / Extract active. Drag bounding box over 3D scan.', 'info');
    });
}

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
                    logToTerminal(' - extract : Trigger Extract Mode (2D bounding box tools)', 'info');
                    logToTerminal(' - upload  : Initialize custom .ply cloud upload', 'info');
                    logToTerminal(' - creator : Trigger Text-to-3D spatial diffusion', 'info');
                    logToTerminal(' - clear   : Flush neural terminal console buffer', 'info');
                } else if (query === 'extract' || query === 'protocol 1') {
                    if (btnExtractMode) btnExtractMode.click();
                } else if (query === 'upload') {
                    if (btnUploadFile) btnUploadFile.click();
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
