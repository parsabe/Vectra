<!DOCTYPE html>
<html lang="en" class="scroll-smooth">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vectra: The Quarantine Matrix — Scroll Presentation</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <!-- Google Fonts for High-End Technical Typography -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;700;800&family=Orbitron:wght@600;800;900&display=swap" rel="stylesheet">

    <!-- KaTeX CSS with SRI verification -->
    <link rel="stylesheet" 
          href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" 
          integrity="sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV" 
          crossorigin="anonymous">

    <!-- Lenis Smooth Scroll CSS -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/lenis@1.1.20/dist/lenis.css">

    <!-- Compiled assets via Laravel Vite -->
    @vite(['resources/css/app.css', 'resources/js/presentation.js'])

    <style>
        /* CSS Snap Scrolling on HTML and Body */
        html {
            scroll-snap-type: y mandatory;
            scroll-behavior: smooth;
            overflow-y: scroll;
            height: 100vh;
            background-color: #020204;
        }

        body {
            height: auto !important;
            overflow-y: visible !important;
            overflow-x: hidden !important;
            margin: 0;
            padding: 0;
        }

        /* 100vh full screen slides */
        section {
            scroll-snap-align: start;
            scroll-snap-stop: always;
            height: 100vh;
            width: 100vw;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            overflow: hidden;
            box-sizing: border-box;
        }

        /* Borderless typography & glow styles */
        .text-glow-cyan {
            text-shadow: 0 0 10px rgba(0, 243, 255, 0.7);
        }
        .text-glow-magenta {
            text-shadow: 0 0 10px rgba(240, 46, 170, 0.7);
        }
        .text-glow-yellow {
            text-shadow: 0 0 10px rgba(234, 179, 8, 0.7);
        }
        
        /* Transparent floating container text shadow for readability */
        .floating-pane {
            text-shadow: 0 2px 12px rgba(0, 0, 0, 0.95);
        }

        /* Technical Interactive Tabs */
        .tab-btn {
            position: relative;
            transition: all 0.3s ease;
        }
        .tab-btn.active {
            color: #00f3ff;
            text-shadow: 0 0 8px rgba(0, 243, 255, 0.6);
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

        /* SVG animated data flow lines */
        .flow-line {
            stroke-dasharray: 8;
            animation: flowDash 20s linear infinite;
        }
        @keyframes flowDash {
            to {
                stroke-dashoffset: -1000;
            }
        }
        
        /* Floating Moon styling for timeline visual cues */
        .satellite-dot {
            transition: transform 0.15s ease-out;
            will-change: transform;
        }

        /* Nav Dots */
        .nav-dot {
            transition: all 0.3s ease;
        }
        .nav-dot.active {
            background-color: #00f3ff;
            border-color: #00f3ff;
            box-shadow: 0 0 10px #00f3ff;
            transform: scale(1.3);
        }
    </style>
</head>

<body class="bg-black text-neutral-200 select-none overflow-x-hidden font-sans relative">

    <!-- Fixed WebGL Saturn Canvas behind UI -->
    <canvas id="webgl-canvas" class="fixed inset-0 w-screen h-screen z-[-1] bg-black block outline-none"></canvas>

    <!-- Scroll Progress Indicator Bar at the Top -->
    <div class="fixed top-0 left-0 w-full h-1 z-50 bg-neutral-950">
        <div id="scroll-progress" class="h-full bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-yellow-300 shadow-[0_0_10px_#00f3ff] w-0 transition-all duration-100 ease-out"></div>
    </div>

    <!-- Floating Cyberpunk Header Panel -->
    <header class="fixed top-4 left-4 right-4 z-40 bg-neutral-950/40 backdrop-blur-md rounded-xl p-4 flex justify-between items-center pointer-events-auto">
        <div class="flex items-center gap-3">
            <div class="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping shadow-[0_0_8px_#00f3ff]"></div>
            <a href="/" class="text-glow-cyan font-mono font-bold tracking-widest text-xs md:text-sm hover:text-cyan-300 transition-colors">
                VECTRA // THESIS_DECK
            </a>
        </div>
        <div class="flex items-center gap-4 text-[10px] font-mono">
            <span class="hidden sm:inline text-neutral-400">SATURN_PARALLAX: <span class="text-green-400 text-glow-cyan">ACTIVE</span></span>
            <div class="h-4 w-px bg-cyan-900/30 hidden sm:block"></div>
            <a href="/" class="px-2.5 py-1 rounded border border-cyan-500/20 hover:border-cyan-400/50 bg-cyan-950/10 text-cyan-400 hover:text-white transition-all text-glow-cyan">
                [ RETURN TO CORE ]
            </a>
        </div>
    </header>

    <!-- Floating Navigation dots for sections (Right Side) -->
    <nav class="fixed right-6 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-4 pointer-events-auto">
        <button onclick="scrollToSection('#hero-section')" id="dot-0" class="nav-dot w-2 h-2 rounded-full border border-cyan-500/50 bg-transparent hover:bg-cyan-400 active"></button>
        <button onclick="scrollToSection('#related-work-section')" id="dot-1" class="nav-dot w-2 h-2 rounded-full border border-cyan-500/50 bg-transparent hover:bg-cyan-400"></button>
        <button onclick="scrollToSection('#methodology-section')" id="dot-2" class="nav-dot w-2 h-2 rounded-full border border-cyan-500/50 bg-transparent hover:bg-cyan-400"></button>
        <button onclick="scrollToSection('#experiments-section')" id="dot-3" class="nav-dot w-2 h-2 rounded-full border border-cyan-500/50 bg-transparent hover:bg-cyan-400"></button>
        <button onclick="scrollToSection('#discussion-section')" id="dot-4" class="nav-dot w-2 h-2 rounded-full border border-cyan-500/50 bg-transparent hover:bg-cyan-400"></button>
        <button onclick="scrollToSection('#conclusion-section')" id="dot-5" class="nav-dot w-2 h-2 rounded-full border border-cyan-500/50 bg-transparent hover:bg-cyan-400"></button>
        <button onclick="scrollToSection('#references-section')" id="dot-6" class="nav-dot w-2 h-2 rounded-full border border-cyan-500/50 bg-transparent hover:bg-cyan-400"></button>
    </nav>

    <!-- Main Scrollytelling container -->
    <main class="relative z-10 w-full min-h-screen">
        
        <!-- SECTION 1: HERO & ABSTRACT -->
        <section id="hero-section" class="pointer-events-none">
            <div class="w-full max-w-6xl px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center floating-pane pointer-events-auto h-full max-h-[85vh]">
                <!-- Left text content -->
                <div class="lg:col-span-7 flex flex-col justify-center text-left">
                    <div class="font-mono text-[10px] text-cyan-400 tracking-[0.3em] uppercase mb-3 text-glow-cyan">// INTRODUCTION & ABSTRACT</div>
                    <h1 class="font-mono uppercase text-3xl md:text-5xl lg:text-6xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-yellow-200 to-fuchsia-500 leading-tight mb-2">
                        Vectra: The Quarantine Matrix
                    </h1>
                    <h2 class="font-mono text-xs md:text-base text-fuchsia-400 text-glow-magenta mb-4 font-semibold uppercase">
                        Constraining Neural Hallucinations in 3D Gaussian Environments
                    </h2>
                    <p class="leading-relaxed text-neutral-300 text-xs md:text-sm mb-6 font-sans">
                        The hyper-accelerated rise of generative artificial intelligence is rewiring the rules of 3D content creation. Yet, seamlessly jacking everyday 2D inputs into fully interactive 3D constructs remains a bottleneck. We orchestrate a streamlined pipeline that fuses zero-shot semantic extraction, generative mesh synthesis, and web-based physics integration.
                    </p>
                    <div class="flex items-center gap-3 text-[9px] font-mono text-neutral-400 border-t border-neutral-900/50 pt-3">
                        <div>AUTHOR: <span class="text-yellow-400 text-glow-yellow font-bold">PARSA BESHARAT</span></div>
                        <div class="text-neutral-700">|</div>
                        <div>TU BERGAKADEMIE FREIBERG</div>
                    </div>
                </div>
                <!-- Right zoomed figure image -->
                <div class="lg:col-span-5 flex justify-center items-center">
                    <div class="zoom-image-container relative overflow-hidden rounded-2xl bg-neutral-950/10 p-2 shadow-2xl transition-transform duration-500">
                        <img src="/img/logo.png" alt="Figure 1: Vectra Logo" class="zoom-image w-full max-w-[380px] max-h-[280px] lg:max-w-[420px] lg:max-h-[340px] object-contain rounded-xl">
                        <div class="font-mono text-[8px] text-neutral-400 mt-2 text-center">Figure 1: Vectra Logo</div>
                    </div>
                </div>
            </div>
        </section>

        <!-- SECTION 2: RELATED WORK & MATHEMATICAL Blueprints -->
        <section id="related-work-section" class="pointer-events-none">
            <div class="w-full max-w-6xl px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center floating-pane pointer-events-auto h-full max-h-[85vh]">
                <!-- Left Sidebar: Technical Selection Tabs -->
                <div class="lg:col-span-3 flex flex-row lg:flex-col gap-3 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 font-mono text-[9px] uppercase tracking-wider text-neutral-500 border-b lg:border-b-0 lg:border-r border-neutral-800/40 pr-3">
                    <button onclick="selectFormula(0)" id="f-tab-0" class="tab-btn active text-left py-1 hover:text-cyan-400 transition-colors">01 // Volume Rendering</button>
                    <button onclick="selectFormula(1)" id="f-tab-1" class="tab-btn text-left py-1 hover:text-cyan-400 transition-colors">02 // PSNR & SSIM</button>
                    <button onclick="selectFormula(2)" id="f-tab-2" class="tab-btn text-left py-1 hover:text-cyan-400 transition-colors">03 // Semantic Loss</button>
                    <button onclick="selectFormula(3)" id="f-tab-3" class="tab-btn text-left py-1 hover:text-cyan-400 transition-colors">04 // SDS & Density</button>
                    <button onclick="selectFormula(4)" id="f-tab-4" class="tab-btn text-left py-1 hover:text-cyan-400 transition-colors">05 // Rotational Loss</button>
                </div>
                <!-- Center Panel: LaTeX Math formulas -->
                <div class="lg:col-span-5 flex flex-col justify-center min-h-[250px]">
                    <div id="formula-detail-pane" class="transition-opacity duration-300">
                        <!-- Content injected via JS selectFormula() -->
                    </div>
                </div>
                <!-- Right Panel: Corresponding Figure with Zoom effect -->
                <div class="lg:col-span-4 flex justify-center items-center">
                    <div id="formula-fig-container" class="zoom-image-container w-full max-w-[380px] bg-neutral-950/10 p-2 rounded-2xl shadow-2xl transition-transform duration-500">
                        <img id="formula-fig" src="/img/1.png" alt="Mathematical Figure" class="zoom-image w-full h-auto object-contain rounded-xl max-h-[260px]">
                        <div id="formula-fig-caption" class="font-mono text-[8px] text-neutral-400 mt-2 text-center">Figure Reference</div>
                    </div>
                </div>
            </div>
        </section>

        <!-- SECTION 3: METHODOLOGY & 3D PIPELINE -->
        <section id="methodology-section" class="pointer-events-none">
            <div class="w-full max-w-6xl px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center floating-pane pointer-events-auto h-full max-h-[85vh]">
                <!-- Left Panel: Scenarios overview -->
                <div class="lg:col-span-5 flex flex-col justify-center">
                    <div class="font-mono text-[10px] text-fuchsia-400 tracking-[0.3em] uppercase mb-2 text-glow-magenta">// SECTION_03 // KINEMATICS & PIPELINE</div>
                    <h2 class="font-mono uppercase text-xl md:text-2xl font-black text-fuchsia-300 mb-3 text-glow-magenta">Methodology & Pipeline</h2>
                    <!-- Scenario Toggle Buttons -->
                    <div class="flex gap-3 mb-4 font-mono text-[9px]">
                        <button onclick="selectScenario('extract')" id="scen-btn-extract" class="px-2.5 py-1 rounded border border-cyan-500/20 hover:border-cyan-400 bg-cyan-950/10 text-cyan-400 active">Scenario 1: Extraction</button>
                        <button onclick="selectScenario('create')" id="scen-btn-create" class="px-2.5 py-1 rounded border border-fuchsia-500/20 hover:border-fuchsia-400 bg-fuchsia-950/10 text-fuchsia-400">Scenario 2: Creation</button>
                    </div>
                    <div id="scenario-detail" class="text-xs md:text-sm text-neutral-300 leading-relaxed space-y-2 font-sans min-h-[140px]">
                        <!-- Content dynamically loaded via JS selectScenario() -->
                    </div>
                </div>
                <!-- Right Panel: SVG Animated Flowchart Grid -->
                <div class="lg:col-span-7 flex flex-col justify-center items-center">
                    <div class="zoom-image-container w-full max-w-lg bg-neutral-950/15 p-4 rounded-2xl relative font-mono text-[8px] text-neutral-400">
                        <div class="text-center text-glow-cyan text-[9px] uppercase font-bold tracking-widest mb-3">Vectra Spatial Processing Map</div>
                        <div class="relative w-full h-[180px]">
                            <svg class="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                                <defs>
                                    <linearGradient id="cyan-glow" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stop-color="#00f3ff" />
                                        <stop offset="100%" stop-color="#ff00ff" />
                                    </linearGradient>
                                </defs>
                                <path id="flow-path-1" d="M 60,60 L 160,60" stroke="url(#cyan-glow)" stroke-width="1.5" fill="none" class="flow-line" />
                                <path id="flow-path-2" d="M 230,60 L 320,60" stroke="url(#cyan-glow)" stroke-width="1.5" fill="none" class="flow-line" />
                                <path id="flow-path-3" d="M 390,60 L 390,120" stroke="url(#cyan-glow)" stroke-width="1.5" fill="none" class="flow-line" />
                                <path id="flow-path-4" d="M 340,130 L 160,130" stroke="url(#cyan-glow)" stroke-width="1.5" fill="none" class="flow-line" />
                                <path id="flow-path-5" d="M 90,130 L 90,90" stroke="url(#cyan-glow)" stroke-width="1.5" fill="none" class="flow-line" />
                                <g id="node-input" class="cursor-pointer">
                                    <rect x="10" y="40" width="100" height="35" rx="6" fill="#020204" stroke="#00f3ff" stroke-width="1" stroke-opacity="0.3" />
                                    <text x="60" y="61" fill="#00f3ff" text-anchor="middle" font-weight="bold">INPUT SOURCE</text>
                                </g>
                                <g id="node-segment" class="cursor-pointer">
                                    <rect x="140" y="40" width="110" height="35" rx="6" fill="#020204" stroke="#ff00ff" stroke-width="1" stroke-opacity="0.3" />
                                    <text x="195" y="61" fill="#ff00ff" text-anchor="middle" font-weight="bold">U2NET MASKING</text>
                                </g>
                                <g id="node-forge" class="cursor-pointer">
                                    <rect x="290" y="40" width="110" height="35" rx="6" fill="#020204" stroke="#eab308" stroke-width="1" stroke-opacity="0.3" />
                                    <text x="345" y="61" fill="#eab308" text-anchor="middle" font-weight="bold">TRIPOSR FORGE</text>
                                </g>
                                <g id="node-dbse" class="cursor-pointer">
                                    <rect x="280" y="110" width="120" height="35" rx="6" fill="#020204" stroke="#00f3ff" stroke-width="1" stroke-opacity="0.3" />
                                    <text x="340" y="131" fill="#00f3ff" text-anchor="middle" font-weight="bold">DBSE HOLE-PUNCH</text>
                                </g>
                                <g id="node-inject" class="cursor-pointer">
                                    <rect x="110" y="110" width="110" height="35" rx="6" fill="#020204" stroke="#ff00ff" stroke-width="1" stroke-opacity="0.3" />
                                    <text x="165" y="131" fill="#ff00ff" text-anchor="middle" font-weight="bold">GLB INJECTION</text>
                                </g>
                            </svg>
                        </div>
                        <div id="flow-node-details" class="p-2.5 bg-black/45 rounded-lg border border-neutral-900/30 text-[8px] leading-relaxed text-neutral-400 mt-2">
                            Hover over any node in the processing loop above to inspect telemetry variables.
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- SECTION 4: EXPERIMENTAL ANALYSIS -->
        <section id="experiments-section" class="pointer-events-none">
            <div class="w-full max-w-6xl px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center floating-pane pointer-events-auto h-full max-h-[85vh]">
                <!-- Left text content -->
                <div class="lg:col-span-7 flex flex-col justify-center text-left">
                    <div class="font-mono text-[10px] text-yellow-400 tracking-[0.3em] uppercase mb-2 text-glow-yellow">// SECTION_04 // PERFORMANCE TELEMETRY</div>
                    <h2 class="font-mono uppercase text-xl md:text-3xl font-black text-yellow-300 mb-4 text-glow-yellow">
                        Experiments & System Evaluation
                    </h2>
                    <p class="leading-relaxed text-neutral-300 text-xs md:text-sm mb-4 font-sans">
                        Tested on localized Nvidia RTX 4060 graphics chips limited strictly to a consumer budget of <strong>8GB VRAM</strong>. Rendering speeds and memory logs are analyzed dynamically.
                    </p>
                    <ul class="font-mono text-[10px] md:text-xs text-neutral-400 space-y-2 mb-4">
                        <li><span class="text-yellow-400 font-bold">> VIEWPORT STABILITY:</span> Stable <span class="text-yellow-300 font-bold">60 FPS</span> idle, drops briefly to <span class="text-yellow-300 font-bold">30 FPS</span> during active inference.</li>
                        <li><span class="text-yellow-400 font-bold">> PIPELINE LATENCY:</span> Average round-trip compilation and injection clocks <span class="text-yellow-300 font-bold">120.2 seconds</span>.</li>
                        <li><span class="text-yellow-400 font-bold">> GPU MEMORY PEAK:</span> Memory allocation remains strictly locked under the limit, peaking at <span class="text-yellow-300 font-bold">7.8 GB</span>.</li>
                    </ul>
                </div>
                <!-- Right zoomed figure image -->
                <div class="lg:col-span-5 flex justify-center items-center">
                    <div class="zoom-image-container relative overflow-hidden rounded-2xl bg-neutral-950/10 p-2 shadow-2xl transition-transform duration-500">
                        <img src="/img/10.png" alt="Figure 10: High-Level Topology" class="zoom-image w-full max-w-[380px] max-h-[280px] lg:max-w-[420px] lg:max-h-[340px] object-contain rounded-xl">
                        <div class="font-mono text-[8px] text-neutral-400 mt-2 text-center">Figure 10: High-Level Topology</div>
                    </div>
                </div>
            </div>
        </section>

        <!-- SECTION 5: DISCUSSION & LIMITATIONS -->
        <section id="discussion-section" class="pointer-events-none">
            <div class="w-full max-w-6xl px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center floating-pane pointer-events-auto h-full max-h-[85vh]">
                <!-- Left text content -->
                <div class="lg:col-span-7 flex flex-col justify-center text-left">
                    <div class="font-mono text-[10px] text-fuchsia-400 tracking-[0.3em] uppercase mb-2 text-glow-magenta">// SECTION_05 // DISCUSSION & LIMITATIONS</div>
                    <h2 class="font-mono uppercase text-xl md:text-3xl font-black text-fuchsia-300 mb-4 text-glow-magenta">
                        Discussion & Limitations
                    </h2>
                    <p class="leading-relaxed text-neutral-300 text-xs md:text-sm mb-4 font-sans">
                        Edge computing environments introduce hardware thresholds. Operating SDXL-Lightning and TripoSR sequentially prevents Out-Of-Memory (OOM) kernel crashes but forces continuous model loading latency.
                    </p>
                    <ul class="font-mono text-[10px] md:text-xs text-neutral-400 space-y-2 mb-4">
                        <li><span class="text-fuchsia-400 font-bold">> SEGMENTATION FRAGILITY:</span> Unisolated backgrounds in U2Net cause severe <span class="text-fuchsia-300 font-bold">"blob artifacts"</span>.</li>
                        <li><span class="text-fuchsia-400 font-bold">> COLLISION BOUNDS:</span> Physical middleware limits dynamic meshes to rigid bounding box colliders.</li>
                        <li><span class="text-fuchsia-400 font-bold">> DISTRIBUTED UPGRADE:</span> Future work offloads operations to CUDA-streamed High Performance Computing (HPC) nodes.</li>
                    </ul>
                </div>
                <!-- Right zoomed figure image -->
                <div class="lg:col-span-5 flex justify-center items-center">
                    <div class="zoom-image-container relative overflow-hidden rounded-2xl bg-neutral-950/10 p-2 shadow-2xl transition-transform duration-500">
                        <img src="/img/13.png" alt="Figure 14: Sequential VRAM Orchestration" class="zoom-image w-full max-w-[380px] max-h-[280px] lg:max-w-[420px] lg:max-h-[340px] object-contain rounded-xl">
                        <div class="font-mono text-[8px] text-neutral-400 mt-2 text-center">Figure 14: Sequential VRAM Orchestration</div>
                    </div>
                </div>
            </div>
        </section>

        <!-- SECTION 6: CONCLUSION -->
        <section id="conclusion-section" class="pointer-events-none">
            <div class="w-full max-w-6xl px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center floating-pane pointer-events-auto h-full max-h-[85vh]">
                <!-- Left text content -->
                <div class="lg:col-span-7 flex flex-col justify-center text-left">
                    <div class="font-mono text-[10px] text-cyan-400 tracking-[0.3em] uppercase mb-2 text-glow-cyan">// SECTION_06 // CONCLUSION SUMMARY</div>
                    <h2 class="font-mono uppercase text-xl md:text-3xl font-black text-cyan-300 mb-4 text-glow-cyan">
                        Conclusion
                    </h2>
                    <p class="leading-relaxed text-neutral-300 text-xs md:text-sm mb-4 font-sans">
                        Generative AI and spatial computing architectures must converge. By utilizing decoupled asynchronous pipelines and non-destructive shader culling, Vectra successfully spawns textured dynamic rigidbodies directly inside complex 3D Gaussian hallways.
                    </p>
                    <p class="leading-relaxed text-neutral-300 text-xs md:text-sm font-sans">
                        Ultimately, securing digital twins requires integrating definitive mathematical safeguards (like Control Barrier Functions) directly at the rendering level to ensure absolute alignment within digital infrastructures.
                    </p>
                </div>
                <!-- Right zoomed figure image -->
                <div class="lg:col-span-5 flex justify-center items-center">
                    <div class="zoom-image-container relative overflow-hidden rounded-2xl bg-neutral-950/10 p-2 shadow-2xl transition-transform duration-500">
                        <img src="/img/11.png" alt="Figure 11: Vectra Protocol Decoupled Architecture" class="zoom-image w-full max-w-[380px] max-h-[280px] lg:max-w-[420px] lg:max-h-[340px] object-contain rounded-xl">
                        <div class="font-mono text-[8px] text-neutral-400 mt-2 text-center">Figure 11: Vectra Protocol Decoupled Architecture</div>
                    </div>
                </div>
            </div>
        </section>

        <!-- SECTION 7: REFERENCES & LINK -->
        <section id="references-section" class="pointer-events-none">
            <div class="w-full max-w-6xl px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center floating-pane pointer-events-auto h-full max-h-[85vh]">
                <!-- Left text content -->
                <div class="lg:col-span-7 flex flex-col justify-center text-left">
                    <div class="font-mono text-[10px] text-yellow-400 tracking-[0.3em] uppercase mb-3 text-glow-yellow">// SECTION_07 // CITATIONS & LINK</div>
                    <h2 class="font-mono uppercase text-xl md:text-2xl font-black text-white mb-4">
                        References & Launch
                    </h2>
                    <ul class="font-mono text-[9px] text-neutral-400 space-y-2 mb-6 max-h-[220px] overflow-y-auto pr-2">
                        <li>[1] Mildenhall et al. (2020) - <em>NeRF: Representing Scenes as Neural Radiance Fields for View Synthesis</em> (ECCV).</li>
                        <li>[2] Jain et al. (2021) - <em>Putting NeRF on a Diet: Semantically Consistent Few-Shot View Synthesis</em> (ICCV).</li>
                        <li>[3] Tang et al. (2024) - <em>DreamGaussian: Generative Gaussian Splatting for Efficient 3D Content Creation</em> (ICLR).</li>
                        <li>[4] Luiten et al. (2023) - <em>Dynamic 3D Gaussians: Tracking by Persistent Dynamic View Synthesis</em> (arXiv).</li>
                        <li>[5] Niemeyer et al. (2022) - <em>RegNeRF: Regularizing Neural Radiance Fields from Sparse Inputs</em> (CVPR).</li>
                    </ul>
                </div>
                <!-- Right Action Panel with Zoom effect -->
                <div class="lg:col-span-5 flex flex-col justify-center items-center">
                    <div class="zoom-image-container relative group p-1 flex flex-col items-center">
                        <div class="absolute -inset-0.5 bg-gradient-to-r from-cyan-400 to-fuchsia-500 rounded-lg blur opacity-45 group-hover:opacity-100 transition duration-500"></div>
                        <a href="https://vectra.parsabe.com" target="_blank" class="relative px-8 py-4 bg-neutral-950 text-white rounded-lg block font-mono text-xs tracking-widest uppercase hover:text-cyan-400 transition-colors text-center w-64">
                            [ LAUNCH APPLIED_CORE ]
                        </a>
                    </div>
                </div>
            </div>
        </section>
        
    </main>

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
