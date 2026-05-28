<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vectra: System Hub Portal</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <!-- Google Fonts for Monospaced & Technical Aesthetic -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Orbitron:wght@700;900&display=swap" rel="stylesheet">

    <!-- Compiled assets via Laravel Vite -->
    @vite(['resources/css/app.css', 'resources/js/main.js'])
</head>

<body class="bg-black text-white overflow-hidden select-none scanlines relative portal-page-body">

    <!-- 1. The 3D Background (Night City & Flying Cars) -->
    <canvas id="bg-city" class="fixed inset-0 w-full h-full z-[-10] block outline-none"></canvas>

    <!-- 2. The Dark Overlay (The Hovering Cover) -->
    <div class="fixed inset-0 w-full h-full bg-black/75 z-[-5] pointer-events-none"></div>

    <!-- 3. The UI Layout (The Command Terminal) -->
    <main class="w-screen h-screen flex items-center justify-center relative z-10 px-4">
        
        <div id="terminal-pane" class="w-full max-w-lg glass-terminal p-8 rounded-2xl border border-white/5 opacity-0 scale-95 shadow-2xl relative">
            
            <!-- Terminal Header -->
            <div class="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping shadow-[0_0_8px_#00f3ff]"></span>
                    <span class="text-[10px] tracking-widest text-cyan-400 font-bold uppercase">// CORE_LINK_ESTABLISHED</span>
                </div>
                <span class="text-[9px] text-neutral-500 uppercase tracking-wider font-mono">SYS_V_1.2.0</span>
            </div>

            <!-- Portal Title -->
            <div class="text-center mb-8">
                <h1 class="font-mono text-glow-cyan tracking-wider font-black text-2xl md:text-3xl uppercase mb-1">
                    VECTRA // SYSTEM_HUB
                </h1>
                <p class="text-neutral-500 text-[10px] uppercase tracking-[0.2em]">
                    Applied AI Security Frameworks & Spatial Assets
                </p>
            </div>

            <!-- 4. Navigation Links Stack -->
            <nav class="flex flex-col gap-4 font-mono text-sm md:text-base">
                
                <a href="/demo" class="glitch-link py-3 text-neutral-300 tracking-widest uppercase" data-text="[ SYSTEM_DEMO ]">
                    [ SYSTEM_DEMO ]
                </a>

                <a href="/presentation" class="glitch-link py-3 text-neutral-300 tracking-widest uppercase" data-text="[ ARCHITECTURE_PRESENTATION ]">
                    [ ARCHITECTURE_PRESENTATION ]
                </a>

                <a href="https://github.com/parsabe/Vectra" target="_blank" class="glitch-link py-3 text-neutral-300 tracking-widest uppercase" data-text="[ SOURCE_CODE ]">
                    [ SOURCE_CODE ]
                </a>

                <a href="https://www.researchgate.net" target="_blank" class="glitch-link py-3 text-neutral-300 tracking-widest uppercase" data-text="[ RESEARCH_PAPER ]">
                    [ RESEARCH_PAPER ]
                </a>

                <a href="https://www.youtube.com" target="_blank" class="glitch-link py-3 text-neutral-300 tracking-widest uppercase" data-text="[ MEDIA_LOG ]">
                    [ MEDIA_LOG ]
                </a>

            </nav>

            <!-- Terminal Footer -->
            <div class="border-t border-white/5 pt-5 mt-6 flex justify-between items-center text-[8px] md:text-[9px] text-neutral-600 uppercase tracking-widest font-mono">
                <span>TU BERGAKADEMIE FREIBERG</span>
                <span>UPLINK_ID: VEC_PORTAL_CORE</span>
            </div>

        </div>

    </main>

</body>

</html>
