<!DOCTYPE html>
<html lang="en" class="scroll-smooth">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vectra: The Quarantine Matrix — 16-Stage Scrollytelling Deck</title>
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

        /* Overrides to make KaTeX formulas pure white, large, and scrollable if they exceed container bounds */
        .math-block {
            color: #ffffff !important;
            font-size: 1.35rem !important; /* Large, extremely clear formulas */
            line-height: 1.6;
            text-align: center;
            width: 100%;
            overflow-x: auto;
            overflow-y: hidden;
            margin: 1.25rem 0 !important;
            padding: 0.85rem 1rem !important;
            background: rgba(255, 255, 255, 0.03) !important;
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 8px;
        }
        
        .math-block .katex {
            color: #ffffff !important;
        }
        
        .math-block .katex-display {
            margin: 0 !important;
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

        /* Nav Dots Indicator (Passive/Non-clickable) */
        .nav-dot {
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .nav-dot.active {
            background-color: #ffffff;
            border-color: #ffffff;
            box-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
            transform: scale(1.35);
        }
        
        /* Disable text selection during presentation navigation */
        .no-select {
            user-select: none;
            -webkit-user-select: none;
        }
    </style>
</head>

<body class="bg-black text-white no-select overflow-x-hidden font-sans relative">

    <!-- Scrollable container providing height for the pinning mechanism -->
    <div id="scroll-container" class="relative w-full h-[1600vh]">
        
        <!-- Pinned Wrapper: Locks in viewport and hides overflows -->
        <div id="scroll-wrapper" class="fixed inset-0 w-full h-screen overflow-hidden z-0">
            
            <!-- Fixed WebGL Background Canvas behind UI -->
            <canvas id="bg-canvas" class="absolute inset-0 w-full h-full z-[-10] bg-black block outline-none"></canvas>

            <!-- Black Cover Overlay for high text legibility -->
            <div class="absolute inset-0 w-full h-full z-[-5] bg-black/65 pointer-events-none"></div>

            <!-- Scroll Progress Indicator Bar at the Top -->
            <div class="absolute top-0 left-0 w-full h-1 z-50 bg-neutral-950/60">
                <div id="scroll-progress" class="h-full bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-yellow-300 shadow-[0_0_10px_#00f3ff] w-0 transition-all duration-75 ease-out"></div>
            </div>

            <!-- Floating Cyberpunk Header Panel -->
            <header class="absolute top-4 left-4 right-4 z-40 bg-neutral-950/20 backdrop-blur-md rounded-xl p-4 flex justify-between items-center pointer-events-auto border border-neutral-900/10">
                <div class="flex items-center gap-3">
                    <div class="w-2.5 h-2.5 bg-white rounded-full animate-ping shadow-[0_0_8px_rgba(255,255,255,0.7)]"></div>
                    <a href="/" class="text-white font-mono font-bold tracking-widest text-xs md:text-sm hover:text-cyan-300 transition-colors">
                        VECTRA // THESIS_DECK
                    </a>
                </div>
                <div class="flex items-center gap-4 text-[10px] font-mono">
                    <span class="hidden sm:inline text-neutral-400">UNREAL_BLOOM: <span class="text-glow-cyan">ACTIVE</span></span>
                    <div class="h-4 w-px bg-neutral-800 hidden sm:block"></div>
                    <a href="/" class="px-3 py-1 rounded border border-white/10 hover:border-white/30 bg-neutral-900/5 text-white hover:text-cyan-300 transition-all">
                        [ RETURN TO PORTAL ]
                    </a>
                </div>
            </header>

            <!-- Passive Navigation dots for sections (Right Side) -->
            <nav class="absolute right-6 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2.5 pointer-events-none">
                @for ($i = 0; $i < 16; $i++)
                    <div id="dot-{{ $i }}" class="nav-dot w-2 h-2 rounded-full border border-white/40 bg-transparent {{ $i === 0 ? 'active' : '' }}"></div>
                @endfor
            </nav>

            <!-- Absolutely Stacked Section Content -->
            <div class="relative w-full h-full">

                <!-- SECTION 0: HERO (TITLE & ABSTRACT) -->
                <section id="section-0" class="scrolly-section opacity-1 pointer-events-auto">
                    <div class="w-full max-w-5xl mx-auto px-6 md:px-12 flex flex-col justify-center text-center floating-pane text-white">
                        <div class="font-mono text-[10px] text-cyan-400 tracking-[0.3em] uppercase mb-4 text-glow-cyan">// INTRODUCTION & ABSTRACT</div>
                        <h1 class="font-mono uppercase text-4xl md:text-6xl lg:text-7xl font-black tracking-wider leading-none mb-4">
                            Vectra: The Quarantine Matrix
                        </h1>
                        <h2 class="font-mono text-sm md:text-lg text-fuchsia-400 text-glow-magenta mb-8 font-semibold uppercase">
                            Constraining Neural Hallucinations in 3D Gaussian Environments
                        </h2>
                        <p class="leading-relaxed text-neutral-300 text-sm md:text-base max-w-4xl mx-auto mb-8 font-sans">
                            The hyper-accelerated rise of generative artificial intelligence is rewiring the rules of 3D content creation. Yet, seamlessly jacking everyday 2D inputs—like text prompts and flat images—into fully interactive, dynamic 3D constructs remains a critical bottleneck. This paper introduces an end-to-end framework engineered to generate, extract, and simulate high-fidelity 3D objects directly from simple visual and textual data. By harnessing advanced neural rendering and spatial splatting algorithms, our system spins up robust 3D assets on the fly, entirely bypassing the tedious grind of traditional manual modeling.
                        </p>
                        <div class="flex items-center justify-center gap-4 text-[10px] font-mono text-neutral-400">
                            <div>AUTHOR: <span class="text-yellow-400 text-glow-yellow font-bold">PARSA BESHARAT</span></div>
                            <div class="text-neutral-700">|</div>
                            <div>TU BERGAKADEMIE FREIBERG</div>
                        </div>
                    </div>
                </section>

                <!-- SECTION 1: RELATED WORK FOUNDATIONS (TEXT & MATH) -->
                <section id="section-1" class="scrolly-section">
                    <div class="w-full max-w-5xl mx-auto px-6 md:px-12 flex flex-col justify-center floating-pane text-white">
                        <div class="font-mono text-[10px] text-cyan-400 tracking-[0.3em] uppercase mb-3 text-glow-cyan text-center">// SECTION_01 // RELATED WORK FOUNDATIONS</div>
                        <h2 class="font-mono uppercase text-2xl md:text-3xl font-black mb-4 text-center">Mathematical Foundations</h2>
                        <p class="leading-relaxed text-neutral-300 text-xs md:text-sm font-sans mb-6 text-center max-w-4xl mx-auto">
                            Mildenhall et al. (2020) proposed modeling physical environments as continuous 5D functions using a neural network to calculate density $\sigma$ and emitted color $c$. Volume accumulation is driven by differentiable numerical ray integration. Quality standards utilize Peak Signal to Noise Ratio (PSNR) to audit variance and Structural Similarity Index Measure (SSIM) to check contrast, luminance, and structural covariance.
                        </p>
                        <!-- Math blocks stacked vertically to utilize full viewport width -->
                        <div class="flex flex-col gap-3.5 w-full max-w-4xl mx-auto">
                            <div class="p-3.5 rounded-lg bg-neutral-950/20 backdrop-blur-sm border border-white/5">
                                <div class="font-mono text-[9px] text-cyan-400 mb-1 tracking-wider uppercase text-center">// Volume Rendering Integration:</div>
                                <div class="math-block font-sans">
                                    $$C(\mathbf{r}) = \int_{t_n}^{t_f} T(t) \sigma(\mathbf{r}(t)) \mathbf{c}(\mathbf{r}(t), \mathbf{d}) dt, \quad T(t) = \exp\left( - \int_{t_n}^{t} \sigma(\mathbf{r}(s)) ds \right)$$
                                </div>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="p-3.5 rounded-lg bg-neutral-950/20 backdrop-blur-sm border border-white/5">
                                    <div class="font-mono text-[9px] text-cyan-400 mb-1 tracking-wider uppercase text-center">// Peak Signal to Noise Ratio:</div>
                                    <div class="math-block font-sans">
                                        $$PSNR(I) = 10 \cdot \log_{10} \left( \frac{MAX(I)^2}{MSE(I)} \right)$$
                                    </div>
                                </div>
                                <div class="p-3.5 rounded-lg bg-neutral-950/20 backdrop-blur-sm border border-white/5">
                                    <div class="font-mono text-[9px] text-cyan-400 mb-1 tracking-wider uppercase text-center">// Structural Similarity:</div>
                                    <div class="math-block font-sans">
                                        $$SSIM(x, y) = \frac{(2\mu_x\mu_y + C_1)(2\sigma_{xy} + C_2)}{(\mu_x^2 + \mu_y^2 + C_1)(\sigma_x^2 + \sigma_y^2 + C_2)}$$
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- SECTION 2: FIGURE 1 (RELATED WORK IMAGE - NERF REPRESENTATION) -->
                <section id="section-2" class="scrolly-section">
                    <div class="w-full max-w-6xl mx-auto px-6 md:px-12 flex flex-col justify-center items-center floating-pane">
                        <div class="font-mono text-[10px] text-cyan-400 tracking-[0.3em] uppercase mb-4 text-glow-cyan">// VISUAL ARCHIVE // FIGURE 1</div>
                        <div class="relative overflow-hidden bg-transparent rounded-xl border border-white/5 p-2 flex justify-center items-center max-w-[85vw] max-h-[75vh]">
                            <img src="/img/1.png" alt="Figure 1" class="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl">
                        </div>
                        <div class="font-mono text-[10px] text-neutral-400 mt-4 text-center tracking-wide uppercase">// Figure 1: NeRF Scene Representation & Differentiable Volume Rendering</div>
                    </div>
                </section>

                <!-- SECTION 3: FIGURE 6 (RELATED WORK IMAGE - EVALUATION METRICS) -->
                <section id="section-3" class="scrolly-section">
                    <div class="w-full max-w-6xl mx-auto px-6 md:px-12 flex flex-col justify-center items-center floating-pane">
                        <div class="font-mono text-[10px] text-cyan-400 tracking-[0.3em] uppercase mb-4 text-glow-cyan">// VISUAL ARCHIVE // FIGURE 6</div>
                        <div class="relative overflow-hidden bg-transparent rounded-xl border border-white/5 p-2 flex justify-center items-center max-w-[85vw] max-h-[75vh]">
                            <img src="/img/6.png" alt="Figure 6" class="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl">
                        </div>
                        <div class="font-mono text-[10px] text-neutral-400 mt-4 text-center tracking-wide uppercase">// Figure 6: Evaluation Metrics and Perceptual Image Comparisons</div>
                    </div>
                </section>

                <!-- SECTION 4: SEMANTIC CONSISTENCY (DIETNERF - TEXT/MATH) -->
                <section id="section-4" class="scrolly-section">
                    <div class="w-full max-w-5xl mx-auto px-6 md:px-12 flex flex-col justify-center floating-pane text-white">
                        <div class="font-mono text-[10px] text-fuchsia-400 tracking-[0.3em] uppercase mb-3 text-glow-magenta text-center">// SECTION_03 // SEMANTIC CONSISTENCY</div>
                        <h2 class="font-mono uppercase text-2xl md:text-3xl font-black mb-4 text-center text-fuchsia-300 text-glow-magenta">DietNeRF and Semantic Regularization</h2>
                        <p class="leading-relaxed text-neutral-300 text-xs md:text-sm font-sans mb-6 text-center max-w-4xl mx-auto">
                            Standard NeRF daemons suffer catastrophic geometry collapse when optimized under few-shot viewpoints. Without global constraints, $\mathcal{L}_{MSE}$ minimization leads to degenerate near-field "floaters" packed against virtual cameras. DietNeRF (Jain et al., 2021) bypasses this vulnerability by enforcing a semantic consistency loss. It compares high-level invariant representations of synthetic renders against pre-observed poses using normalised Vision Transformer (ViT) embeddings.
                        </p>
                        <div class="flex flex-col gap-4 w-full max-w-4xl mx-auto">
                            <div class="p-4 rounded-lg bg-neutral-950/20 backdrop-blur-sm border border-white/5">
                                <div class="font-mono text-[9px] text-fuchsia-400 mb-1.5 tracking-wider uppercase text-center">// Semantic Consistency L2 Loss:</div>
                                <div class="math-block font-sans">
                                    $$\mathcal{L}_{SC, \ell_2}(I, \hat{I}) = \frac{\lambda}{2} \| \phi(I) - \phi(\hat{I}) \|_2^2$$
                                </div>
                            </div>
                            <div class="p-4 rounded-lg bg-neutral-950/20 backdrop-blur-sm border border-white/5">
                                <div class="font-mono text-[9px] text-fuchsia-400 mb-1.5 tracking-wider uppercase text-center">// Cosine Similarity formulation:</div>
                                <div class="math-block font-sans">
                                    $$\mathcal{L}_{SC}(I, \hat{I}) = \lambda \phi(I)^T \phi(\hat{I})$$
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- SECTION 5: FIGURE 3 (DIETNERF IMAGE - COMPARISONS) -->
                <section id="section-5" class="scrolly-section">
                    <div class="w-full max-w-[95vw] mx-auto px-6 md:px-12 flex flex-col justify-center items-center floating-pane">
                        <div class="font-mono text-[10px] text-fuchsia-400 tracking-[0.3em] uppercase mb-4 text-glow-magenta">// VISUAL ARCHIVE // FIGURE 3</div>
                        <div class="relative overflow-visible bg-transparent rounded-xl border border-white/5 p-2 flex justify-center items-center w-full max-w-[90vw] max-h-[82vh]">
                            <img src="/img/3.png" alt="Figure 3" class="w-full max-w-[1300px] h-auto max-h-[80vh] object-contain rounded-lg shadow-2xl">
                        </div>
                        <div class="font-mono text-[10px] text-neutral-400 mt-4 text-center tracking-wide uppercase">// Figure 3: DietNeRF Novel Views synthesized from sparse input DTU dataset</div>
                    </div>
                </section>

                <!-- SECTION 6: FIGURE 2 (DIETNERF IMAGE - FEWSHOT) -->
                <section id="section-6" class="scrolly-section">
                    <div class="w-full max-w-[95vw] mx-auto px-6 md:px-12 flex flex-col justify-center items-center floating-pane">
                        <div class="font-mono text-[10px] text-fuchsia-400 tracking-[0.3em] uppercase mb-4 text-glow-magenta">// VISUAL ARCHIVE // FIGURE 2</div>
                        <div class="relative overflow-visible bg-transparent rounded-xl border border-white/5 p-2 flex justify-center items-center w-full max-w-[90vw] max-h-[82vh]">
                            <img src="/img/2.png" alt="Figure 2" class="w-full max-w-[1300px] h-auto max-h-[80vh] object-contain rounded-lg shadow-2xl">
                        </div>
                        <div class="font-mono text-[10px] text-neutral-400 mt-4 text-center tracking-wide uppercase">// Figure 2: View Synthesis comparison on Realistic Synthetic Dataset</div>
                    </div>
                </section>

                <!-- SECTION 7: GENERATIVE 3D (DREAMGAUSSIAN - TEXT/MATH) -->
                <section id="section-7" class="scrolly-section">
                    <div class="w-full max-w-5xl mx-auto px-6 md:px-12 flex flex-col justify-center floating-pane text-white">
                        <div class="font-mono text-[10px] text-yellow-400 tracking-[0.3em] uppercase mb-3 text-glow-yellow text-center">// SECTION_05 // GENERATIVE 3D</div>
                        <h2 class="font-mono uppercase text-2xl md:text-3xl font-black mb-4 text-center text-yellow-300 text-glow-yellow">Generative Gaussian Splatting</h2>
                        <p class="leading-relaxed text-neutral-300 text-xs md:text-sm font-sans mb-6 text-center max-w-4xl mx-auto">
                            DreamGaussian (Tang et al., 2024) transitions generative 3D pipelines from neural fields to explicit 3D Gaussian nodes. Nodes track spatial coordinate center $x$, scaling $s$, rotation quaternion $q$, opacity $\alpha$, and diffuse color $c$. High-speed generation utilizes Score Distillation Sampling (SDS). Re-rendered 2D projections are guided by diffusion noise gradients to optimize parameter coordinates $\Theta$, before marching cubes extracts the polygonal mesh.
                        </p>
                        <div class="flex flex-col gap-4 w-full max-w-4xl mx-auto">
                            <div class="p-4 rounded-lg bg-neutral-950/20 backdrop-blur-sm border border-white/5">
                                <div class="font-mono text-[9px] text-yellow-400 mb-1.5 tracking-wider uppercase text-center">// Score Distillation Sampling (SDS) Loss:</div>
                                <!-- Fixed KaTeX syntax error (single-backslashes only) to prevent parse errors -->
                                <div class="math-block font-sans">
                                    $$\nabla_\Theta \mathcal{L}_{SDS} = \mathbb{E}_{t,p,\epsilon} \left[ w(t) \left( \epsilon_\phi(I^p_{RGB}; t, \tilde{I}^r_{RGB}, \Delta p) - \epsilon \right) \frac{\partial I^p_{RGB}}{\partial \Theta} \right]$$
                                </div>
                            </div>
                            <div class="p-4 rounded-lg bg-neutral-950/20 backdrop-blur-sm border border-white/5">
                                <div class="font-mono text-[9px] text-yellow-400 mb-1.5 tracking-wider uppercase text-center">// Spatial Influence Density extraction:</div>
                                <div class="math-block font-sans">
                                    $$d(\mathbf{x}) = \sum_{i} \alpha_i \exp \left( -\frac{1}{2} (\mathbf{x} - \mathbf{x}_i)^T \Sigma_i^{-1} (\mathbf{x} - \mathbf{x}_i) \right)$$
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- SECTION 8: FIGURE 7 (GENERATIVE 3D IMAGE - COMPARISONS) -->
                <section id="section-8" class="scrolly-section">
                    <div class="w-full max-w-[95vw] mx-auto px-6 md:px-12 flex flex-col justify-center items-center floating-pane">
                        <div class="font-mono text-[10px] text-yellow-400 tracking-[0.3em] uppercase mb-4 text-glow-yellow">// VISUAL ARCHIVE // FIGURE 7</div>
                        <div class="relative overflow-visible bg-transparent rounded-xl border border-white/5 p-2 flex justify-center items-center w-full max-w-[90vw] max-h-[82vh]">
                            <img src="/img/7.png" alt="Figure 7" class="w-full max-w-[1300px] h-auto max-h-[80vh] object-contain rounded-lg shadow-2xl">
                        </div>
                        <div class="font-mono text-[10px] text-neutral-400 mt-4 text-center tracking-wide uppercase">// Figure 7: Qualitative comparison on Image-to-3D algorithms</div>
                    </div>
                </section>

                <!-- SECTION 9: FIGURE 13 (GENERATIVE 3D IMAGE - VRAM LIFECYCLE) -->
                <section id="section-9" class="scrolly-section">
                    <div class="w-full max-w-6xl mx-auto px-6 md:px-12 flex flex-col justify-center items-center floating-pane">
                        <div class="font-mono text-[10px] text-yellow-400 tracking-[0.3em] uppercase mb-4 text-glow-yellow">// VISUAL ARCHIVE // FIGURE 13</div>
                        <div class="relative overflow-hidden bg-transparent rounded-xl border border-white/5 p-2 flex justify-center items-center max-w-[85vw] max-h-[75vh]">
                            <img src="/img/13.png" alt="Figure 13" class="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl">
                        </div>
                        <div class="font-mono text-[10px] text-neutral-400 mt-4 text-center tracking-wide uppercase">// Figure 13: Sequential VRAM Lifecycle on restricted GPU VRAM ceiling</div>
                    </div>
                </section>

                <!-- SECTION 10: METHODOLOGY (PIPELINE DETAILS) -->
                <section id="section-10" class="scrolly-section">
                    <div class="w-full max-w-5xl mx-auto px-6 md:px-12 flex flex-col justify-center floating-pane text-white">
                        <div class="font-mono text-[10px] text-cyan-400 tracking-[0.3em] uppercase mb-3 text-glow-cyan text-center">// SECTION_07 // METHODOLOGY BLUEPRINTS</div>
                        <h2 class="font-mono uppercase text-2xl md:text-3xl font-black mb-4 text-center">Decoupled Spatial Architecture</h2>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans text-xs md:text-sm text-neutral-300 mb-6">
                            <p class="leading-relaxed text-justify">
                                The Vectra Protocol isolates client-side rendering from background inference. The browser renders 3D Gaussian hallways via <code>gsplat.js</code> and collision physics via <code>Cannon.js</code>. The backend Local GPU Forge coordinates U2Net, SDXL-Lightning, and TripoSR local models. <strong>Deep Splat Excavation (DBSE)</strong> solves occlusion: viewport raycasting defines a 3D bounding box intersecting the hallway splats, and a shader-level override sets their opacity values to zero.
                            </p>
                            <p class="leading-relaxed text-justify">
                                <strong>Sequential VRAM Orchestration</strong> operates heavy models within consumer-grade limits (8GB VRAM RTX 4060). SDXL-Lightning images are saved in half-precision (<code>float16</code>), the GPU cache is forcefully cleared (<code>empty_cache()</code>), and only then TripoSR loads to run Marching Cubes, preventing kernel crashes.
                            </p>
                        </div>
                        <div class="p-3.5 rounded-lg bg-neutral-950/20 backdrop-blur-sm border border-white/5 w-full max-w-4xl mx-auto">
                            <div class="font-mono text-[9px] text-cyan-400 mb-1 tracking-wider uppercase text-center">// Client-Side Collision updates:</div>
                            <div class="math-block font-sans">
                                $$\Sigma_{2D} = J E \Sigma E^T J^T, \quad \mu_{2D} = K \left( \frac{E\mu}{(E\mu)_z} \right)$$
                            </div>
                        </div>
                    </div>
                </section>

                <!-- SECTION 11: METHODOLOGY FLOWCHART (CUSTOM ANIMATIONS) -->
                <section id="section-11" class="scrolly-section">
                    <div class="w-full max-w-4xl mx-auto px-6 md:px-12 flex flex-col justify-center items-center floating-pane">
                        <div class="font-mono text-[10px] text-cyan-400 tracking-[0.3em] uppercase mb-4 text-glow-cyan">// METHODOLOGY VISUALIZATION // FLOWCHART</div>
                        <div class="w-full p-6 relative font-mono text-neutral-400 border border-white/5 rounded-xl bg-neutral-950/20 backdrop-blur-sm shadow-2xl">
                            <div class="text-center text-glow-cyan text-xs uppercase font-bold tracking-widest mb-4">Vectra Spatial Processing Map</div>
                            <div class="relative w-full h-[220px] flex justify-center">
                                <svg class="w-full max-w-2xl h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 180">
                                    <path id="flow-path-1" d="M 120,47 L 150,47" stroke="#ffffff" stroke-width="1.5" stroke-opacity="0.15" fill="none" />
                                    <path id="flow-path-2" d="M 270,47 L 300,47" stroke="#ffffff" stroke-width="1.5" stroke-opacity="0.15" fill="none" />
                                    <path id="flow-path-3" d="M 355,65 L 355,110" stroke="#ffffff" stroke-width="1.5" stroke-opacity="0.15" fill="none" />
                                    <path id="flow-path-4" d="M 290,127 L 250,127" stroke="#ffffff" stroke-width="1.5" stroke-opacity="0.15" fill="none" />
                                    <path id="flow-path-5" d="M 130,127 L 65,127 L 65,65" stroke="#ffffff" stroke-width="1.5" stroke-opacity="0.15" fill="none" />
                                    
                                    <g id="node-input">
                                        <rect x="10" y="30" width="110" height="35" rx="6" fill="#020204" fill-opacity="0.8" stroke="#ffffff" stroke-width="1" stroke-opacity="0.2" />
                                        <text x="65" y="51" fill="#ffffff" text-anchor="middle" font-weight="bold">INPUT SOURCE</text>
                                    </g>
                                    <g id="node-segment">
                                        <rect x="150" y="30" width="120" height="35" rx="6" fill="#020204" fill-opacity="0.8" stroke="#ffffff" stroke-width="1" stroke-opacity="0.2" />
                                        <text x="210" y="51" fill="#ffffff" text-anchor="middle" font-weight="bold">U2NET MASKING</text>
                                    </g>
                                    <g id="node-forge">
                                        <rect x="300" y="30" width="110" height="35" rx="6" fill="#020204" fill-opacity="0.8" stroke="#ffffff" stroke-width="1" stroke-opacity="0.2" />
                                        <text x="355" y="51" fill="#ffffff" text-anchor="middle" font-weight="bold">TRIPOSR FORGE</text>
                                    </g>
                                    <g id="node-dbse">
                                        <rect x="290" y="110" width="120" height="35" rx="6" fill="#020204" fill-opacity="0.8" stroke="#ffffff" stroke-width="1" stroke-opacity="0.2" />
                                        <text x="350" y="131" fill="#ffffff" text-anchor="middle" font-weight="bold">DBSE HOLE-PUNCH</text>
                                    </g>
                                    <g id="node-inject">
                                        <rect x="130" y="110" width="120" height="35" rx="6" fill="#020204" fill-opacity="0.8" stroke="#ffffff" stroke-width="1" stroke-opacity="0.2" />
                                        <text x="190" y="131" fill="#ffffff" text-anchor="middle" font-weight="bold">GLB RIGIDBODY</text>
                                    </g>
                                </svg>
                            </div>
                            <div id="flow-node-details" class="p-3.5 bg-neutral-900/40 rounded-lg text-xs md:text-sm leading-relaxed text-neutral-300 mt-4 text-center tracking-wide font-mono shadow-inner">
                                Flow Telemetry: Processing Active Segment...
                            </div>
                        </div>
                    </div>
                </section>

                <!-- SECTION 12: FIGURE 11 (METHODOLOGY IMAGE - EXTRACTION PIPELINE) -->
                <section id="section-12" class="scrolly-section">
                    <div class="w-full max-w-6xl mx-auto px-6 md:px-12 flex flex-col justify-center items-center floating-pane">
                        <div class="font-mono text-[10px] text-cyan-400 tracking-[0.3em] uppercase mb-4 text-glow-cyan">// VISUAL ARCHIVE // FIGURE 11</div>
                        <div class="relative overflow-hidden bg-transparent rounded-xl border border-white/5 p-2 flex justify-center items-center max-w-[85vw] max-h-[75vh]">
                            <img src="/img/11.png" alt="Figure 11" class="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl">
                        </div>
                        <div class="font-mono text-[10px] text-neutral-400 mt-4 text-center tracking-wide uppercase">// Figure 11: Generative Extraction Pipeline (Scenario 1) Flowchart</div>
                    </div>
                </section>

                <!-- SECTION 13: FIGURE 12 (METHODOLOGY IMAGE - DBSE MASKING) -->
                <section id="section-13" class="scrolly-section">
                    <div class="w-full max-w-6xl mx-auto px-6 md:px-12 flex flex-col justify-center items-center floating-pane">
                        <div class="font-mono text-[10px] text-cyan-400 tracking-[0.3em] uppercase mb-4 text-glow-cyan">// VISUAL ARCHIVE // FIGURE 12</div>
                        <div class="relative overflow-hidden bg-transparent rounded-xl border border-white/5 p-2 flex justify-center items-center max-w-[85vw] max-h-[75vh]">
                            <img src="/img/12.png" alt="Figure 12" class="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl">
                        </div>
                        <div class="font-mono text-[10px] text-neutral-400 mt-4 text-center tracking-wide uppercase">// Figure 12: Deep Splat Excavation (DBSE) Frustum Raycasting & Masking</div>
                    </div>
                </section>

                <!-- SECTION 14: CONCLUSION -->
                <section id="section-14" class="scrolly-section">
                    <div class="w-full max-w-5xl mx-auto px-6 md:px-12 flex flex-col justify-center floating-pane text-white text-center">
                        <div class="font-mono text-[10px] text-cyan-400 tracking-[0.3em] uppercase mb-3 text-glow-cyan">// CONCLUSION SUMMARY</div>
                        <h2 class="font-mono uppercase text-3xl md:text-4xl font-black mb-6">Conclusion</h2>
                        <p class="leading-relaxed text-neutral-300 text-sm md:text-base max-w-4xl mx-auto mb-4 font-sans text-justify md:text-center">
                            As spatial computing and generative AI converge, isolating the high-fidelity presentation layers from background neural networks becomes crucial. The Vectra Protocol successfully processes U2Net, SDXL-Lightning, and TripoSR on constrained edge GPUs (8GB VRAM).
                        </p>
                        <p class="leading-relaxed text-neutral-300 text-sm md:text-base max-w-4xl mx-auto font-sans text-justify md:text-center">
                            DBSE shader-level masking injects dynamic meshes into dense Gaussian Splats without permanent point-cloud alteration. This work lays the foundation for embedding definitive mathematical safeguards like Control Barrier Functions directly at the rendering level.
                        </p>
                    </div>
                </section>

                <!-- SECTION 15: REFERENCES & PORTAL LINK -->
                <section id="section-15" class="scrolly-section">
                    <div class="w-full max-w-5xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center floating-pane text-white">
                        <!-- Left text content -->
                        <div class="lg:col-span-7 flex flex-col justify-center text-left">
                            <div class="font-mono text-[10px] text-yellow-400 tracking-[0.3em] uppercase mb-3 text-glow-yellow">// CITATIONS & PORTAL</div>
                            <h2 class="font-mono uppercase text-2xl md:text-3xl font-black text-white mb-4">
                                References & Launch
                            </h2>
                            <ul class="font-mono text-sm md:text-base text-white space-y-3.5 max-h-[350px] overflow-y-auto pr-2">
                                <li class="text-white"><span class="text-yellow-400 font-bold">[1]</span> Mildenhall et al. (2020) - <em class="text-cyan-300">NeRF: Representing Scenes as Neural Radiance Fields for View Synthesis</em> (ECCV).</li>
                                <li class="text-white"><span class="text-yellow-400 font-bold">[2]</span> Rabby & Zhang (2024) - <em class="text-cyan-300">BeyondPixels: A Comprehensive Review of the Evolution of Neural Radiance Fields</em> (arXiv).</li>
                                <li class="text-white"><span class="text-yellow-400 font-bold">[3]</span> Jain et al. (2021) - <em class="text-cyan-300">Putting NeRF on a Diet: Semantically Consistent Few-Shot View Synthesis</em> (ICCV).</li>
                                <li class="text-white"><span class="text-yellow-400 font-bold">[4]</span> Niemeyer et al. (2022) - <em class="text-cyan-300">RegNeRF: Regularizing Neural Radiance Fields for View Synthesis from Sparse Inputs</em> (CVPR).</li>
                                <li class="text-white"><span class="text-yellow-400 font-bold">[5]</span> Tang et al. (2024) - <em class="text-cyan-300">DreamGaussian: Generative Gaussian Splatting for Efficient 3D Content Creation</em> (ICLR).</li>
                                <li class="text-white"><span class="text-yellow-400 font-bold">[6]</span> Luiten et al. (2023) - <em class="text-cyan-300">Dynamic 3D Gaussians: Tracking by Persistent Dynamic View Synthesis</em> (arXiv).</li>
                            </ul>
                        </div>
                        <!-- Right Action Panel with glowing borderless link -->
                        <div class="lg:col-span-5 flex flex-col justify-center items-center">
                            <div class="relative group p-1 flex flex-col items-center">
                                <div class="absolute -inset-1 bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-yellow-300 rounded-xl blur-lg opacity-40 group-hover:opacity-100 transition duration-700"></div>
                                <a href="https://vectra.parsabe.com" target="_blank" class="relative px-12 py-6 bg-neutral-950 text-white rounded-lg block font-mono text-[11px] tracking-[0.25em] uppercase hover:text-cyan-400 transition-colors text-center w-80">
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
