// Strict Separation: ESM Frontend Core

class VectraTerminal {
    constructor() {
        this.terminal = document.getElementById('terminal-output');
    }

    print(message, status = 'info') {
        const el = document.createElement('div');
        el.textContent = `> ${message}`;
        
        if (status === 'success') el.classList.add('text-glow-green');
        else if (status === 'error') el.classList.add('text-glow-magenta');
        else el.classList.add('text-cyan-400');
        
        this.terminal.appendChild(el);
        this.terminal.scrollTop = this.terminal.scrollHeight;
    }
}

class HologramController {
    constructor(terminal) {
        this.terminal = terminal;
        this.canvas = document.getElementById('hologram-canvas');
        this.ctx = this.canvas.getContext('2d'); // Boilerplate fallback for WebGL context
        this.meshViewer = document.getElementById('mesh-viewer');
        this.csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
        
        this.initEnvironment();
        this.bindEvents();
    }

    initEnvironment() {
        // Match DOM size
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        
        // TODO: Initialize gsplat Viewer here. Example:
        // import * as gsplat from 'gsplat';
        // this.viewer = new gsplat.Viewer({ canvas: this.canvas });
        // this.viewer.loadFile('/path/to/environment.ply');

        this.terminal.print('Environment topology loaded. Ready for extraction.', 'success');
    }

    bindEvents() {
        this.canvas.addEventListener('click', async (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const coords = [Math.floor(e.clientX - rect.left), Math.floor(e.clientY - rect.top)];
            
            this.terminal.print(`Coordinates locked: [${coords[0]}, ${coords[1]}]`);
            this.terminal.print('Uploading visual matrix to SAM...', 'info');

            try {
                // Grab Snapshot
                const imagePayload = this.canvas.toDataURL('image/png');
                
                // Trigger Segmentation
                const segmentReq = await fetch('/api/segment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': this.csrfToken },
                    body: JSON.stringify({ image: imagePayload, coordinates: coords })
                });
                const segmentData = await segmentReq.json();
                if (!segmentReq.ok) throw new Error(segmentData.error);
                
                this.terminal.print('Data-jack successful. Mesh splice initiated...', 'success');

                // Proceed to Generation (Mocked for Boilerplate flow)
                // ... (Call to /api/generate-3d here following similar pattern) ...

            } catch (err) {
                this.terminal.print(`SYS_ERR: ${err.message}`, 'error');
            }
        });
    }
}

const terminal = new VectraTerminal();
const hologram = new HologramController(terminal);