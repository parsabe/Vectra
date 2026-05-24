import './bootstrap';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// --- System Telemetry DOM Elements ---
const telemetryRotX = document.getElementById('telemetry-rot-x');
const telemetryRotY = document.getElementById('telemetry-rot-y');
const terminalOutput = document.getElementById('terminal-output');
const terminalInput = document.getElementById('terminal-input');
const btnExtract = document.getElementById('btn-extract-mode');
const btnCreator = document.getElementById('btn-creator-mode');

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

// Neon Floating lights to scan the hallway
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

// --- Orbit Controls ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2 - 0.05; // Lock camera from going below floor level
controls.minDistance = 2;
controls.maxDistance = 45;
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

    // Slow drift of the entire hallway group to make it feel "active"
    hallwayGroup.rotation.y = Math.sin(elapsedTime * 0.05) * 0.02;

    // Update controls
    controls.update();

    // Render Scene
    renderer.render(scene, camera);

    // Update telemetry in UI
    if (telemetryRotX && telemetryRotY) {
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
    
    // Style console logs to look high-tech in Developer Tools
    console.log(
        `%c ${consoleMsg} `,
        'color: #00f3ff; font-weight: bold; background: #05080f; padding: 6px 12px; border: 1px solid #00f3ff; border-radius: 4px; box-shadow: 0 0 10px rgba(0, 243, 255, 0.3);'
    );
}

// --- Protocol Scenarios Placeholders ---
function initiateExtractMode() {
    console.log('%c[PROTOCOL-1] Waiting for user click coordinates on holographic map...', 'color: #39ff14');
}

function initiateCreatorMode() {
    console.log('%c[PROTOCOL-2] Initializing GAN/NeRF text-to-spatial projection...', 'color: #ff00ff');
}

// --- Event Listeners binding ---
if (btnExtract) {
    btnExtract.addEventListener('click', () => {
        logConsoleSystem(1, 'Extract Mode');
        logToTerminal('Protocol 1 Initiated: Extract Mode...', 'info');
        logToTerminal('Hologram scanning matrix active.', 'success');
        initiateExtractMode();
    });
}

if (btnCreator) {
    btnCreator.addEventListener('click', () => {
        logConsoleSystem(2, 'Creator Mode');
        logToTerminal('Protocol 2 Initiated: Creator Mode...', 'info');
        logToTerminal('Text-to-3D neural network initialized.', 'success');
        initiateCreatorMode();
    });
}

// Terminal commands listener
if (terminalInput) {
    terminalInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && terminalInput.value.trim() !== '') {
            const inputVal = terminalInput.value.trim();
            logToTerminal(`USER@VECTRA: ${inputVal}`, 'info');
            terminalInput.value = '';

            // Generate responses
            setTimeout(() => {
                const query = inputVal.toLowerCase();
                if (query === 'help') {
                    logToTerminal('Available Protocols:', 'info');
                    logToTerminal(' - extract : Trigger Image-to-3D extraction matrix', 'info');
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
