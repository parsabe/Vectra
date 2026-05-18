<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VECTRA | Neural 3D Interface</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">
    
    <!-- Tailwind & Model Viewer -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Strict ESM Import Map -->
    <script type="importmap">
    {
        "imports": {
            "gsplat": "https://unpkg.com/gsplat/dist/index.js"
        }
    }
    </script>
    
    <!-- Segregated Stylesheet -->
    <link rel="stylesheet" href="/css/vectra.css">
</head>
<body class="scanlines text-sm">
    <main class="bento-grid">
        <!-- Left: Holographic 3D Editor -->
        <section class="cyber-glass flex flex-col relative rounded">
            <header class="p-3 border-b border-cyan-900 flex justify-between">
                <span class="text-glow-cyan font-bold">SYS.HOLO_PROJECTION</span>
                <span class="text-xs text-cyan-700 uppercase">Status: Idle</span>
            </header>
            <div class="relative flex-grow">
                <canvas id="hologram-canvas" class="w-full h-full block cursor-crosshair"></canvas>
            </div>
        </section>

        <!-- Right: AI Co-Pilot Terminal -->
        <aside class="cyber-glass flex flex-col rounded">
            <header class="p-3 border-b border-cyan-900">
                <span class="text-glow-cyan font-bold">AI.CO-PILOT_LINK</span>
            </header>
            <div id="terminal-output" class="terminal-output flex flex-col gap-2">
                <div class="text-glow-green">> Neural Uplink Established...</div>
                <div class="text-cyan-600">> Awaiting target extraction coordinates.</div>
            </div>
            <!-- Isolated Mesh View -->
            <model-viewer id="mesh-viewer" class="neon-containment border-t border-b border-fuchsia-900" camera-controls auto-rotate shadow-intensity="1"></model-viewer>
            <div class="p-3 mt-auto border-t border-cyan-900 flex">
                <span class="mr-2 text-glow-cyan">></span>
                <input type="text" id="terminal-input" class="terminal-input" placeholder="Prompt override (e.g., Cyberpunk object)..." autocomplete="off">
            </div>
        </aside>
    </main>
    <script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js"></script>
    <script type="module" src="/js/vectra-core.mjs"></script>
</body>
</html>