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
            <span class="hidden sm:inline text-neutral-400">SATURN_PARALLAX: <span class="text-green-400 text-glow-cyan">SYS_READY</span></span>
            <div class="h-4 w-px bg-cyan-900/30 hidden sm:block"></div>
            <a href="/" class="px-2.5 py-1 rounded border border-cyan-500/20 hover:border-cyan-400/50 bg-cyan-950/10 text-cyan-400 hover:text-white transition-all text-glow-cyan">
                [ CORE APP ]
            </a>
        </div>
    </header>

    <!-- Floating Navigation dots for sections (Right Side) -->
    <nav class="fixed right-6 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-4 pointer-events-auto">
        <button onclick="scrollToSection('#hero-section')" class="nav-dot w-2 h-2 rounded-full border border-cyan-400 bg-cyan-400 shadow-[0_0_8px_#00f3ff] transition-all hover:scale-125"></button>
        <button onclick="scrollToSection('#foundational-fields')" class="nav-dot w-2 h-2 rounded-full border border-cyan-500/50 hover:bg-cyan-400 transition-all hover:scale-125"></button>
        <button onclick="scrollToSection('#methodology')" class="nav-dot w-2 h-2 rounded-full border border-fuchsia-500/50 hover:bg-fuchsia-400 transition-all hover:scale-125"></button>
        <button onclick="scrollToSection('#conclusion-section')" class="nav-dot w-2 h-2 rounded-full border border-yellow-500/50 hover:bg-yellow-400 transition-all hover:scale-125"></button>
    </nav>

    <!-- Main Scrollytelling container -->
    <main class="relative z-10 w-full min-h-screen">
        
        <!-- SECTION 1: HERO & ABSTRACT -->
        <section id="hero-section" class="pointer-events-none">
            <div class="w-full max-w-5xl px-6 md:px-12 flex flex-col justify-center items-start text-left floating-pane pointer-events-auto">
                <div class="font-mono text-[10px] text-cyan-400 tracking-[0.3em] uppercase mb-3 text-glow-cyan">// MASTER THESIS ORBITAL INDEX</div>
                
                <h1 class="font-mono uppercase text-3xl md:text-6xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-yellow-200 to-fuchsia-500 leading-tight mb-2">
                    Vectra: The Quarantine Matrix
                </h1>
                <h2 class="font-mono text-sm md:text-lg text-fuchsia-400 text-glow-magenta mb-6 font-semibold uppercase">
                    Constraining Neural Hallucinations in 3D Gaussian Environments
                </h2>
                
                <p class="leading-relaxed text-neutral-300 text-xs md:text-sm max-w-2xl mb-6 font-sans">
                    The hyper-accelerated rise of generative artificial intelligence is rewiring the rules of 3D content creation. Yet, seamlessly jacking everyday 2D inputs into fully interactive 3D constructs remains a bottleneck. We orchestrate a streamlined pipeline that fuses zero-shot semantic extraction, generative mesh synthesis, and web-based physics integration.
                </p>

                <div class="flex items-center gap-4 text-[10px] font-mono text-neutral-400 border-t border-neutral-900/50 pt-4 w-full max-w-md">
                    <div>AUTHOR: <span class="text-yellow-400 text-glow-yellow font-bold">PARSA BESHARAT</span></div>
                    <div class="text-neutral-700">|</div>
                    <div>TU BERGAKADEMIE FREIBERG</div>
                </div>
            </div>
        </section>

        <!-- SECTION 2: RELATED WORK & MATHEMATICAL Blueprints -->
        <section id="foundational-fields" class="pointer-events-none">
            <div class="w-full max-w-6xl px-6 md:px-12 grid grid-cols-1 md:grid-cols-12 gap-8 items-center floating-pane pointer-events-auto h-full max-h-[85vh]">
                
                <!-- Left Sidebar: Technical Selection Tabs -->
                <div class="md:col-span-3 flex flex-row md:flex-col gap-4 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 font-mono text-[10px] uppercase tracking-wider text-neutral-500 border-b md:border-b-0 md:border-r border-neutral-800/40 pr-4">
                    <button onclick="selectFormula(0)" id="f-tab-0" class="tab-btn active text-left py-1 hover:text-cyan-400 transition-colors">01 // Volume Rendering</button>
                    <button onclick="selectFormula(1)" id="f-tab-1" class="tab-btn text-left py-1 hover:text-cyan-400 transition-colors">02 // PSNR & SSIM</button>
                    <button onclick="selectFormula(2)" id="f-tab-2" class="tab-btn text-left py-1 hover:text-cyan-400 transition-colors">03 // Semantic Loss</button>
                    <button onclick="selectFormula(3)" id="f-tab-3" class="tab-btn text-left py-1 hover:text-cyan-400 transition-colors">04 // SDS & Density</button>
                    <button onclick="selectFormula(4)" id="f-tab-4" class="tab-btn text-left py-1 hover:text-cyan-400 transition-colors">05 // Rotational Loss</button>
                </div>

                <!-- Center Panel: LaTeX Math formulas + descriptive tags -->
                <div class="md:col-span-5 flex flex-col justify-center min-h-[300px]">
                    <div id="formula-detail-pane" class="transition-opacity duration-300">
                        <!-- Content injected via JS selectFormula() -->
                    </div>
                </div>

                <!-- Right Panel: Corresponding Figure with 3D Tilt reflection -->
                <div class="md:col-span-4 flex justify-center items-center">
                    <div id="formula-fig-container" class="card-tilt w-full max-w-[280px] bg-neutral-950/10 backdrop-blur-sm p-1 rounded-xl shadow-2xl transition-transform duration-500">
                        <div class="card-sheen"></div>
                        <img id="formula-fig" src="/img/1.png" alt="Mathematical Figure" class="w-full h-auto object-contain rounded-lg max-h-[220px]">
                        <div id="formula-fig-caption" class="font-mono text-[9px] text-neutral-400 mt-2 text-center">Figure Reference</div>
                    </div>
                </div>

            </div>
        </section>

        <!-- SECTION 3: METHODOLOGY & 3D PIPELINE -->
        <section id="methodology" class="pointer-events-none">
            <div class="w-full max-w-6xl px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center floating-pane pointer-events-auto h-full max-h-[85vh]">
                
                <!-- Left Panel: Scenarios overview -->
                <div class="lg:col-span-5 flex flex-col justify-center">
                    <div class="font-mono text-[10px] text-fuchsia-400 tracking-[0.3em] uppercase mb-3 text-glow-magenta">// SECTION_03 // KINEMATICS & PIPELINE</div>
                    <h2 class="font-mono uppercase text-xl md:text-3xl font-black text-fuchsia-300 mb-4 text-glow-magenta">Methodology & Pipeline</h2>
                    
                    <!-- Scenario Toggle Buttons -->
                    <div class="flex gap-3 mb-6 font-mono text-[9px]">
                        <button onclick="selectScenario('extract')" id="scen-btn-extract" class="px-3 py-1.5 rounded border border-cyan-500/20 hover:border-cyan-400 bg-cyan-950/10 text-cyan-400 active">Scenario 1: Extraction</button>
                        <button onclick="selectScenario('create')" id="scen-btn-create" class="px-3 py-1.5 rounded border border-fuchsia-500/20 hover:border-fuchsia-400 bg-fuchsia-950/10 text-fuchsia-400">Scenario 2: Creation</button>
                    </div>

                    <div id="scenario-detail" class="text-xs md:text-sm text-neutral-300 leading-relaxed space-y-3 font-sans">
                        <!-- Content dynamically loaded via JS selectScenario() -->
                    </div>
                </div>

                <!-- Right Panel: SVG Animated Flowchart Grid (Visual Flow of DBSE & Forging) -->
                <div class="lg:col-span-7 flex flex-col justify-center items-center">
                    <div class="w-full max-w-lg bg-neutral-950/15 backdrop-blur-sm p-4 rounded-2xl relative font-mono text-[9px] text-neutral-400">
                        <div class="text-center text-glow-cyan text-[10px] uppercase font-bold tracking-widest mb-4">Vectra Spatial Processing Map</div>
                        
                        <!-- Animated SVG Flowchart -->
                        <div class="relative w-full h-[220px]">
                            <svg class="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                                <!-- Definitions for glowing gradients -->
                                <defs>
                                    <linearGradient id="cyan-glow" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stop-color="#00f3ff" />
                                        <stop offset="100%" stop-color="#ff00ff" />
                                    </linearGradient>
                                </defs>
                                
                                <!-- Connecting lines between pipeline nodes -->
                                <path id="flow-path-1" d="M 60,70 L 160,70" stroke="url(#cyan-glow)" stroke-width="1.5" fill="none" class="flow-line" />
                                <path id="flow-path-2" d="M 230,70 L 320,70" stroke="url(#cyan-glow)" stroke-width="1.5" fill="none" class="flow-line" />
                                <path id="flow-path-3" d="M 390,70 L 390,140" stroke="url(#cyan-glow)" stroke-width="1.5" fill="none" class="flow-line" />
                                <path id="flow-path-4" d="M 340,150 L 160,150" stroke="url(#cyan-glow)" stroke-width="1.5" fill="none" class="flow-line" />
                                <path id="flow-path-5" d="M 90,150 L 90,105" stroke="url(#cyan-glow)" stroke-width="1.5" fill="none" class="flow-line" />

                                <!-- Flowchart Nodes -->
                                <!-- Node 1: Input -->
                                <g id="node-input" class="cursor-pointer">
                                    <rect x="10" y="50" width="100" height="40" rx="8" fill="#020204" stroke="#00f3ff" stroke-width="1" stroke-opacity="0.3" />
                                    <text x="60" y="74" fill="#00f3ff" text-anchor="middle" font-weight="bold">INPUT SOURCE</text>
                                </g>

                                <!-- Node 2: Segmenter -->
                                <g id="node-segment" class="cursor-pointer">
                                    <rect x="140" y="50" width="110" height="40" rx="8" fill="#020204" stroke="#ff00ff" stroke-width="1" stroke-opacity="0.3" />
                                    <text x="195" y="74" fill="#ff00ff" text-anchor="middle" font-weight="bold">U2NET MASKING</text>
                                </g>

                                <!-- Node 3: Forge -->
                                <g id="node-forge" class="cursor-pointer">
                                    <rect x="290" y="50" width="110" height="40" rx="8" fill="#020204" stroke="#eab308" stroke-width="1" stroke-opacity="0.3" />
                                    <text x="345" y="74" fill="#eab308" text-anchor="middle" font-weight="bold">TRIPOSR FORGE</text>
                                </g>

                                <!-- Node 4: DBSE Excavation -->
                                <g id="node-dbse" class="cursor-pointer">
                                    <rect x="280" y="130" width="120" height="40" rx="8" fill="#020204" stroke="#00f3ff" stroke-width="1" stroke-opacity="0.3" />
                                    <text x="340" y="154" fill="#00f3ff" text-anchor="middle" font-weight="bold">DBSE HOLE-PUNCH</text>
                                </g>

                                <!-- Node 5: GLB Injection -->
                                <g id="node-inject" class="cursor-pointer">
                                    <rect x="110" y="130" width="110" height="40" rx="8" fill="#020204" stroke="#ff00ff" stroke-width="1" stroke-opacity="0.3" />
                                    <text x="165" y="154" fill="#ff00ff" text-anchor="middle" font-weight="bold">GLB INJECTION</text>
                                </g>
                            </svg>
                        </div>
                        
                        <!-- Flow Nodes Legend overlay details -->
                        <div id="flow-node-details" class="p-3 bg-black/45 rounded-lg border border-neutral-900/30 text-[9px] leading-relaxed text-neutral-400 mt-2">
                            Hover over any node in the processing loop above to inspect telemetry variables.
                        </div>
                    </div>
                </div>

            </div>
        </section>

        <!-- SECTION 4: CONCLUSION & LINK -->
        <section id="conclusion-section" class="pointer-events-none">
            <div class="w-full max-w-4xl px-6 md:px-12 flex flex-col justify-center items-center text-center floating-pane pointer-events-auto">
                <div class="font-mono text-[10px] text-yellow-400 tracking-[0.3em] uppercase mb-4 text-glow-yellow">// SECTION_04 // SECURITY_SAFEGUARDS</div>
                
                <h2 class="font-mono uppercase text-3xl md:text-5xl font-black text-white mb-6">
                    Applied AI Security Frameworks
                </h2>
                
                <p class="leading-relaxed text-neutral-300 text-xs md:text-sm max-w-xl mb-10 font-sans">
                    By strictly separating WebGL visual terminals from local tensor computation architectures, Vectra guarantees real-time kinematic stability. Decoupled asynchronous clients prevent system-wide memory blockages and isolate neural hallucinations, shielding user computing envelopes from backend rendering failures.
                </p>

                <!-- sleek glowing CTA link -->
                <div class="relative group pointer-events-auto">
                    <div class="absolute -inset-0.5 bg-gradient-to-r from-cyan-400 to-fuchsia-500 rounded-lg blur opacity-45 group-hover:opacity-100 transition duration-500"></div>
                    <a href="https://vectra.parsabe.com" target="_blank" class="relative px-8 py-4 bg-neutral-950 text-white rounded-lg block font-mono text-xs tracking-widest uppercase hover:text-cyan-400 transition-colors">
                        [ LAUNCH SPATIAL_CORE APP ]
                    </a>
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
