<!DOCTYPE html>
<html lang="en" class="scroll-smooth presentation-page-html">

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
</head>

<body class="bg-black text-white no-select overflow-x-hidden font-sans relative presentation-page-body">

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
                        <p class="leading-relaxed text-neutral-300 text-xs md:text-sm max-w-4xl mx-auto mb-8 font-sans text-justify md:text-center">
                            The hyper-accelerated rise of generative artificial intelligence is rewiring the rules of 3D content creation. Yet, seamlessly jacking everyday 2D inputs—like text prompts and flat images—into fully interactive, dynamic 3D constructs remains a critical bottleneck. This paper introduces an end-to-end framework engineered to generate, extract, and simulate high-fidelity 3D objects directly from simple visual and textual data. By harnessing advanced neural rendering and spatial splatting algorithms, our system spins up robust 3D assets on the fly, entirely bypassing the tedious grind of traditional manual modeling. We orchestrate a streamlined pipeline that fuses zero-shot semantic extraction, generative mesh synthesis, and web-based physics integration. This unified architecture doesn't just supercharge the rendering of complex 3D scenes; it breathes real-time kinetic life into them, enabling fluid dynamic simulation and direct user manipulation. We benchmark the framework’s performance across structural integrity, pipeline latency, and interactive immersion within a scalable network. Ultimately, this work delivers a highly optimized, plug-and-play solution that accelerates the 3D creation workflow, paving the way for the next generation of accessible, dynamic, and fully interactive digital realities.
                        </p>
                        <div class="flex items-center justify-center gap-4 text-[10px] font-mono text-neutral-400">
                            <div>AUTHOR: <span class="text-yellow-400 text-glow-yellow font-bold">PARSA BESHARAT</span></div>
                            <div class="text-neutral-700">|</div>
                            <div>TECHNISCHE UNIVERSITÄT BERGAKADEMIE FREIBERG, GERMANY</div>
                        </div>
                    </div>
                </section>

                <!-- SECTION 1: RELATED WORK FOUNDATIONS (TEXT & MATH) -->
                <section id="section-1" class="scrolly-section">
                    <div class="w-full max-w-5xl mx-auto px-6 md:px-12 flex flex-col justify-center floating-pane text-white">
                        <div class="font-mono text-[10px] text-cyan-400 tracking-[0.3em] uppercase mb-3 text-glow-cyan text-center">// SECTION_01 // RELATED WORK FOUNDATIONS</div>
                        <h2 class="font-mono uppercase text-2xl md:text-3xl font-black mb-4 text-center">Mathematical Foundations</h2>
                        <p class="leading-relaxed text-neutral-300 text-xs md:text-sm font-sans mb-6 text-center max-w-4xl mx-auto">
                            Mildenhall et al. (2020) proposed modeling physical environments as continuous 5D functions using a neural network MLP $F_\Theta : (x, d) \to (c, \sigma)$ to calculate density $\sigma$ and emitted color $c$. Volume accumulation is driven by differentiable numerical ray integration. Quality standards utilize Peak Signal to Noise Ratio (PSNR) to audit variance, Structural Similarity Index Measure (SSIM) to check contrast, luminance, and structural covariance, and Learned Perceptual Image Patch Similarity (LPIPS) to evaluate deep perceptual features.
                        </p>
                        <!-- Math blocks stacked vertically to utilize full viewport width -->
                        <div class="flex flex-col gap-3.5 w-full max-w-4xl mx-auto">
                            <div class="p-3.5 rounded-lg bg-neutral-950/20 backdrop-blur-sm border border-white/5">
                                <div class="font-mono text-[9px] text-cyan-400 mb-1 tracking-wider uppercase text-center">// Volume Rendering Integration & Stratified Sampling:</div>
                                <div class="math-block font-sans text-xs">
                                    $$C(\mathbf{r}) = \int_{t_n}^{t_f} T(t) \sigma(\mathbf{r}(t)) \mathbf{c}(\mathbf{r}(t), \mathbf{d}) dt, \quad t_i \sim \mathcal{U} \left[ t_n + \frac{i-1}{N}(t_f - t_n), \; t_n + \frac{i}{N}(t_f - t_n) \right]$$
                                </div>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div class="p-3.5 rounded-lg bg-neutral-950/20 backdrop-blur-sm border border-white/5">
                                    <div class="font-mono text-[9px] text-cyan-400 mb-1 tracking-wider uppercase text-center">// Peak Signal to Noise Ratio:</div>
                                    <div class="math-block font-sans text-[10.5px]">
                                        $$PSNR(I) = 10 \cdot \log_{10} \left( \frac{MAX(I)^2}{MSE(I)} \right)$$
                                    </div>
                                </div>
                                <div class="p-3.5 rounded-lg bg-neutral-950/20 backdrop-blur-sm border border-white/5">
                                    <div class="font-mono text-[9px] text-cyan-400 mb-1 tracking-wider uppercase text-center">// Structural Similarity:</div>
                                    <div class="math-block font-sans text-[10.5px]">
                                        $$SSIM(x, y) = \frac{(2\mu_x\mu_y + C_1)(2\sigma_{xy} + C_2)}{(\mu_x^2 + \mu_y^2 + C_1)(\sigma_x^2 + \sigma_y^2 + C_2)}$$
                                    </div>
                                </div>
                                <div class="p-3.5 rounded-lg bg-neutral-950/20 backdrop-blur-sm border border-white/5">
                                    <div class="font-mono text-[9px] text-cyan-400 mb-1 tracking-wider uppercase text-center">// Learned Perceptual Similarity (LPIPS):</div>
                                    <div class="math-block font-sans text-[10.5px]">
                                        $$LPIPS(x, y) = \sum_{l=1}^L \frac{1}{H_l W_l} \sum_{h,w} ||w_l (x_{lhw} - y_{lhw})||_2^2$$
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
                        <div class="font-mono text-[10px] text-neutral-400 mt-4 text-center tracking-wide uppercase">// Figure 1: NeRF Scene Representation & Differentiable Volume Rendering (Mildenhall et al., 2020)</div>
                    </div>
                </section>

                <!-- SECTION 3: FIGURE 6 (RELATED WORK IMAGE - EVALUATION METRICS) -->
                <section id="section-3" class="scrolly-section">
                    <div class="w-full max-w-6xl mx-auto px-6 md:px-12 flex flex-col justify-center items-center floating-pane">
                        <div class="font-mono text-[10px] text-cyan-400 tracking-[0.3em] uppercase mb-4 text-glow-cyan">// VISUAL ARCHIVE // FIGURE 6</div>
                        <div class="relative overflow-hidden bg-transparent rounded-xl border border-white/5 p-2 flex justify-center items-center max-w-[85vw] max-h-[75vh]">
                            <img src="/img/6.png" alt="Figure 6" class="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl">
                        </div>
                        <div class="font-mono text-[10px] text-neutral-400 mt-4 text-center tracking-wide uppercase">// Figure 6: Comparisons on Image-to-3D. Evaluating the balance between generation speed and mesh quality.</div>
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
                    <div class="w-full h-full flex flex-col justify-center items-center floating-pane p-4">
                        <div class="font-mono text-[10px] text-fuchsia-400 tracking-[0.3em] uppercase mb-2 text-glow-magenta">// VISUAL ARCHIVE // FIGURE 3</div>
                        <div class="w-full max-w-[98vw] h-[82vh] flex justify-center items-center">
                            <img src="/img/3.png" alt="Figure 3" class="w-full h-full object-contain rounded-lg shadow-2xl" style="image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges;">
                        </div>
                        <div class="font-mono text-[9px] md:text-[10px] text-neutral-400 mt-2 text-center tracking-wide uppercase">// Figure 3: DietNeRF Novel Views synthesized from sparse input DTU dataset (Jain et al., 2021)</div>
                    </div>
                </section>

                <!-- SECTION 6: FIGURE 2 (DIETNERF IMAGE - FEWSHOT) -->
                <section id="section-6" class="scrolly-section">
                    <div class="w-full h-full flex flex-col justify-center items-center floating-pane p-4">
                        <div class="font-mono text-[10px] text-fuchsia-400 tracking-[0.3em] uppercase mb-2 text-glow-magenta">// VISUAL ARCHIVE // FIGURE 2</div>
                        <div class="w-full max-w-[98vw] h-[82vh] flex justify-center items-center">
                            <img src="/img/2.png" alt="Figure 2" class="w-full h-full object-contain rounded-lg shadow-2xl" style="image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges;">
                        </div>
                        <div class="font-mono text-[9px] md:text-[10px] text-neutral-400 mt-2 text-center tracking-wide uppercase">// Figure 2: View Synthesis comparison on Realistic Synthetic Dataset (Jain et al., 2021)</div>
                    </div>
                </section>

                <!-- SECTION 7: GENERATIVE 3D (DREAMGAUSSIAN - TEXT/MATH) -->
                <section id="section-7" class="scrolly-section">
                    <div class="w-full max-w-5xl mx-auto px-6 md:px-12 flex flex-col justify-center floating-pane text-white">
                        <div class="font-mono text-[10px] text-yellow-400 tracking-[0.3em] uppercase mb-2 text-glow-yellow text-center">// SECTION_05 // GENERATIVE 3D</div>
                        <h2 class="font-mono uppercase text-2xl md:text-3xl font-black mb-3 text-center text-yellow-300 text-glow-yellow">Generative & Dynamic Gaussian Splatting</h2>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans text-xs md:text-sm text-neutral-300 mb-4">
                            <div class="space-y-3">
                                <p class="leading-relaxed text-justify">
                                    <strong>DreamGaussian (Tang et al., 2024):</strong> Transitions generative 3D from neural fields to explicit 3D Gaussian nodes tracking coordinate parameters $\Theta_i = \{x_i, s_i, q_i, \alpha_i, c_i\}$. High-speed optimization utilizes Score Distillation Sampling (SDS) with 2D diffusion noise gradients, followed by mesh extraction from volumetric density $d(\mathbf{x})$ and UV-space texture refinement.
                                </p>
                                <p class="leading-relaxed text-justify">
                                    <strong>Dynamic3D (Luiten et al., 2023):</strong> Reconstructs moving environments chronologically, optimizing kinematics and temporal rotations $R_{i,t}$. Enforces rigidity ($\mathcal{L}_{\text{rigid}}$), rotational ($\mathcal{L}_{\text{rot}}$), and isometry ($\mathcal{L}_{\text{iso}}$) loss functions to prevent spatial tracking drift.
                                </p>
                            </div>
                            <div class="space-y-3">
                                <p class="leading-relaxed text-justify">
                                    <strong>LGM (Tang et al., 2024):</strong> Synthesizes high-resolution 3D Gaussians in a single forward pass. It anchors multi-view orbital images using 9-channel Plücker ray embeddings $f_i = \{c_i, o_i \times d_i, d_i\}$ fed into an Asymmetric U-Net with cross-view self-attention.
                                </p>
                                <p class="leading-relaxed text-justify">
                                    <strong>TRELLIS.2 (Xiang et al., 2025):</strong> Employs structured voxels (O-Voxel) to represent geometry and material tuples $f =\{(f^{shape}_i, f^{mat}_i, p_i)\}_{i=1}^L$ on a flexible dual grid via Quadratic Error Function (QEF) minimization, compressed using a sparse-convolutional autoencoder (SC-VAE).
                                </p>
                            </div>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl mx-auto">
                            <div class="p-3.5 rounded-lg bg-neutral-950/20 backdrop-blur-sm border border-white/5">
                                <div class="font-mono text-[9px] text-yellow-400 mb-1 tracking-wider uppercase text-center">// Score Distillation Sampling (SDS) Loss:</div>
                                <div class="math-block font-sans text-xs">
                                    $$\nabla_\Theta \mathcal{L}_{SDS} = \mathbb{E}_{t,p,\epsilon} \left[ w(t) \left( \epsilon_\phi(I^p_{RGB}; t, \tilde{I}^r_{RGB}, \Delta p) - \epsilon \right) \frac{\partial I^p_{RGB}}{\partial \Theta} \right]$$
                                </div>
                            </div>
                            <div class="p-3.5 rounded-lg bg-neutral-950/20 backdrop-blur-sm border border-white/5">
                                <div class="font-mono text-[9px] text-yellow-400 mb-1 tracking-wider uppercase text-center">// TRELLIS.2 Dual Grid QEF Minimization:</div>
                                <div class="math-block font-sans text-xs">
                                    $$\min_{v\in voxel} e(v) = \sum_i d^2_{\Pi,i} + \lambda_{bound} \sum_j d^2_{L,j} + \lambda_{reg} d^2_{\hat{q}}$$
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- SECTION 8: FIGURE 7 (GENERATIVE 3D IMAGE - COMPARISONS) -->
                <section id="section-8" class="scrolly-section">
                    <div class="w-full h-full flex flex-col justify-center items-center floating-pane p-4">
                        <div class="font-mono text-[10px] text-yellow-400 tracking-[0.3em] uppercase mb-2 text-glow-yellow">// VISUAL ARCHIVE // FIGURE 7</div>
                        <div class="w-full max-w-[98vw] h-[82vh] flex justify-center items-center">
                            <img src="/img/7.png" alt="Figure 7" class="w-full h-full object-contain rounded-lg shadow-2xl" style="image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges;">
                        </div>
                        <div class="font-mono text-[9px] md:text-[10px] text-neutral-400 mt-2 text-center tracking-wide uppercase">// Figure 7: Architecture of LGM asymmetric U-Net with cross-view self-attentions (Tang et al., 2024)</div>
                    </div>
                </section>

                <!-- SECTION 9: FIGURE 13 (GENERATIVE 3D IMAGE - VRAM LIFECYCLE) -->
                <section id="section-9" class="scrolly-section">
                    <div class="w-full max-w-6xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center floating-pane">
                        <!-- Left column: Image -->
                        <div class="lg:col-span-7 flex flex-col justify-center items-center">
                            <div class="font-mono text-[10px] text-yellow-400 tracking-[0.3em] uppercase mb-4 text-glow-yellow">// VISUAL ARCHIVE // FIGURE 13</div>
                            <div class="relative overflow-hidden bg-transparent rounded-xl border border-white/5 p-2 flex justify-center items-center max-w-full max-h-[60vh]">
                                <img src="/img/13.png" alt="Figure 13" class="max-w-full max-h-[55vh] object-contain rounded-lg shadow-2xl">
                            </div>
                            <div class="font-mono text-[10px] text-neutral-400 mt-4 text-center tracking-wide uppercase">// Figure 13: Sequential VRAM Lifecycle on restricted GPU VRAM ceiling</div>
                        </div>
                        <!-- Right column: Code / Details -->
                        <div class="lg:col-span-5 flex flex-col justify-center text-left">
                            <div class="font-mono text-[10px] text-yellow-400 mb-2 tracking-wider uppercase">// JavaScript: executePromptSummon()</div>
                            <div class="p-3.5 rounded-lg bg-neutral-950/40 border border-white/5 font-mono text-[10px] text-neutral-300 overflow-y-auto max-h-[40vh] shadow-inner leading-relaxed">
                                <pre class="m-0"><code class="language-javascript">function executePromptSummon() {
    const prompt = creatorPromptInput.value.trim();
    if (!prompt) return;
    showCreatorLoader('Connecting to Stable Diffusion SD3 generator...', 15);
    
    fetch('/api-proxy/summon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt })
    })
    .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        showCreatorLoader('Image generated. Forging 3D geometry locally via TripoSR...', 55);
        return response.arrayBuffer();
    })
    .then(arrayBuffer => {
        showCreatorLoader('Reconstruction complete. Loading 3D spatial mesh...', 85);
        const loader = new GLTFLoader();
        loader.parse(arrayBuffer, '', (gltf) => {
            const model = gltf.scene;
            const forward = new THREE.Vector3();
            camera.getWorldDirection(forward);
            const targetPos = new THREE.Vector3().copy(camera.position).addScaledVector(forward, 5);
            model.position.copy(targetPos);
            if (viewer && viewer.splatMesh) viewer.splatMesh.visible = false;
            scene.add(model);
            hideCreatorLoader();
        });
    })
    .catch(err => {
        console.error('SYS_ERR: Summon failed:', err.message);
        hideCreatorLoader();
    });
}</code></pre>
                            </div>
                            <div class="font-mono text-[9px] text-neutral-500 mt-2">// Scenario 2 Asynchronous Client-Side Orchestration</div>
                        </div>
                    </div>
                </section>

                <!-- SECTION 10: METHODOLOGY (PIPELINE DETAILS) -->
                <section id="section-10" class="scrolly-section">
                    <div class="w-full max-w-5xl mx-auto px-6 md:px-12 flex flex-col justify-center floating-pane text-white">
                        <div class="font-mono text-[10px] text-cyan-400 tracking-[0.3em] uppercase mb-2 text-glow-cyan text-center">// SECTION_07 // METHODOLOGY BLUEPRINTS</div>
                        <h2 class="font-mono uppercase text-2xl md:text-3xl font-black mb-3 text-center">Decoupled Spatial Architecture</h2>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans text-[11px] md:text-xs text-neutral-300 mb-3">
                            <div class="space-y-2">
                                <p class="leading-relaxed text-justify">
                                    The Vectra Spatial Computing Protocol is engineered on a strictly decoupled client-server architecture. The browser-based <strong>Client Presentation Layer</strong> renders the 3D Gaussian environment via <code>gsplat.js</code> and calculates collision physics using <code>Cannon.js</code>. The lightweight frontend captures user selections or prompts without executing any neural network operations, ensuring non-blocking real-time rendering.
                                </p>
                                <p class="leading-relaxed text-justify">
                                    The autonomous <strong>Local GPU Forge (Backend)</strong> runs a FastAPI server hosting the neural architectures: <code>U2Net</code> for semantic masking, <code>SDXL-Lightning</code> for rapid text-to-image synthesis, and <code>TripoSR</code> for volumetric reconstruction.
                                </p>
                            </div>
                            <div class="flex flex-col justify-center items-center">
                                <div class="relative overflow-hidden bg-transparent rounded-lg border border-white/5 p-1 flex justify-center items-center max-w-full">
                                    <img src="/img/10.png" alt="Figure 10" class="max-h-[18vh] object-contain rounded shadow-lg">
                                </div>
                                <div class="font-mono text-[8px] text-neutral-400 mt-1 text-center tracking-wide uppercase">// Figure 10: Asynchronous high-level topology of the Vectra Protocol</div>
                            </div>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="p-3 rounded-lg bg-neutral-950/20 backdrop-blur-sm border border-white/5">
                                <div class="font-mono text-[9px] text-cyan-400 mb-1 tracking-wider uppercase text-center">// Client-Side Zwicker Splat Projection:</div>
                                <div class="math-block font-sans text-xs">
                                    $$\Sigma_{2D} = J E \Sigma E^T J^T, \quad \mu_{2D} = K \left( \frac{E\mu}{(E\mu)_z} \right)$$
                                </div>
                            </div>
                            <div class="p-3 rounded-lg bg-neutral-950/20 backdrop-blur-sm border border-white/5 flex flex-col justify-center text-[11px] md:text-xs">
                                <p class="leading-relaxed text-justify text-neutral-300">
                                    <strong>Deep Splat Excavation (DBSE)</strong> handles Z-fighting and intersection clipping by raycasting a 3D bounding box from the client viewport and overriding intersecting Gaussian splat opacities to zero.
                                </p>
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
                    <div class="w-full max-w-6xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center floating-pane">
                        <!-- Left column: Image -->
                        <div class="lg:col-span-7 flex flex-col justify-center items-center">
                            <div class="font-mono text-[10px] text-cyan-400 tracking-[0.3em] uppercase mb-4 text-glow-cyan">// VISUAL ARCHIVE // FIGURE 11</div>
                            <div class="relative overflow-hidden bg-transparent rounded-xl border border-white/5 p-2 flex justify-center items-center max-w-full max-h-[60vh]">
                                <img src="/img/11.png" alt="Figure 11" class="max-w-full max-h-[55vh] object-contain rounded-lg shadow-2xl">
                            </div>
                            <div class="font-mono text-[10px] text-neutral-400 mt-4 text-center tracking-wide uppercase">// Figure 11: Generative Extraction Pipeline (Scenario 1) Flowchart</div>
                        </div>
                        <!-- Right column: Code -->
                        <div class="lg:col-span-5 flex flex-col justify-center text-left">
                            <div class="font-mono text-[10px] text-cyan-400 mb-2 tracking-wider uppercase">// JavaScript: captureSelectionSnapshot()</div>
                            <div class="p-3.5 rounded-lg bg-neutral-950/40 border border-white/5 font-mono text-[10px] text-neutral-300 overflow-y-auto max-h-[40vh] shadow-inner leading-relaxed">
                                <pre class="m-0"><code class="language-javascript">function captureSelectionSnapshot(bb) {
    try {
        const prevBg = scene.background ? scene.background.clone() : null;
        const prevFog = scene.fog;
        const prevGridVisible = gridHelper.visible;
        
        scene.background = new THREE.Color(0xffffff);
        scene.fog = null;
        gridHelper.visible = false;
        renderer.render(scene, camera);

        const srcCanvas = renderer.domElement;
        const rect = srcCanvas.getBoundingClientRect();
        const scaleX = srcCanvas.width / rect.width;
        const scaleY = srcCanvas.height / rect.height;
        const clampedW = Math.min(Math.round(bb.w * scaleX), srcCanvas.width);
        const clampedH = Math.min(Math.round(bb.h * scaleY), srcCanvas.height);

        const offCanvas = document.createElement('canvas');
        offCanvas.width = clampedW;
        offCanvas.height = clampedH;
        const offCtx = offCanvas.getContext('2d');
        offCtx.drawImage(srcCanvas, Math.round((bb.x - rect.left) * scaleX), Math.round((bb.y - rect.top) * scaleY), clampedW, clampedH, 0, 0, clampedW, clampedH);
        const dataURL = offCanvas.toDataURL('image/png');

        scene.background = prevBg;
        scene.fog = prevFog;
        gridHelper.visible = prevGridVisible;
        renderer.render(scene, camera);

        fetch('/api-fastapi/extract', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: dataURL })
        }).then(response => response.arrayBuffer())
          .then(arrayBuffer => {
              const loader = new GLTFLoader();
              loader.parse(arrayBuffer, '', (gltf) => {
                  scene.add(gltf.scene);
              });
          });
    } catch (err) {
        console.error('[SYSTEM_ERR] Snapshot failed:', err.message);
    }
}</code></pre>
                            </div>
                            <div class="font-mono text-[9px] text-neutral-500 mt-2">// Scenario 1 Client-Side Viewport Slicing</div>
                        </div>
                    </div>
                </section>

                <!-- SECTION 13: FIGURE 12 (METHODOLOGY IMAGE - DBSE MASKING) -->
                <section id="section-13" class="scrolly-section">
                    <div class="w-full max-w-6xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center floating-pane">
                        <!-- Left column: Image -->
                        <div class="lg:col-span-7 flex flex-col justify-center items-center">
                            <div class="font-mono text-[10px] text-cyan-400 tracking-[0.3em] uppercase mb-4 text-glow-cyan">// VISUAL ARCHIVE // FIGURE 12</div>
                            <div class="relative overflow-hidden bg-transparent rounded-xl border border-white/5 p-2 flex justify-center items-center max-w-full max-h-[60vh]">
                                <img src="/img/12.png" alt="Figure 12" class="max-w-full max-h-[55vh] object-contain rounded-lg shadow-2xl">
                            </div>
                            <div class="font-mono text-[10px] text-neutral-400 mt-4 text-center tracking-wide uppercase">// Figure 12: Deep Splat Excavation (DBSE) Frustum Raycasting & Masking</div>
                        </div>
                        <!-- Right column: Algorithm -->
                        <div class="lg:col-span-5 flex flex-col justify-center text-left">
                            <div class="font-mono text-[10px] text-cyan-400 mb-2 tracking-wider uppercase">// Algorithm 1: DBSE Viewport Slicing & Injection</div>
                            <div class="p-3.5 rounded-lg bg-neutral-950/40 border border-white/5 font-mono text-[9px] text-neutral-300 overflow-y-auto max-h-[40vh] shadow-inner leading-relaxed space-y-1">
                                <div><strong>Require:</strong> User selection box $B_{2D} = (x, y, w, h)$, Camera Matrix $C$, 3D Scene $S$</div>
                                <div><strong>Ensure:</strong> Transmitted viewport slice $I_{crop}$ and injected 3D mesh $M_{glb}$</div>
                                <div class="border-t border-white/10 my-1.5"></div>
                                <div class="pl-2">1: <strong>Initialize</strong> interactive 2D canvas overlay linked to mouse coordinates</div>
                                <div class="pl-2">2: <strong>If</strong> Mouse drag event detected <strong>then</strong></div>
                                <div class="pl-4">3: Update $B_{2D} \leftarrow$ dynamic $(x, y, w, h)$ bounds</div>
                                <div class="pl-4">4: Render selection rectangle on overlay</div>
                                <div class="pl-2">5: <strong>End If</strong></div>
                                <div class="pl-2">6: <strong>If</strong> Mouse release event detected <strong>then</strong></div>
                                <div class="pl-4">7: Disable $S$ environmental variables (fog, grid, ambient light)</div>
                                <div class="pl-4">8: Render clean, unobstructed frame of $S$</div>
                                <div class="pl-4">9: Map $B_{2D}$ bounds to absolute WebGL coordinates $(p_x, p_y, p_w, p_h)$</div>
                                <div class="pl-4">10: $I_{crop} \leftarrow$ Extract pixels from canvas buffer at mapped bounds</div>
                                <div class="pl-4">11: Restore $S$ environmental variables</div>
                                <div class="pl-4">12: <strong>Transmit</strong> $I_{crop}$ payload to <code>/api-fastapi/extract</code> via POST</div>
                                <div class="pl-4">13: <strong>Await</strong> HTTP Response $\rightarrow$ ArrayBuffer $A_{glb}$</div>
                                <div class="pl-4">14: $M_{glb} \leftarrow$ Parse GLTF geometry from $A_{glb}$</div>
                                <div class="pl-4">15: Calculate target centroid $C_{target}$ derived from $C$ forward vector</div>
                                <div class="pl-4">16: Translate $M_{glb}$ to $C_{target}$ and apply dimension normalization</div>
                                <div class="pl-4">17: Inject $M_{glb}$ into $S$ and update rendering loop</div>
                                <div class="pl-2">18: <strong>End If</strong></div>
                            </div>
                            <div class="font-mono text-[9px] text-neutral-500 mt-2">// Localized Depth & Masking Logic</div>
                        </div>
                    </div>
                </section>

                <!-- SECTION 14: CONCLUSION -->
                <section id="section-14" class="scrolly-section">
                    <div class="w-full max-w-5xl mx-auto px-6 md:px-12 flex flex-col justify-center floating-pane text-white text-center">
                        <div class="font-mono text-[10px] text-cyan-400 tracking-[0.3em] uppercase mb-3 text-glow-cyan">// CONCLUSION SUMMARY</div>
                        <h2 class="font-mono uppercase text-3xl md:text-4xl font-black mb-6">Conclusion</h2>
                        <p class="leading-relaxed text-neutral-300 text-xs md:text-sm max-w-4xl mx-auto mb-4 font-sans text-justify md:text-center font-normal">
                            As spatial computing and generative artificial intelligence converge, the necessity for robust, secure, and highly optimized integration architectures becomes paramount. The Vectra Spatial Computing Protocol successfully bridges the gap between high-fidelity digital twins and localized generative AI pipelines. By enforcing a decoupled, asynchronous client-server architecture, it isolates the visual presentation layer from the heavy tensor operations of the inference backend, ensuring that real-time spatial navigability (maintaining 30–60 FPS) is never compromised by computational latency on constrained edge hardware (strictly within an 8GB VRAM threshold).
                        </p>
                        <p class="leading-relaxed text-neutral-300 text-xs md:text-sm max-w-4xl mx-auto font-sans text-justify md:text-center font-normal">
                            Furthermore, the Deep Splat Excavation (DBSE) algorithm resolves the critical spatial occlusion problem via non-destructive, shader-level volumetric masking, allowing synthetic assets to be surgically injected into digitized spaces without permanent alteration of the point cloud. This lays the groundwork for embedding definitive mathematical safeguards, such as Control Barrier Functions (CBFs), directly in the spatial rendering pipeline to guarantee physical alignment and collision security.
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
                            <ul class="font-mono text-[10px] md:text-[12px] text-white space-y-3 max-h-[300px] overflow-y-auto pr-2 leading-relaxed">
                                <li class="text-white font-medium">[1] Mildenhall et al. (2020) - <em class="text-neutral-200">NeRF: Representing Scenes as Neural Radiance Fields for View Synthesis</em> (ECCV).</li>
                                <li class="text-white font-medium">[2] Rabby & Zhang (2024) - <em class="text-neutral-200">BeyondPixels: A Comprehensive Review of the Evolution of Neural Radiance Fields</em> (arXiv).</li>
                                <li class="text-white font-medium">[3] Jain et al. (2021) - <em class="text-neutral-200">Putting NeRF on a Diet: Semantically Consistent Few-Shot View Synthesis</em> (ICCV).</li>
                                <li class="text-white font-medium">[4] Niemeyer et al. (2022) - <em class="text-neutral-200">RegNeRF: Regularizing Neural Radiance Fields for View Synthesis from Sparse Inputs</em> (CVPR).</li>
                                <li class="text-white font-medium">[5] Tang et al. (2024) - <em class="text-neutral-200">DreamGaussian: Generative Gaussian Splatting for Efficient 3D Content Creation</em> (ICLR).</li>
                                <li class="text-white font-medium">[6] Luiten et al. (2023) - <em class="text-neutral-200">Dynamic 3D Gaussians: Tracking by Persistent Dynamic View Synthesis</em> (arXiv).</li>
                                <li class="text-white font-medium">[7] Tang et al. (2024) - <em class="text-neutral-200">LGM: Large Multi-View Gaussian Model for High-Resolution 3D Content Creation</em> (arXiv).</li>
                                <li class="text-white font-medium">[8] Xiang et al. (2025) - <em class="text-neutral-200">Native and Compact Structured Latents for 3D Generation</em> (arXiv).</li>
                                <li class="text-white font-medium">[9] He et al. (2025) - <em class="text-neutral-200">SparseFlex: High-Resolution and Arbitrary-Topology 3D Shape Modeling</em> (arXiv).</li>
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
</body>

</html>
