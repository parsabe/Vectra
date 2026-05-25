<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VECTRA - Spatial Neural Core</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <!-- Load compiled stylesheets and JS via Vite -->
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>

<body class="scanlines relative min-h-screen w-full overflow-hidden select-none bg-black">

    <!-- Fixed Full-Screen Canvas for Three.js 3D Scanned Hallway Background -->
    <canvas id="vectra-canvas" class="fixed inset-0 w-full h-full block z-0 outline-none"></canvas>

    <!-- Floating Cyberpunk Bento Grid Overlay (pointer-events-none to pass click events to Three.js canvas where empty) -->
    <main
        class="relative z-10 w-full min-h-screen p-4 md:p-6 flex flex-col md:grid md:grid-cols-4 md:grid-rows-6 gap-4 pointer-events-none">

        <!-- ROW 1: HEADER PANEL -->
        <header
            class="col-span-4 cyber-glass p-4 flex justify-between items-center rounded pointer-events-auto border-b border-cyan-900/50">
            <div class="flex items-center gap-3">
                <div class="w-3 h-3 bg-cyan-400 rounded-full animate-ping"></div>
                <h1 class="text-glow-cyan font-bold tracking-widest text-lg md:text-xl">VECTRA // SPATIAL_CORE</h1>
            </div>
            <div class="flex items-center gap-6 text-xs text-cyan-500">
                <span class="hidden md:inline font-mono">SYS_STATUS: <span
                        class="text-glow-green text-green-400">ACTIVE</span></span>
                <span class="font-mono">NEURAL_LINK: <span
                        class="text-glow-cyan text-cyan-400">SYNCHRONIZED</span></span>
                <span class="font-mono bg-cyan-950/50 border border-cyan-700/50 px-2 py-1 rounded">V_1.0.4-NEURAL</span>
            </div>
        </header>

        <!-- ROW 2-3: TELEMETRY & SYSTEM MONITOR (LEFT COLUMN) -->
        <section class="col-span-1 row-span-4 flex flex-col gap-4">

            <!-- Diagnostics Panel -->
            <article class="flex-1 cyber-glass p-4 rounded flex flex-col pointer-events-auto relative overflow-hidden">
                <div class="cyber-scanner-line"></div>
                <header class="border-b border-cyan-900/50 pb-2 mb-3">
                    <span class="text-glow-cyan font-semibold text-xs tracking-wider">01 // SYS_DIAGNOSTICS</span>
                </header>
                <div class="flex-1 flex flex-col justify-between font-mono text-xs text-cyan-400 space-y-2">
                    <div class="flex justify-between">
                        <span>SYS.LOAD:</span>
                        <span class="text-glow-cyan">18.42%</span>
                    </div>
                    <div class="flex justify-between">
                        <span>GPU_TEMP:</span>
                        <span class="text-glow-magenta text-fuchsia-400">62°C</span>
                    </div>
                    <div class="flex justify-between">
                        <span>VRAM_ALLOC:</span>
                        <span>4.2GB / 8GB</span>
                    </div>
                    <div class="w-full bg-cyan-950/50 h-1.5 rounded-full overflow-hidden border border-cyan-900/50">
                        <div class="bg-cyan-400 h-full w-[52%] shadow-[0_0_8px_#00f3ff]"></div>
                    </div>
                    <div class="flex justify-between pt-2 border-t border-cyan-900/30">
                        <span>DB_UPLINK:</span>
                        <span class="text-glow-green text-green-400">ONLINE</span>
                    </div>
                    <div class="flex justify-between">
                        <span>LATENCY:</span>
                        <span class="text-glow-cyan">12ms</span>
                    </div>
                </div>
            </article>

            <!-- Anchor Matrix Panel -->
            <article
                class="flex-1 cyber-glass-magenta p-4 rounded flex flex-col pointer-events-auto relative overflow-hidden">
                <header class="border-b border-fuchsia-900/50 pb-2 mb-3">
                    <span class="text-glow-magenta font-semibold text-xs tracking-wider">02 // ANCHOR_MATRIX</span>
                </header>
                <div class="flex-1 flex flex-col justify-between font-mono text-xs text-fuchsia-400 space-y-2">
                    <div class="flex justify-between">
                        <span>ACTIVE_NODES:</span>
                        <span class="text-glow-magenta">147</span>
                    </div>
                    <div class="flex justify-between">
                        <span>SCAN_ACCURACY:</span>
                        <span>98.6%</span>
                    </div>
                    <div class="flex justify-between">
                        <span>MESH_SPLICES:</span>
                        <span>12 OK</span>
                    </div>
                    <div
                        class="w-full bg-fuchsia-950/50 h-1.5 rounded-full overflow-hidden border border-fuchsia-900/50">
                        <div class="bg-fuchsia-400 h-full w-[84%] shadow-[0_0_8px_#ff00ff]"></div>
                    </div>
                    <div class="flex justify-between pt-2 border-t border-fuchsia-900/30">
                        <span>GRID_DRIFT:</span>
                        <span>&lt; 0.002mm</span>
                    </div>
                    <div class="flex justify-between">
                        <span>COORDS_LOCK:</span>
                        <span class="text-glow-magenta">TRUE</span>
                    </div>
                </div>
            </article>

        </section>

        <!-- ROW 2-3: HOLOGRAPHIC SCANNER INDICATION CONTAINER (MIDDLE COLUMNS) -->
        <section
            class="col-span-2 row-span-4 cyber-glass p-4 rounded flex flex-col justify-between pointer-events-auto border border-cyan-900/20 md:min-h-0 min-h-[250px]">
            <header class="flex justify-between items-center border-b border-cyan-900/50 pb-2 mb-3">
                <span class="text-glow-cyan font-semibold text-xs tracking-wider">03 // VIEWPORT_TELEMETRY</span>
                <span
                    class="text-glow-green text-[10px] bg-green-950/50 px-2 py-0.5 border border-green-700/50 rounded uppercase">3D
                    Grid Active</span>
            </header>
            <div
                class="flex-1 flex flex-col justify-center items-center font-mono text-xs text-cyan-600 gap-2 border border-dashed border-cyan-950 rounded p-6">
                <span class="text-center">DRAG TO ROTATE SCENARIO MESH ENVIRONMENT</span>
                <div class="text-[10px] text-cyan-800 text-center uppercase tracking-widest mt-1">
                    Hold Left Click + Drag // Use Scroll Wheel to Zoom
                </div>
            </div>
            <div
                class="flex justify-between items-center mt-3 pt-2 border-t border-cyan-900/30 text-[10px] font-mono text-cyan-500">
                <span>ROT_X: <span id="telemetry-rot-x">0.00</span></span>
                <span>ROT_Y: <span id="telemetry-rot-y">0.00</span></span>
                <span>GRID_DIVS: 30</span>
            </div>
        </section>

        <!-- ROW 2-5: AI CO-PILOT TERMINAL PANEL (RIGHT COLUMN) -->
        <aside
            class="col-span-1 row-span-5 cyber-glass p-4 rounded flex flex-col justify-between pointer-events-auto border border-cyan-900/50 md:min-h-0 min-h-[400px]">
            <header class="border-b border-cyan-900/50 pb-2 mb-3 flex justify-between items-center">
                <span class="text-glow-cyan font-semibold text-xs tracking-wider">04 // AI.CO-PILOT_LINK</span>
                <span class="w-2 h-2 bg-green-400 rounded-full shadow-[0_0_6px_#39ff14]"></span>
            </header>

            <!-- Terminal Output Area -->
            <div id="terminal-output"
                class="flex-grow overflow-y-auto mb-4 font-mono text-xs flex flex-col gap-2 p-2 bg-black/45 rounded border border-cyan-950/70 terminal-output h-48 md:h-auto">
                <div class="text-glow-green">> Neural Link initialized.</div>
                <div class="text-cyan-500">> System status: ONLINE.</div>
                <div class="text-cyan-500">> Select protocol to initialize neural stream.</div>
            </div>

            <!-- Glowing Toggle Buttons -->
            <div class="flex flex-col gap-3 mb-4">
                <button id="btn-upload-file"
                    class="btn-cyber-cyan w-full py-3 rounded font-semibold text-xs uppercase tracking-widest focus:outline-none">
                    [INJECT SPATIAL SCAN]
                </button>
                <div class="text-[10px] font-mono text-cyan-600 text-center -mt-2.5 mb-2">Local PLY / GZ Stream</div>

                <button id="btn-creator-mode"
                    class="btn-cyber-magenta w-full py-3 rounded font-semibold text-xs uppercase tracking-widest focus:outline-none">
                    [Creator Mode]
                </button>
                <div class="text-[10px] font-mono text-fuchsia-600 text-center -mt-2.5">Text-to-3D Protocol</div>

                <button id="btn-extract-mode"
                    class="btn-cyber-green w-full py-3 rounded font-semibold text-xs uppercase tracking-widest focus:outline-none mt-1">
                    [Extract Mode]
                </button>
                <div class="text-[10px] font-mono text-green-600 text-center -mt-2.5">Image-to-3D Protocol</div>

                <!-- Hidden local file input -->
                <input type="file" id="file-uploader" accept=".ply,.ply.gz,.gz" class="hidden">
            </div>

            <!-- Terminal Input Form -->
            <div class="border-t border-cyan-900/50 pt-3 flex items-center gap-2">
                <span class="text-glow-cyan font-mono font-bold">></span>
                <input type="text" id="terminal-input" class="terminal-input font-mono text-xs"
                    placeholder="Type prompt/command..." autocomplete="off">
            </div>
        </aside>

        <!-- ROW 6: FOOTER INFORMATION -->
        <footer
            class="col-span-3 cyber-glass px-4 py-2 rounded flex justify-between items-center pointer-events-auto text-[10px] font-mono text-cyan-600 border border-cyan-950">
            <span>UPLINK ID: SC_8829-19</span>
            <span>CELL_MATRIX: 256x256</span>
            <span>VOLTAGE: 1.25V // CURRENT: 3.42A</span>
        </footer>

    </main>

    <!-- Splat Toolbar: Displayed in full-screen splat mode -->
    <div id="splat-toolbar"
        class="fixed top-6 left-1/2 -translate-x-1/2 z-20 pointer-events-auto cyber-glass px-6 py-3 rounded-full flex gap-4 md:gap-6 items-center hidden border border-cyan-500/30">
        <span class="text-glow-cyan font-bold tracking-widest text-[10px] md:text-xs font-mono uppercase">VECTRA //
            SPLAT_VIEWER</span>
        <div class="h-4 w-px bg-cyan-900/60"></div>
        <button id="btn-back-menu"
            class="btn-cyber-cyan px-3 py-1.5 rounded text-[9px] md:text-[10px] uppercase font-semibold tracking-wider focus:outline-none">
            [Back to Menu]
        </button>
        <button id="btn-toggle-select"
            class="btn-cyber-cyan px-3 py-1.5 rounded text-[9px] md:text-[10px] uppercase font-semibold tracking-wider focus:outline-none">
            [Select Objects: OFF]
        </button>
        <button id="btn-toggle-splatting"
            class="btn-cyber-cyan px-3 py-1.5 rounded text-[9px] md:text-[10px] uppercase font-semibold tracking-wider focus:outline-none">
            [3D Splatting: Point Size 0.06]
        </button>
    </div>

    <!-- ═══════════════════════════════════════════════════════
         EXTRACT MODE: Minimal Floating Toolbar (bottom-center)
         Fades in when user clicks [Extract Mode] button.
    ═══════════════════════════════════════════════════════ -->
    <div id="extract-toolbar" class="extract-toolbar-base fixed bottom-8 left-1/2 -translate-x-1/2 z-[25] pointer-events-none
               cyber-glass-green px-8 py-5 rounded-2xl flex gap-5 md:gap-7 items-center
               border border-green-500/40" aria-label="Extract Mode Controls" role="toolbar">

        <!-- Glowing label -->
        <div class="flex flex-col items-start gap-0.5 mr-2">
            <span
                class="text-glow-green font-bold tracking-widest text-[9px] md:text-[11px] font-mono uppercase">EXTRACT
                // DBSE</span>
            <span id="extract-mode-status" class="text-[8px] font-mono text-green-600 tracking-wider">ORBIT MODE
                ACTIVE</span>
        </div>

        <div class="h-8 w-px bg-green-900/60"></div>

        <!-- Button 1: Abort (Back to Main) -->
        <button id="btn-extract-abort"
            class="btn-cyber-red px-4 py-2 rounded-lg text-[10px] md:text-xs uppercase font-semibold tracking-wider focus:outline-none"
            aria-label="Abort Extract Mode">
            &#x2715; ABORT
        </button>

        <!-- Button 2: Orbit Mode -->
        <button id="btn-extract-orbit"
            class="btn-cyber-green extract-btn-active px-4 py-2 rounded-lg text-[10px] md:text-xs uppercase font-semibold tracking-wider focus:outline-none"
            aria-label="Activate Orbit Camera Mode">
            &#x21BA; ORBIT
        </button>

        <!-- Button 3: Select / Extract -->
        <button id="btn-extract-select"
            class="btn-cyber-green px-4 py-2 rounded-lg text-[10px] md:text-xs uppercase font-semibold tracking-wider focus:outline-none"
            aria-label="Activate Selection Bounding Box Mode">
            &#x25A3; SELECT
        </button>

        <!-- Button 4: Clear Extracted Model -->
        <button id="btn-extract-clear"
            class="btn-cyber-magenta px-4 py-2 rounded-lg text-[10px] md:text-xs uppercase font-semibold tracking-wider focus:outline-none hidden"
            aria-label="Clear Extracted 3D Output">
            &#x1F5D1; CLEAR 3D
        </button>
    </div>

    <!-- 2D Bounding-Box Selection Canvas Overlay (injected over the 3D canvas) -->
    <!-- This element is shown/hidden by JS; it sits directly above vectra-canvas -->
    <canvas id="selection-canvas" class="fixed inset-0 w-full h-full z-10 pointer-events-none" aria-hidden="true">
    </canvas>

    <!-- ════════════════════════════════════════════════
         EXTRACT MODE HUD — top-right corner readout
    ════════════════════════════════════════════════ -->
    <div id="extract-hud" class="hidden fixed top-6 right-6 z-[24] pointer-events-none
               cyber-glass-green px-5 py-3 rounded-xl border border-green-500/30
               font-mono text-[10px] flex flex-col gap-1.5" aria-live="polite" aria-label="Extract Mode telemetry">

        <!-- Title row -->
        <div class="flex items-center gap-2 border-b border-green-900/50 pb-1 mb-0.5">
            <span class="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_6px_#39ff14]"></span>
            <span class="text-glow-green tracking-widest uppercase text-[9px]">DBSE // EXTRACT MODE</span>
        </div>

        <!-- Camera coordinates -->
        <div class="flex flex-col gap-0.5">
            <span class="text-green-700 uppercase tracking-wider text-[8px]">CAM_POS</span>
            <span id="extract-hud-coords" class="text-glow-green text-[11px]">X:0.00 Y:0.00 Z:0.00</span>
        </div>

        <!-- FPS & controls hint -->
        <div class="flex justify-between items-center border-t border-green-900/30 pt-1 mt-0.5 gap-4">
            <span id="extract-hud-fps" class="text-green-500">-- FPS</span>
            <span class="text-green-800 text-[8px] uppercase tracking-wider">WASD • Q/E • SHIFT+WASD</span>
        </div>

        <!-- Key legend -->
        <div class="flex flex-wrap gap-x-3 gap-y-0.5 border-t border-green-900/20 pt-1">
            <span class="text-green-800 text-[8px]">W/S – Fwd/Back</span>
            <span class="text-green-800 text-[8px]">A/D – Strafe</span>
            <span class="text-green-800 text-[8px]">Q/E – Up/Down</span>
            <span class="text-green-800 text-[8px]">SHIFT – Sprint</span>
        </div>
    </div>

    <!-- Loading Overlay for 3D PLY load progress -->
    <div id="loading-overlay"
        class="fixed inset-0 z-30 bg-black/90 flex flex-col justify-center items-center gap-4 hidden pointer-events-auto font-mono text-xs text-cyan-400">
        <div
            class="w-12 h-12 border-2 border-t-cyan-400 border-r-transparent border-b-cyan-400 border-l-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(0,243,255,0.3)]">
        </div>
        <div id="loading-text" class="text-glow-cyan uppercase tracking-widest mt-2 text-center px-4">Initializing
            Neural Extraction...</div>
        <div class="w-64 bg-cyan-950/40 h-2 rounded-full overflow-hidden border border-cyan-700/30">
            <div id="loading-bar-fill"
                class="bg-cyan-400 h-full w-[0%] transition-all duration-100 shadow-[0_0_8px_#00f3ff]"></div>
        </div>
        <div id="loading-percent" class="text-[10px] text-cyan-500">0% Loaded</div>
    </div>

    <!-- Loading Overlay for Extraction (Image-to-3D) -->
    <div id="extract-loading-overlay"
        class="fixed inset-0 z-30 bg-black/90 flex flex-col justify-center items-center gap-4 hidden pointer-events-auto font-mono text-xs text-green-400">
        <div
            class="w-12 h-12 border-2 border-t-green-400 border-r-transparent border-b-green-400 border-l-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(57,255,20,0.3)]">
        </div>
        <div id="extract-loading-text" class="text-glow-green uppercase tracking-widest mt-2 text-center px-4">
            Initializing 3D Spatial extraction...
        </div>
        <div class="w-64 bg-green-950/40 h-2 rounded-full overflow-hidden border border-green-700/30">
            <div id="extract-loading-bar-fill"
                class="bg-green-400 h-full w-[0%] transition-all duration-100 shadow-[0_0_8px_#39ff14]"></div>
        </div>
        <div id="extract-loading-percent" class="text-[10px] text-green-500">0% Loaded</div>
    </div>

    <!-- Drag & Drop Interactive Overlay -->
    <div id="drop-zone-overlay"
        class="fixed inset-0 z-40 bg-black/85 border-4 border-dashed border-cyan-400 flex flex-col justify-center items-center gap-4 hidden pointer-events-none font-mono text-cyan-400">
        <div class="text-glow-cyan text-lg md:text-xl uppercase tracking-widest font-bold text-center px-6">
            [DROP PLY FILE HERE TO INITIALIZE NEURAL STREAM]
        </div>
        <div class="text-glow-magenta text-xs md:text-sm uppercase tracking-widest text-center px-6">
            Supports raw .ply and compressed .ply.gz spatial scans
        </div>
    </div>

</body>

</html>