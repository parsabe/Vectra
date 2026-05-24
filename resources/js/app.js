import './bootstrap';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';

// --- System Telemetry DOM Elements ---
const telemetryRotX = document.getElementById('telemetry-rot-x');
const telemetryRotY = document.getElementById('telemetry-rot-y');
const terminalOutput = document.getElementById('terminal-output');
const terminalInput = document.getElementById('terminal-input');
const btnExtract = document.getElementById('btn-extract-mode');
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

// --- Orbit Controls ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2 - 0.05; // Lock camera from going below floor level
controls.minDistance = 1;
controls.maxDistance = 50;
controls.target.set(0, 0.5, 0);

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

    // Update controls
    controls.update();

    // Render Scene
    renderer.render(scene, camera);

    // Update telemetry in UI (only when main menu bento grid is visible)
    if (telemetryRotX && telemetryRotY && !bentoGrid.classList.contains('hidden')) {
        telemetryRotX.textContent = controls.object.rotation.x.toFixed(2);
        telemetryRotY.textContent = controls.object.rotation.y.toFixed(2);
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

// --- PLY Loader with Native GZIP Streaming Decompression ---
async function loadPLYModel(url) {
    if (isModelLoading) {
        logToTerminal('SYS_ALERT: Extraction process already in progress.', 'error');
        return;
    }

    isModelLoading = true;

    // Transition UI to Splat loading state (everything disappears)
    bentoGrid.classList.add('hidden');
    loadingOverlay.classList.remove('hidden');
    loadingBarFill.style.width = '0%';
    loadingPercent.textContent = '0% Loaded';
    loadingText.textContent = 'Connecting to neural file-stream...';

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
    
    // Clear previous selection markers
    markersGroup.replaceChildren();

    // Make the corridor invisible so only the splat model shows up
    hallwayGroup.visible = false;

    try {
        logToTerminal('Opening compressed stream: /files/point_cloud.ply.gz...');

        // Fetch compressed file directly
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP network error ${response.status}`);
        }

        const contentLength = +response.headers.get('Content-Length');
        const reader = response.body.getReader();

        let receivedBytes = 0;
        const chunks = [];

        // Loop to read incoming chunks and track progress
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            chunks.push(value);
            receivedBytes += value.length;

            if (contentLength) {
                const percent = Math.round((receivedBytes / contentLength) * 100);
                loadingBarFill.style.width = `${percent}%`;
                loadingPercent.textContent = `${percent}% Loaded`;
                loadingText.textContent = `Streaming compressed splat cloud... (${(receivedBytes / 1024 / 1024).toFixed(1)} MB / ${(contentLength / 1024 / 1024).toFixed(1)} MB)`;
            } else {
                loadingPercent.textContent = 'Streaming...';
                loadingText.textContent = `Streaming compressed splat cloud... (${(receivedBytes / 1024 / 1024).toFixed(1)} MB)`;
            }
        }

        // Hardware-accelerated browser-native Decompression
        loadingText.textContent = 'Decompressing spatial matrix (GZIP)...';
        const blob = new Blob(chunks);
        const ds = new DecompressionStream('gzip');
        const decompressedStream = blob.stream().pipeThrough(ds);
        const decompressedResponse = new Response(decompressedStream);
        const arrayBuffer = await decompressedResponse.arrayBuffer();

        // Parse geometry using PLYLoader (asynchronously to allow DOM redraw first)
        loadingText.textContent = 'Reconstructing 3D spatial points...';
        await new Promise(resolve => setTimeout(resolve, 50));

        const loader = new PLYLoader();
        const geometry = loader.parse(arrayBuffer);

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
        const isMesh = geometry.index !== null || (geometry.attributes.normal !== undefined);

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
        console.log(`%c[VECTRA] Map complete: ${nodesCount.toLocaleString()} spatial nodes loaded.`, 'color: #39ff14');
        isModelLoading = false;

    } catch (error) {
        isModelLoading = false;
        console.error('[LOAD_ERR]', error);
        
        // Revert UI on error
        loadingOverlay.classList.add('hidden');
        bentoGrid.classList.remove('hidden');
        
        logToTerminal(`SYS_ERR: Failed to parse spatial data matrix: ${error.message}`, 'error');
        
        // Restore hallway view
        hallwayGroup.visible = true;
    }
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
        
        // Clear selection markers
        markersGroup.replaceChildren();

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
if (btnExtract) {
    btnExtract.addEventListener('click', () => {
        logConsoleSystem(1, 'Extract Mode');
        logToTerminal('Protocol 1 Initiated: Extract Mode...', 'info');
        loadPLYModel('/files/point_cloud.ply.gz');
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
                    logToTerminal(' - extract : Initialize .ply cloud data load', 'info');
                    logToTerminal(' - creator : Trigger Text-to-3D spatial diffusion', 'info');
                    logToTerminal(' - clear   : Flush neural terminal console buffer', 'info');
                } else if (query === 'extract' || query === 'protocol 1') {
                    btnExtract.click();
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
