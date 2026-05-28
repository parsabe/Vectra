<!DOCTYPE html>
<html lang="en" class="scroll-smooth">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vectra: The Quarantine Matrix — Scroll Presentation</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <!-- Google Fonts for Cyberpunk Aesthetic -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;700;800&family=Orbitron:wght@600;800;900&display=swap" rel="stylesheet">

    <!-- KaTeX CSS for beautiful math equations with SRI verification -->
    <link rel="stylesheet" 
          href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" 
          integrity="sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV" 
          crossorigin="anonymous">

    <!-- Stylesheets via Laravel Vite -->
    @vite(['resources/css/app.css', 'resources/js/presentation.js'])

    <style>
        /* Cyberpunk scrollbar and neon classes */
        ::-webkit-scrollbar {
            width: 8px;
        }
        ::-webkit-scrollbar-track {
            background: #020204;
        }
        ::-webkit-scrollbar-thumb {
            background: #111827;
            border: 2px solid #00f3ff;
            border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: #00f3ff;
            box-shadow: 0 0 10px #00f3ff;
        }
        
        .text-glow-cyan {
            text-shadow: 0 0 8px rgba(0, 243, 255, 0.6);
        }
        .text-glow-magenta {
            text-shadow: 0 0 8px rgba(240, 46, 170, 0.6);
        }
        .text-glow-yellow {
            text-shadow: 0 0 8px rgba(234, 179, 8, 0.6);
        }
        .box-glow-cyan {
            box-shadow: 0 0 15px rgba(0, 243, 255, 0.15);
        }
        .box-glow-magenta {
            box-shadow: 0 0 15px rgba(240, 46, 170, 0.15);
        }
    </style>
</head>

<body class="bg-black text-neutral-200 select-none overflow-x-hidden font-sans relative">

    <!-- Fixed full screen Three.js WebGL canvas sitting behind overlays -->
    <canvas id="webgl-canvas" class="fixed inset-0 w-screen h-screen z-[-1] bg-black block outline-none"></canvas>

    <!-- Scroll Progress Indicator Bar at the Top -->
    <div class="fixed top-0 left-0 w-full h-1 z-50 bg-neutral-950">
        <div id="scroll-progress" class="h-full bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-yellow-300 shadow-[0_0_10px_#00f3ff] w-0 transition-all duration-100 ease-out"></div>
    </div>

    <!-- Floating Cyberpunk Header Panel -->
    <header class="fixed top-4 left-4 right-4 z-40 bg-neutral-950/75 backdrop-blur-xl border border-cyan-900/30 rounded-xl p-4 flex justify-between items-center shadow-2xl">
        <div class="flex items-center gap-3">
            <div class="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping shadow-[0_0_8px_#00f3ff]"></div>
            <a href="/" class="text-glow-cyan font-mono font-bold tracking-widest text-sm md:text-base hover:text-cyan-300 transition-colors">
                VECTRA // THESIS_ENGINE
            </a>
        </div>
        <div class="flex items-center gap-4 text-xs font-mono">
            <span class="hidden sm:inline text-neutral-400">STATUS: <span class="text-green-400 text-glow-cyan">SYS_SYNC</span></span>
            <div class="h-4 w-px bg-cyan-900/50 hidden sm:block"></div>
            <a href="/" class="px-3 py-1.5 rounded border border-cyan-500/20 hover:border-cyan-400/60 bg-cyan-950/30 text-cyan-400 hover:text-white transition-all text-glow-cyan font-bold">
                [ RETURN TO CORE ]
            </a>
        </div>
    </header>

    <!-- Floating Navigation dots for sections (Right Side) -->
    <nav class="fixed right-6 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-4">
        <a href="#hero-section" class="nav-dot w-3 h-3 rounded-full border border-cyan-400 bg-cyan-400 shadow-[0_0_8px_#00f3ff] transition-all hover:scale-125" title="Hero & Abstract"></a>
        <a href="#foundational-fields" class="nav-dot w-3 h-3 rounded-full border border-cyan-500/50 hover:bg-cyan-400 transition-all hover:scale-125" title="Radiance Fields"></a>
        <a href="#semantic-consistency" class="nav-dot w-3 h-3 rounded-full border border-fuchsia-500/50 hover:bg-fuchsia-400 transition-all hover:scale-125" title="Semantic Consistency"></a>
        <a href="#gaussian-splatting" class="nav-dot w-3 h-3 rounded-full border border-yellow-500/50 hover:bg-yellow-400 transition-all hover:scale-125" title="Gaussian Splatting"></a>
        <a href="#methodology" class="nav-dot w-3 h-3 rounded-full border border-cyan-500/50 hover:bg-cyan-400 transition-all hover:scale-125" title="Vectra Methodology"></a>
    </nav>

    <!-- Main Scrollytelling content container -->
    <main class="relative z-10 w-full min-h-screen px-4 md:px-12 flex flex-col items-center justify-start pointer-events-none">
        
        <!-- SECTION 1: HERO & ABSTRACT -->
        <section id="hero-section" class="w-full max-w-4xl min-h-screen flex flex-col justify-center items-center py-24 mb-[130vh] pointer-events-auto">
            <div class="w-full bg-neutral-950/75 backdrop-blur-xl border border-cyan-500/20 hover:border-cyan-400/40 p-6 md:p-10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8),_0_0_20px_rgba(0,243,255,0.05)] transition-all duration-500">
                <div class="font-mono text-xs text-cyan-400 tracking-[0.3em] uppercase mb-4 text-glow-cyan">[ SECTION_01 // INTRODUCTORY_MATRIX ]</div>
                
                <h1 class="font-mono uppercase text-3xl md:text-5xl lg:text-6xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-yellow-200 to-fuchsia-500 leading-tight mb-3">
                    Vectra: The Quarantine Matrix
                </h1>
                <h2 class="font-mono text-base md:text-lg text-fuchsia-400 text-glow-magenta mb-6 font-semibold uppercase">
                    Constraining Neural Hallucinations in 3D Gaussian Environments
                </h2>
                
                <div class="flex items-center gap-3 border-y border-neutral-900 py-3 mb-8">
                    <span class="font-mono text-xs text-neutral-400">AUTHOR:</span>
                    <span class="font-mono text-xs text-yellow-400 text-glow-yellow font-bold uppercase tracking-wider">PARSA BESHARAT</span>
                    <span class="text-neutral-600">|</span>
                    <span class="font-mono text-[10px] text-neutral-400">Technische Universität Bergakademie Freiberg, Germany</span>
                </div>

                <!-- Figure 1: Vectra Logo -->
                <div class="mb-8 overflow-hidden rounded-xl border border-cyan-500/20 bg-neutral-950/50 p-2 shadow-inner group">
                    <img src="/img/logo.png" alt="Figure 1: Vectra Logo" class="w-full max-h-[350px] object-contain rounded-lg transition-transform duration-500 group-hover:scale-[1.02]">
                    <div class="font-mono text-[10px] text-neutral-500 mt-2 text-center">Figure 1: Vectra Logo</div>
                </div>

                <h3 class="font-mono text-sm text-cyan-400 font-bold uppercase mb-3 tracking-widest text-glow-cyan">// ABSTRACT</h3>
                <p class="leading-relaxed text-neutral-300 text-sm md:text-base mb-8">
                    The hyper-accelerated rise of generative artificial intelligence is rewiring the rules of 3D content creation. Yet, seamlessly jacking everyday 2D inputs into fully interactive 3D constructs remains a bottleneck. We orchestrate a streamlined pipeline that fuses zero-shot semantic extraction, generative mesh synthesis, and web-based physics integration.
                </p>

                <!-- Figure 2: Neural Radiance Field Scene Representation -->
                <div class="overflow-hidden rounded-xl border border-fuchsia-500/20 bg-neutral-950/50 p-2 shadow-inner group">
                    <img src="/img/1.png" alt="Figure 2: Neural Radiance Field Scene Representation" class="w-full max-h-[300px] object-contain rounded-lg transition-transform duration-500 group-hover:scale-[1.02]">
                    <div class="font-mono text-[10px] text-neutral-500 mt-2 text-center">Figure 2: Neural Radiance Field Scene Representation</div>
                </div>
            </div>
        </section>

        <!-- SECTION 2: FOUNDATIONAL RADIANCE FIELDS -->
        <section id="foundational-fields" class="w-full max-w-4xl min-h-screen flex flex-col justify-center items-center py-24 mb-[130vh] pointer-events-auto">
            <div class="w-full bg-neutral-950/75 backdrop-blur-xl border border-cyan-500/20 hover:border-cyan-400/40 p-6 md:p-10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8),_0_0_20px_rgba(0,243,255,0.05)] transition-all duration-500">
                <div class="font-mono text-xs text-cyan-400 tracking-[0.3em] uppercase mb-4 text-glow-cyan">[ SECTION_02 // RAD_FOUNDATION ]</div>
                
                <h2 class="font-mono uppercase text-2xl md:text-3xl font-bold tracking-wider text-cyan-300 mb-6 text-glow-cyan">
                    Foundational Radiance Fields
                </h2>

                <p class="leading-relaxed text-neutral-300 text-sm md:text-base mb-6">
                    The physical environment is modeled as a continuous 5D mathematical function. The predicted optical payload of a virtual camera ray is defined as:
                </p>

                <!-- Formula 1 -->
                <div class="my-6 p-4 rounded-xl bg-black/60 border border-cyan-900/30 overflow-x-auto">
                    <div class="font-mono text-[10px] text-cyan-500 mb-2">// Formula 1 (Volume Rendering)</div>
                    <div class="text-center py-2 text-glow-cyan">
                        $$\mathcal{C}(r)=\int_{t_{n}}^{t_{f}}T(t)\sigma(r(t))c(r(t),d)d~t$$
                    </div>
                </div>

                <p class="leading-relaxed text-neutral-300 text-sm md:text-base mb-6">
                    To benchmark the matrix, we utilize PSNR, SSIM, and LPIPS full-reference diagnostics:
                </p>

                <!-- Formulas 2 and 3 -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                    <div class="p-4 rounded-xl bg-black/60 border border-fuchsia-900/30 overflow-x-auto">
                        <div class="font-mono text-[10px] text-fuchsia-500 mb-2">// Formula 2 (PSNR)</div>
                        <div class="text-center py-2 text-glow-magenta">
                            $$PSNR(I)=10\cdot log_{10}(\frac{MAX(I)^{2}}{MSE(I)})$$
                        </div>
                    </div>
                    <div class="p-4 rounded-xl bg-black/60 border border-fuchsia-900/30 overflow-x-auto">
                        <div class="font-mono text-[10px] text-fuchsia-500 mb-2">// Formula 3 (SSIM)</div>
                        <div class="text-center py-2 text-glow-magenta">
                            $$SSIM(x, y) = \frac{(2\mu_x\mu_y + C_1)(2\sigma_{xy} + C_2)}{(\mu_x^2 + \mu_y^2 + C_1)(\sigma_x^2 + \sigma_y^2 + C_2)}$$
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- SECTION 3: SEMANTIC CONSISTENCY -->
        <section id="semantic-consistency" class="w-full max-w-4xl min-h-screen flex flex-col justify-center items-center py-24 mb-[130vh] pointer-events-auto">
            <div class="w-full bg-neutral-950/75 backdrop-blur-xl border border-fuchsia-500/20 hover:border-fuchsia-400/40 p-6 md:p-10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8),_0_0_20px_rgba(240,46,170,0.05)] transition-all duration-500">
                <div class="font-mono text-xs text-fuchsia-400 tracking-[0.3em] uppercase mb-4 text-glow-magenta">[ SECTION_03 // SEMANTIC_ALIGNMENT ]</div>
                
                <h2 class="font-mono uppercase text-2xl md:text-3xl font-bold tracking-wider text-fuchsia-300 mb-6 text-glow-magenta">
                    Semantic Consistency
                </h2>

                <p class="leading-relaxed text-neutral-300 text-sm md:text-base mb-6">
                    To combat catastrophic geometry collapse in sparse data environments, architectures like DietNeRF inject a semantic consistency loss constraint:
                </p>

                <!-- Formula 4 -->
                <div class="my-6 p-4 rounded-xl bg-black/60 border border-fuchsia-900/30 overflow-x-auto">
                    <div class="font-mono text-[10px] text-fuchsia-500 mb-2">// Formula 4 (Semantic Consistency)</div>
                    <div class="text-center py-2 text-glow-magenta">
                        $$\mathcal{H}_{SC,l_{2}}(I,\hat{I})=\frac{\lambda}{2}||\phi(I)-\phi(\hat{I})||_{2}^{2}$$
                    </div>
                </div>

                <!-- Figure 3 and Figure 5 -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    <div class="overflow-hidden rounded-xl border border-cyan-500/20 bg-neutral-950/50 p-2 shadow-inner group">
                        <img src="/img/3.png" alt="Figure 3: Novel Visual Feeds from solitary input" class="w-full max-h-[250px] object-contain rounded-lg transition-transform duration-500 group-hover:scale-[1.02]">
                        <div class="font-mono text-[10px] text-neutral-500 mt-2 text-center">Figure 3: Novel Visual Feeds from solitary input</div>
                    </div>
                    <div class="overflow-hidden rounded-xl border border-yellow-500/20 bg-neutral-950/50 p-2 shadow-inner group">
                        <img src="/img/6.png" alt="Figure 5: Evaluation Bias" class="w-full max-h-[250px] object-contain rounded-lg transition-transform duration-500 group-hover:scale-[1.02]">
                        <div class="font-mono text-[10px] text-neutral-500 mt-2 text-center">Figure 5: Evaluation Bias</div>
                    </div>
                </div>
            </div>
        </section>

        <!-- SECTION 4: GENERATIVE 3D GAUSSIAN SPLATTING -->
        <section id="gaussian-splatting" class="w-full max-w-4xl min-h-screen flex flex-col justify-center items-center py-24 mb-[130vh] pointer-events-auto">
            <div class="w-full bg-neutral-950/75 backdrop-blur-xl border border-yellow-500/20 hover:border-yellow-400/40 p-6 md:p-10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8),_0_0_20px_rgba(234,179,8,0.05)] transition-all duration-500">
                <div class="font-mono text-xs text-yellow-400 tracking-[0.3em] uppercase mb-4 text-glow-yellow">[ SECTION_04 // GAUSSIAN_SYNTHESIS ]</div>
                
                <h2 class="font-mono uppercase text-2xl md:text-3xl font-bold tracking-wider text-yellow-300 mb-6 text-glow-yellow">
                    Generative 3D Gaussian Splatting
                </h2>

                <p class="leading-relaxed text-neutral-300 text-sm md:text-base mb-6">
                    DreamGaussian deploys 3D Gaussians for pure generative tasks using Score Distillation Sampling (SDS):
                </p>

                <!-- Formula 5 and 6 -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                    <div class="p-4 rounded-xl bg-black/60 border border-yellow-900/30 overflow-x-auto">
                        <div class="font-mono text-[10px] text-yellow-500 mb-2">// Formula 5 (SDS Loss)</div>
                        <div class="text-center py-2 text-glow-yellow">
                            $$\nabla_{\Theta}\mathcal{L}_{SDS} = \mathbb{E}_{t,p,\epsilon}[w(t)(\epsilon_{\phi}(I_{RGB}^{p};t,\epsilon)-\epsilon)\frac{\partial I_{RGB}^{p}}{\partial\Theta}]$$
                        </div>
                    </div>
                    <div class="p-4 rounded-xl bg-black/60 border border-yellow-900/30 overflow-x-auto">
                        <div class="font-mono text-[10px] text-yellow-500 mb-2">// Formula 6 (Volumetric Density)</div>
                        <div class="text-center py-2 text-glow-yellow">
                            $$d(x)=\sum_{i}\alpha_{i}exp(-\frac{1}{2}(x-x_{i})^{T}\Sigma_{i}^{-1}(x-x_{i}))$$
                        </div>
                    </div>
                </div>

                <!-- Figure 7 -->
                <div class="overflow-hidden rounded-xl border border-yellow-500/20 bg-neutral-950/50 p-2 shadow-inner group mt-8">
                    <img src="/img/7.png" alt="Figure 7: Comparisons on Image-to-3D" class="w-full max-h-[300px] object-contain rounded-lg transition-transform duration-500 group-hover:scale-[1.02]">
                    <div class="font-mono text-[10px] text-neutral-500 mt-2 text-center">Figure 7: Comparisons on Image-to-3D</div>
                </div>
            </div>
        </section>

        <!-- SECTION 5: TEMPORAL KINEMATICS & VECTRA METHODOLOGY -->
        <section id="methodology" class="w-full max-w-4xl min-h-screen flex flex-col justify-center items-center py-24 pb-32 pointer-events-auto">
            <div class="w-full bg-neutral-950/75 backdrop-blur-xl border border-cyan-500/20 hover:border-cyan-400/40 p-6 md:p-10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8),_0_0_20px_rgba(0,243,255,0.05)] transition-all duration-500">
                <div class="font-mono text-xs text-cyan-400 tracking-[0.3em] uppercase mb-4 text-glow-cyan">[ SECTION_05 // TEMPORAL_METHODOLOGY ]</div>
                
                <h2 class="font-mono uppercase text-2xl md:text-3xl font-bold tracking-wider text-cyan-300 mb-6 text-glow-cyan">
                    Temporal Kinematics & Vectra Methodology
                </h2>

                <p class="leading-relaxed text-neutral-300 text-sm md:text-base mb-6">
                    Dynamic3D reconstructions require physically-based priors. We enforce rotational and isometry constraints to stabilize the temporal void. Furthermore, the Vectra Spatial Computing Protocol utilizes a decoupled, asynchronous client-server architecture.
                </p>

                <p class="leading-relaxed text-neutral-300 text-sm md:text-base mb-6">
                    The Extraction Protocol relies on Deep Splat Excavation (DBSE), utilizing raycast frustum projection to punch volumetric holes without destructive clipping.
                </p>

                <!-- Formula 7 -->
                <div class="my-6 p-4 rounded-xl bg-black/60 border border-cyan-900/30 overflow-x-auto">
                    <div class="font-mono text-[10px] text-cyan-500 mb-2">// Formula 7 (Rotational Loss)</div>
                    <div class="text-center py-2 text-glow-cyan">
                        $$\mathcal{L}_{rot} = \frac{1}{K} \sum \sum w_{ij} ||q - q||^2$$
                    </div>
                </div>

                <!-- Figures 11, 13, 14 in grid -->
                <div class="flex flex-col gap-8 mt-8">
                    <div class="overflow-hidden rounded-xl border border-cyan-500/20 bg-neutral-950/50 p-2 shadow-inner group">
                        <img src="/img/11.png" alt="Figure 11: Vectra Protocol Decoupled Architecture" class="w-full max-h-[350px] object-contain rounded-lg transition-transform duration-500 group-hover:scale-[1.02]">
                        <div class="font-mono text-[10px] text-neutral-500 mt-2 text-center">Figure 11: Vectra Protocol Decoupled Architecture</div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="overflow-hidden rounded-xl border border-fuchsia-500/20 bg-neutral-950/50 p-2 shadow-inner group">
                            <img src="/img/12.png" alt="Figure 13: Deep Splat Excavation Hole-Punch Process" class="w-full max-h-[250px] object-contain rounded-lg transition-transform duration-500 group-hover:scale-[1.02]">
                            <div class="font-mono text-[10px] text-neutral-500 mt-2 text-center">Figure 13: Deep Splat Excavation Hole-Punch Process</div>
                        </div>
                        <div class="overflow-hidden rounded-xl border border-yellow-500/20 bg-neutral-950/50 p-2 shadow-inner group">
                            <img src="/img/13.png" alt="Figure 14: Sequential VRAM Orchestration" class="w-full max-h-[250px] object-contain rounded-lg transition-transform duration-500 group-hover:scale-[1.02]">
                            <div class="font-mono text-[10px] text-neutral-500 mt-2 text-center">Figure 14: Sequential VRAM Orchestration</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        
    </main>

    <!-- KaTeX JS and Autorender CDN with SRI hashes -->
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
