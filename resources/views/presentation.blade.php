<!DOCTYPE html>
<html lang="en" class="scroll-smooth">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vectra: The Quarantine Matrix — 3D Scrollytelling Deck</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <!-- Google Fonts for Cyberpunk & Technical Aesthetics -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;700&family=Orbitron:wght@700;800;900&display=swap" rel="stylesheet">

    <!-- KaTeX CSS for Mathematical Formulations -->
    <link rel="stylesheet" 
          href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" 
          integrity="sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV" 
          crossorigin="anonymous">

    <!-- Lenis Smooth Scroll CSS -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/lenis@1.1.20/dist/lenis.css">

    <!-- Compiled assets via Laravel Vite -->
    @vite(['resources/css/app.css', 'resources/js/presentation.js'])

    <style>
        /* Force scrollability on window but disable native CSS scroll snapping to avoid Lenis conflict */
        html, body {
            height: auto !important;
            overflow-y: visible !important;
            overflow-x: hidden !important;
            background-color: #020204;
            margin: 0;
            padding: 0;
            scroll-behavior: auto !important; /* Lenis handles smoothing */
        }

        /* 100vh full-screen absolute section slide overlays */
        .scrolly-section {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            pointer-events: none;
            box-sizing: border-box;
            z-index: 10;
        }

        /* Borderless glassmorphism overlays with strong text shadowing for readability */
        .floating-pane {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            text-shadow: 0 4px 20px rgba(0, 0, 0, 0.98), 0 2px 6px rgba(0, 0, 0, 0.95);
        }

        .text-glow-cyan {
            color: #00f3ff;
            text-shadow: 0 0 10px rgba(0, 243, 255, 0.7), 0 4px 12px rgba(0, 0, 0, 0.9);
        }
        
        .text-glow-magenta {
            color: #ff00ff;
            text-shadow: 0 0 10px rgba(255, 0, 255, 0.7), 0 4px 12px rgba(0, 0, 0, 0.9);
        }
        
        .text-glow-yellow {
            color: #eab308;
            text-shadow: 0 0 10px rgba(234, 179, 8, 0.7), 0 4px 12px rgba(0, 0, 0, 0.9);
        }

        /* Technical selection tabs (borderless hover states) */
        .tab-btn {
            position: relative;
            transition: all 0.3s ease;
            text-shadow: 0 2px 4px rgba(0,0,0,0.8);
        }
        .tab-btn.active {
            color: #00f3ff;
            text-shadow: 0 0 8px rgba(0, 243, 255, 0.8), 0 2px 4px rgba(0,0,0,0.9);
        }
        .tab-btn.active::before {
            content: '';
            position: absolute;
            left: -12px;
            top: 50%;
            transform: translateY(-50%);
            width: 4px;
            height: 12px;
            background-color: #00f3ff;
            box-shadow: 0 0 8px #00f3ff;
        }

        /* Flowchart animation lines */
        .flow-line {
            stroke-dasharray: 8;
            animation: flowDash 20s linear infinite;
        }
        @keyframes flowDash {
            to {
                stroke-dashoffset: -1000;
            }
        }

        /* Nav Dots Indicator */
        .nav-dot {
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .nav-dot.active {
            background-color: #00f3ff;
            border-color: #00f3ff;
            box-shadow: 0 0 10px #00f3ff;
            transform: scale(1.3);
        }
        
        /* Disable text selection during presentation navigation */
        .no-select {
            user-select: none;
            -webkit-user-select: none;
        }
    </style>
</head>

<body class="bg-black text-neutral-200 no-select overflow-x-hidden font-sans relative">

    <!-- Scrollable container providing height for the pinning mechanism -->
    <div id="scroll-container" class="relative w-full h-[700vh]">
        
        <!-- Pinned Wrapper: Locks in viewport and hides overflows -->
        <div id="scroll-wrapper" class="fixed inset-0 w-full h-screen overflow-hidden z-0">
            
            <!-- Fixed WebGL Background Canvas behind UI -->
            <canvas id="bg-canvas" class="absolute inset-0 w-full h-full z-[-1] bg-black block outline-none"></canvas>

            <!-- Scroll Progress Indicator Bar at the Top -->
            <div class="absolute top-0 left-0 w-full h-1 z-50 bg-neutral-950/60">
                <div id="scroll-progress" class="h-full bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-yellow-300 shadow-[0_0_10px_#00f3ff] w-0 transition-all duration-75 ease-out"></div>
            </div>

            <!-- Floating Cyberpunk Header Panel -->
            <header class="absolute top-4 left-4 right-4 z-40 bg-neutral-950/20 backdrop-blur-md rounded-xl p-4 flex justify-between items-center pointer-events-auto border border-neutral-900/10">
                <div class="flex items-center gap-3">
                    <div class="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping shadow-[0_0_8px_#00f3ff]"></div>
                    <a href="/" class="text-glow-cyan font-mono font-bold tracking-widest text-xs md:text-sm hover:text-cyan-300 transition-colors">
                        VECTRA // THESIS_DECK
                    </a>
                </div>
                <div class="flex items-center gap-4 text-[10px] font-mono">
                    <span class="hidden sm:inline text-neutral-400">TELEMETRY_ENGINE: <span class="text-glow-cyan">ACTIVE</span></span>
                    <div class="h-4 w-px bg-cyan-900/20 hidden sm:block"></div>
                    <a href="/" class="px-3 py-1 rounded border border-cyan-500/15 hover:border-cyan-400/40 bg-cyan-950/5 text-cyan-400 hover:text-white transition-all text-glow-cyan">
                        [ RETURN TO PORTAL ]
                    </a>
                </div>
            </header>

            <!-- Floating Navigation dots for sections (Right Side) -->
            <nav class="absolute right-6 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-4 pointer-events-auto">
                <button onclick="scrollToSection(0)" id="dot-0" class="nav-dot w-2.5 h-2.5 rounded-full border border-cyan-500/50 bg-transparent hover:bg-cyan-400 active"></button>
                <button onclick="scrollToSection(1)" id="dot-1" class="nav-dot w-2.5 h-2.5 rounded-full border border-cyan-500/50 bg-transparent hover:bg-cyan-400"></button>
                <button onclick="scrollToSection(2)" id="dot-2" class="nav-dot w-2.5 h-2.5 rounded-full border border-cyan-500/50 bg-transparent hover:bg-cyan-400"></button>
                <button onclick="scrollToSection(3)" id="dot-3" class="nav-dot w-2.5 h-2.5 rounded-full border border-cyan-500/50 bg-transparent hover:bg-cyan-400"></button>
                <button onclick="scrollToSection(4)" id="dot-4" class="nav-dot w-2.5 h-2.5 rounded-full border border-cyan-500/50 bg-transparent hover:bg-cyan-400"></button>
                <button onclick="scrollToSection(5)" id="dot-5" class="nav-dot w-2.5 h-2.5 rounded-full border border-cyan-500/50 bg-transparent hover:bg-cyan-400"></button>
                <button onclick="scrollToSection(6)" id="dot-6" class="nav-dot w-2.5 h-2.5 rounded-full border border-cyan-500/50 bg-transparent hover:bg-cyan-400"></button>
            </nav>

            <!-- Absolutely Stacked Section Content -->
            <div class="relative w-full h-full">

                <!-- SECTION 0: HERO & ABSTRACT -->
                <section id="section-0" class="scrolly-section opacity-1 pointer-events-auto">
                    <div class="w-full max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center h-full max-h-[80vh] floating-pane">
                        <!-- Left text content -->
                        <div class="lg:col-span-7 flex flex-col justify-center text-left">
                            <div class="font-mono text-[10px] text-cyan-400 tracking-[0.3em] uppercase mb-3 text-glow-cyan">// INTRODUCTION & ABSTRACT</div>
                            <h1 class="font-mono uppercase text-3xl md:text-5xl lg:text-6xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-yellow-200 to-fuchsia-500 leading-none mb-3">
                                Vectra: The Quarantine Matrix
                            </h1>
                            <h2 class="font-mono text-xs md:text-base text-fuchsia-400 text-glow-magenta mb-5 font-semibold uppercase">
                                Constraining Neural Hallucinations in 3D Gaussian Environments
                            </h2>
                            <p class="leading-relaxed text-neutral-300 text-xs md:text-sm mb-6 font-sans">
                                The hyper-accelerated rise of generative artificial intelligence is rewiring the rules of 3D content creation. Yet, seamlessly jacking everyday 2D inputs—like text prompts and flat images—into fully interactive, dynamic 3D constructs remains a critical bottleneck. We orchestrate a decoupled, asynchronous pipeline that fuses zero-shot semantic extraction, generative mesh synthesis, and web-based physics integration.
                            </p>
                            <div class="flex items-center gap-3 text-[9px] font-mono text-neutral-400 pt-3 border-t border-neutral-900/10">
                                <div>AUTHOR: <span class="text-yellow-400 text-glow-yellow font-bold">PARSA BESHARAT</span></div>
                                <div class="text-neutral-700">|</div>
                                <div>TU BERGAKADEMIE FREIBERG</div>
                            </div>
                        </div>
                        <!-- Right zoomed figure image -->
                        <div class="lg:col-span-5 flex justify-center items-center h-full">
                            <div class="zoom-image-container w-full h-full max-h-[45vh] lg:max-h-[55vh] flex flex-col justify-center items-center relative transition-all duration-500">
                                <img src="/img/logo.png" alt="Figure 1: Vectra Logo" class="zoom-image max-w-full max-h-[380px] object-contain rounded-lg">
                                <div class="font-mono text-[9px] text-neutral-500 mt-3 text-center tracking-wider uppercase">// Figure 1: Vectra Logo</div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- SECTION 1: RELATED WORK & MATHEMATICAL BLUEPRINTS -->
                <section id="section-1" class="scrolly-section">
                    <div class="w-full max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center h-full max-h-[80vh] floating-pane">
                        <!-- Left Sidebar: Selection Tabs -->
                        <div class="lg:col-span-3 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 font-mono text-[9px] uppercase tracking-wider text-neutral-500 border-b lg:border-b-0 lg:border-r border-neutral-900/20 pr-3 h-full justify-center">
                            <button onclick="selectFormula(0)" id="f-tab-0" class="tab-btn active text-left py-1.5 hover:text-cyan-400 transition-colors">01 // NeRF: Volume Rendering</button>
                            <button onclick="selectFormula(1)" id="f-tab-1" class="tab-btn text-left py-1.5 hover:text-cyan-400 transition-colors">02 // Metrics: PSNR, SSIM, LPIPS</button>
                            <button onclick="selectFormula(2)" id="f-tab-2" class="tab-btn text-left py-1.5 hover:text-cyan-400 transition-colors">03 // DietNeRF: Semantic Loss</button>
                            <button onclick="selectFormula(3)" id="f-tab-3" class="tab-btn text-left py-1.5 hover:text-cyan-400 transition-colors">04 // RegNeRF: Regularization</button>
                            <button onclick="selectFormula(4)" id="f-tab-4" class="tab-btn text-left py-1.5 hover:text-cyan-400 transition-colors">05 // DreamGaussian: SDS & Density</button>
                            <button onclick="selectFormula(5)" id="f-tab-5" class="tab-btn text-left py-1.5 hover:text-cyan-400 transition-colors">06 // Dynamic3D: Kinematics</button>
                        </div>
                        <!-- Center Panel: LaTeX Math formulas -->
                        <div class="lg:col-span-5 flex flex-col justify-center min-h-[350px] px-4">
                            <div id="formula-detail-pane" class="transition-opacity duration-300">
                                <!-- Dynamic Content injected via JS -->
                            </div>
                        </div>
                        <!-- Right Panel: Corresponding Figure with Zoom effect -->
                        <div class="lg:col-span-4 flex justify-center items-center h-full">
                            <div id="formula-fig-container" class="zoom-image-container w-full h-full max-h-[45vh] lg:max-h-[55vh] flex flex-col justify-center items-center relative transition-all duration-500">
                                <img id="formula-fig" src="/img/1.png" alt="Mathematical Figure" class="zoom-image max-w-full max-h-[340px] object-contain rounded-lg">
                                <div id="formula-fig-caption" class="font-mono text-[9px] text-neutral-500 mt-3 text-center tracking-wider uppercase">// Figure Reference</div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- SECTION 2: METHODOLOGY & 3D PIPELINE -->
                <section id="section-2" class="scrolly-section">
                    <div class="w-full max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center h-full max-h-[80vh] floating-pane">
                        <!-- Left Panel: Scenarios overview -->
                        <div class="lg:col-span-5 flex flex-col justify-center">
                            <div class="font-mono text-[10px] text-fuchsia-400 tracking-[0.3em] uppercase mb-2 text-glow-magenta">// SECTION_02 // SYSTEM PIPELINES</div>
                            <h2 class="font-mono uppercase text-xl md:text-2xl font-black text-fuchsia-300 mb-3 text-glow-magenta">Methodology & Architecture</h2>
                            <!-- Scenario Toggle Buttons -->
                            <div class="flex flex-wrap gap-2 mb-4 font-mono text-[9px]">
                                <button onclick="selectScenario('extract')" id="scen-btn-extract" class="px-2.5 py-1 rounded border border-cyan-500/20 hover:border-cyan-400 bg-cyan-950/10 text-cyan-400 active">Scenario 1: Extraction</button>
                                <button onclick="selectScenario('create')" id="scen-btn-create" class="px-2.5 py-1 rounded border border-fuchsia-500/20 hover:border-fuchsia-400 bg-fuchsia-950/10 text-fuchsia-400">Scenario 2: Creation</button>
                                <button onclick="selectScenario('physics')" id="scen-btn-physics" class="px-2.5 py-1 rounded border border-yellow-500/20 hover:border-yellow-400 bg-yellow-950/10 text-yellow-400">Scenario 3: Kinematics</button>
                            </div>
                            <div id="scenario-detail" class="text-xs md:text-sm text-neutral-300 leading-relaxed space-y-2 font-sans min-h-[160px]">
                                <!-- Content dynamically loaded via JS -->
                            </div>
                        </div>
                        <!-- Right Panel: SVG Animated Flowchart Grid -->
                        <div class="lg:col-span-7 flex flex-col justify-center items-center">
                            <div class="w-full max-w-xl p-4 relative font-mono text-[9px] text-neutral-400">
                                <div class="text-center text-glow-cyan text-[10px] uppercase font-bold tracking-widest mb-4">Vectra Spatial Processing Map</div>
                                <div class="relative w-full h-[180px]">
                                    <svg class="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 180">
                                        <defs>
                                            <linearGradient id="cyan-glow" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stop-color="#00f3ff" />
                                                <stop offset="100%" stop-color="#ff00ff" />
                                            </linearGradient>
                                        </defs>
                                        <path id="flow-path-1" d="M 120,47 L 150,47" stroke="url(#cyan-glow)" stroke-width="1.5" fill="none" class="flow-line" />
                                        <path id="flow-path-2" d="M 270,47 L 300,47" stroke="url(#cyan-glow)" stroke-width="1.5" fill="none" class="flow-line" />
                                        <path id="flow-path-3" d="M 355,65 L 355,110" stroke="url(#cyan-glow)" stroke-width="1.5" fill="none" class="flow-line" />
                                        <path id="flow-path-4" d="M 290,127 L 250,127" stroke="url(#cyan-glow)" stroke-width="1.5" fill="none" class="flow-line" />
                                        <path id="flow-path-5" d="M 130,127 L 65,127 L 65,65" stroke="url(#cyan-glow)" stroke-width="1.5" fill="none" class="flow-line" />
                                        
                                        <g id="node-input" class="cursor-pointer">
                                            <rect x="10" y="30" width="110" height="35" rx="6" fill="#020204" fill-opacity="0.8" stroke="#00f3ff" stroke-width="1" stroke-opacity="0.3" />
                                            <text x="65" y="51" fill="#00f3ff" text-anchor="middle" font-weight="bold">INPUT SOURCE</text>
                                        </g>
                                        <g id="node-segment" class="cursor-pointer">
                                            <rect x="150" y="30" width="120" height="35" rx="6" fill="#020204" fill-opacity="0.8" stroke="#ff00ff" stroke-width="1" stroke-opacity="0.3" />
                                            <text x="210" y="51" fill="#ff00ff" text-anchor="middle" font-weight="bold">U2NET MASKING</text>
                                        </g>
                                        <g id="node-forge" class="cursor-pointer">
                                            <rect x="300" y="30" width="110" height="35" rx="6" fill="#020204" fill-opacity="0.8" stroke="#eab308" stroke-width="1" stroke-opacity="0.3" />
                                            <text x="355" y="51" fill="#eab308" text-anchor="middle" font-weight="bold">TRIPOSR FORGE</text>
                                        </g>
                                        <g id="node-dbse" class="cursor-pointer">
                                            <rect x="290" y="110" width="120" height="35" rx="6" fill="#020204" fill-opacity="0.8" stroke="#00f3ff" stroke-width="1" stroke-opacity="0.3" />
                                            <text x="350" y="131" fill="#00f3ff" text-anchor="middle" font-weight="bold">DBSE HOLE-PUNCH</text>
                                        </g>
                                        <g id="node-inject" class="cursor-pointer">
                                            <rect x="130" y="110" width="120" height="35" rx="6" fill="#020204" fill-opacity="0.8" stroke="#ff00ff" stroke-width="1" stroke-opacity="0.3" />
                                            <text x="190" y="131" fill="#ff00ff" text-anchor="middle" font-weight="bold">GLB RIGIDBODY</text>
                                        </g>
                                    </svg>
                                </div>
                                <div id="flow-node-details" class="p-3 bg-neutral-950/20 backdrop-blur-sm rounded-lg border border-neutral-900/10 text-[9px] leading-relaxed text-neutral-400 mt-2">
                                    Hover over any node in the processing loop above to inspect telemetry variables.
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- SECTION 3: EXPERIMENTAL ANALYSIS -->
                <section id="section-3" class="scrolly-section">
                    <div class="w-full max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center h-full max-h-[80vh] floating-pane">
                        <!-- Left text content -->
                        <div class="lg:col-span-7 flex flex-col justify-center text-left">
                            <div class="font-mono text-[10px] text-yellow-400 tracking-[0.3em] uppercase mb-2 text-glow-yellow">// SECTION_03 // PERFORMANCE TELEMETRY</div>
                            <h2 class="font-mono uppercase text-xl md:text-3xl font-black text-yellow-300 mb-4 text-glow-yellow">
                                Experiments & Evaluation
                            </h2>
                            <p class="leading-relaxed text-neutral-300 text-xs md:text-sm mb-5 font-sans">
                                Audited on localized Nvidia RTX 4060 graphics chips limited strictly to a consumer budget of <strong>8GB VRAM</strong>. Rendering speeds and memory logs are analyzed dynamically.
                            </p>
                            <ul class="font-mono text-[10px] md:text-xs text-neutral-400 space-y-3 mb-4">
                                <li><span class="text-yellow-400 font-bold">> VIEWPORT STABILITY:</span> Stable <span class="text-yellow-300 font-bold">60 FPS</span> idle, drops briefly to <span class="text-yellow-300 font-bold">30 FPS</span> during active inference.</li>
                                <li><span class="text-yellow-400 font-bold">> PIPELINE LATENCY:</span> Average round-trip compilation and injection clocks <span class="text-yellow-300 font-bold">120.2 seconds</span>.</li>
                                <li><span class="text-yellow-400 font-bold">> GPU MEMORY PEAK:</span> Memory allocation remains strictly locked under the limit, peaking at <span class="text-yellow-300 font-bold">7.8 GB</span>.</li>
                            </ul>
                        </div>
                        <!-- Right zoomed figure image -->
                        <div class="lg:col-span-5 flex justify-center items-center h-full">
                            <div class="zoom-image-container w-full h-full max-h-[45vh] lg:max-h-[55vh] flex flex-col justify-center items-center relative transition-all duration-500">
                                <img src="/img/10.png" alt="Figure 10: High-Level Topology" class="zoom-image max-w-full max-h-[340px] object-contain rounded-lg">
                                <div class="font-mono text-[9px] text-neutral-500 mt-3 text-center tracking-wider uppercase">// Figure 10: High-Level Topology</div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- SECTION 4: DISCUSSION & LIMITATIONS -->
                <section id="section-4" class="scrolly-section">
                    <div class="w-full max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center h-full max-h-[80vh] floating-pane">
                        <!-- Left text content -->
                        <div class="lg:col-span-7 flex flex-col justify-center text-left">
                            <div class="font-mono text-[10px] text-fuchsia-400 tracking-[0.3em] uppercase mb-2 text-glow-magenta">// SECTION_04 // DISCUSSION & LIMITATIONS</div>
                            <h2 class="font-mono uppercase text-xl md:text-3xl font-black text-fuchsia-300 mb-4 text-glow-magenta">
                                Discussion & Constraints
                            </h2>
                            <p class="leading-relaxed text-neutral-300 text-xs md:text-sm mb-4 font-sans">
                                Edge computing environments introduce strict hardware thresholds. Operating SDXL-Lightning and TripoSR sequentially prevents Out-Of-Memory (OOM) kernel crashes but forces continuous model loading latency.
                            </p>
                            <ul class="font-mono text-[10px] md:text-xs text-neutral-400 space-y-3">
                                <li><span class="text-fuchsia-400 font-bold">> SEGMENTATION FRAGILITY:</span> Unisolated backgrounds in U2Net cause severe <span class="text-fuchsia-300 font-bold">"blob artifacts"</span>.</li>
                                <li><span class="text-fuchsia-400 font-bold">> COLLISION BOUNDS:</span> Physical middleware limits dynamic meshes to rigid bounding box colliders.</li>
                                <li><span class="text-fuchsia-400 font-bold">> DISTRIBUTED UPGRADE:</span> Future work offloads operations to CUDA-streamed High Performance Computing (HPC) nodes.</li>
                            </ul>
                        </div>
                        <!-- Right zoomed figure image -->
                        <div class="lg:col-span-5 flex justify-center items-center h-full">
                            <div class="zoom-image-container w-full h-full max-h-[45vh] lg:max-h-[55vh] flex flex-col justify-center items-center relative transition-all duration-500">
                                <img src="/img/13.png" alt="Figure 14: Sequential VRAM Orchestration" class="zoom-image max-w-full max-h-[340px] object-contain rounded-lg">
                                <div class="font-mono text-[9px] text-neutral-500 mt-3 text-center tracking-wider uppercase">// Figure 14: VRAM lifecycle</div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- SECTION 5: CONCLUSION -->
                <section id="section-5" class="scrolly-section">
                    <div class="w-full max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center h-full max-h-[80vh] floating-pane">
                        <!-- Left text content -->
                        <div class="lg:col-span-7 flex flex-col justify-center text-left">
                            <div class="font-mono text-[10px] text-cyan-400 tracking-[0.3em] uppercase mb-2 text-glow-cyan">// SECTION_05 // CONCLUSION SUMMARY</div>
                            <h2 class="font-mono uppercase text-xl md:text-3xl font-black text-cyan-300 mb-4 text-glow-cyan">
                                Conclusion
                            </h2>
                            <p class="leading-relaxed text-neutral-300 text-xs md:text-sm mb-4 font-sans">
                                Generative AI and spatial computing architectures must converge. By utilizing decoupled asynchronous pipelines and non-destructive shader culling (DBSE), Vectra successfully spawns textured dynamic rigidbodies directly inside complex 3D Gaussian environments.
                            </p>
                            <p class="leading-relaxed text-neutral-300 text-xs md:text-sm font-sans">
                                Ultimately, securing digital twins requires integrating definitive mathematical safeguards (like Control Barrier Functions) directly at the rendering level to ensure absolute physical safety.
                            </p>
                        </div>
                        <!-- Right zoomed figure image -->
                        <div class="lg:col-span-5 flex justify-center items-center h-full">
                            <div class="zoom-image-container w-full h-full max-h-[45vh] lg:max-h-[55vh] flex flex-col justify-center items-center relative transition-all duration-500">
                                <img src="/img/11.png" alt="Figure 11: Decoupled Pipeline Flowchart" class="zoom-image max-w-full max-h-[340px] object-contain rounded-lg">
                                <div class="font-mono text-[9px] text-neutral-500 mt-3 text-center tracking-wider uppercase">// Figure 11: Decoupled Pipeline Flowchart</div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- SECTION 6: REFERENCES & PORTAL LINK -->
                <section id="section-6" class="scrolly-section">
                    <div class="w-full max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center h-full max-h-[80vh] floating-pane">
                        <!-- Left text content -->
                        <div class="lg:col-span-7 flex flex-col justify-center text-left">
                            <div class="font-mono text-[10px] text-yellow-400 tracking-[0.3em] uppercase mb-3 text-glow-yellow">// SECTION_06 // CITATIONS & PORTAL</div>
                            <h2 class="font-mono uppercase text-xl md:text-2xl font-black text-white mb-4">
                                References & Launch
                            </h2>
                            <ul class="font-mono text-[9px] text-neutral-400 space-y-2.5 max-h-[240px] overflow-y-auto pr-2">
                                <li>[1] Mildenhall et al. (2020) - <em>NeRF: Representing Scenes as Neural Radiance Fields for View Synthesis</em> (ECCV).</li>
                                <li>[2] Rabby & Zhang (2024) - <em>BeyondPixels: A Comprehensive Review of the Evolution of Neural Radiance Fields</em> (arXiv).</li>
                                <li>[3] Jain et al. (2021) - <em>Putting NeRF on a Diet: Semantically Consistent Few-Shot View Synthesis</em> (ICCV).</li>
                                <li>[4] Niemeyer et al. (2022) - <em>RegNeRF: Regularizing Neural Radiance Fields for View Synthesis from Sparse Inputs</em> (CVPR).</li>
                                <li>[5] Tang et al. (2024) - <em>DreamGaussian: Generative Gaussian Splatting for Efficient 3D Content Creation</em> (ICLR).</li>
                                <li>[6] Luiten et al. (2023) - <em>Dynamic 3D Gaussians: Tracking by Persistent Dynamic View Synthesis</em> (arXiv).</li>
                            </ul>
                        </div>
                        <!-- Right Action Panel with glowing button -->
                        <div class="lg:col-span-5 flex flex-col justify-center items-center">
                            <div class="zoom-image-container relative group p-1 flex flex-col items-center">
                                <div class="absolute -inset-1 bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-yellow-300 rounded-xl blur-lg opacity-40 group-hover:opacity-100 transition duration-700"></div>
                                <a href="https://vectra.parsabe.com" target="_blank" class="relative px-10 py-5 bg-neutral-950 text-white rounded-lg block font-mono text-[11px] tracking-[0.25em] uppercase hover:text-cyan-400 transition-colors text-center w-72 border border-neutral-900/40">
                                    [ LAUNCH PORTAL CORE ]
                                </a>
                            </div>
                        </div>
                    </div>
                </section>

            </div>

        </div>
    </div>

    <!-- Lenis Smooth Scroll CDN -->
    <script src="https://cdn.jsdelivr.net/npm/lenis@1.1.20/dist/lenis.min.js"></script>

    <!-- KaTeX JS and Autorender CDN -->
    <script defer 
            src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js" 
            integrity="sha384-XjKyOOlGwcjNTAIQHIpgOno0Hl1YQqzUOEleOLALmuqehneUG+vnGctmUb0ZY0l8" 
            crossorigin="anonymous"></script>
    <script defer 
            src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js" 
            integrity="sha384-+VBxd3r6XgURycqtZ117nYw44OOcIax56Z4dCRWbxyPt0Koah1uHoK0o4+/RRE05" 
            crossorigin="anonymous" 
            onload="initializeKatex()"></script>

    <script>
        // Callback function to initialize KaTeX when auto-render loads
        function initializeKatex() {
            renderMathInElement(document.body, {
                delimiters: [
                    {left: "$$", right: "$$", display: true},
                    {left: "$", right: "$", display: false},
                    {left: "\\(", right: "\\)", display: false},
                    {left: "\\[", right: "\\]", display: true}
                ],
                throwOnError: false
            });
        }
    </script>
</body>

</html>
