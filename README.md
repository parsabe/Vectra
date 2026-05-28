<div align="center">
  
  <br>

  <br><br>
  # VECTRA
  <br>
 

  <p><b>The Quarantine Matrix, Constraining Neural Hallucinations in 3D Gaussian Environments</b></p>
  
 <img src="https://github.com/parsabe/Vectra/blob/master/logo.png?raw=true">
 <br>
  <p>
    <a href="#abstract">Abstract</a> •
    <a href="#video-demonstration">Video Demo</a> •
    <a href="#introduction">Introduction</a> •
    <a href="#system-architecture">Architecture</a> •
    <a href="#hardware-requirements">Requirements</a>
  </p>

  <br>
  
  <img src="https://img.shields.io/badge/Python-3.10+-blue?logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/Three.js-WebGL-black?logo=three.js&logoColor=white" alt="Three.js">
  <img src="https://img.shields.io/badge/FastAPI-Backend-009688?logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/VRAM-8GB_Max-ff00ff?logo=nvidia&logoColor=white" alt="VRAM">

  <br><br>
</div>

## Abstract

<p>As spatial computing and generative artificial intelligence converge, the necessity for robust, secure, and highly optimized integration architectures becomes strictly paramount. The <b>Vectra Spatial Computing Protocol</b> bridges the gap between high-fidelity digital twins and localized generative AI pipelines without relying on external cloud computing.</p>

<p>By enforcing a strictly decoupled, asynchronous client-server architecture, computationally expensive deep learning models (U<sup>2</sup>-Net, SDXL-Lightning, and TripoSR) are successfully orchestrated on constrained consumer-grade edge hardware (strictly within an <b>8GB VRAM</b> threshold). Furthermore, the introduction of the <b>Deep Splat Excavation (DBSE)</b> algorithm resolves critical spatial occlusion problems inherent to dense Gaussian Splatting environments. This methodology lays the foundational groundwork for embedding definitive mathematical safeguards into the next generation of spatial rendering pipelines.</p>

<br>

## Video Demonstration

<p>To fully observe the interactive nature of the Vectra Spatial Computing Protocol, including the non-blocking rendering loop and the real-time VRAM orchestration, please review the supplementary video demonstration below.</p>

<div align="center">
  <video width="700" controls>
    <source src="YOUR_VIDEO_URL_HERE.mp4" type="video/mp4">
    Your browser does not support the HTML5 video tag.
  </video>
  <br>
  <i>System demonstration and real-time execution.</i>
</div>

<br>

## Introduction

<p>Integrating AI-generated 3D assets into scanned physical environments traditionally suffers from severe hardware bottlenecks and geometric visual artifacts (such as Z-fighting and object clipping). Vectra solves this through two primary computational innovations:</p>

<ul>
  <li><b>The Edge-Computed Generative Pipeline:</b> A robust local GPU Forge that aggressively manages memory cycles to prevent Out-Of-Memory (OOM) kernel panics when generating meshes via localized Text-to-3D and Image-to-3D prompts.</li>
  <li><b>Non-Destructive Spatial Masking:</b> Instead of permanently altering source point cloud data, the system mathematically calculates volumetric raycast bounds to dynamically override shader alpha values, allowing new assets to spawn seamlessly within the original spatial coordinates.</li>
</ul>

<br>

## System Architecture

<table>
  <tr>
    <td width="50%">
      <h3>Client-Side (The Viewport)</h3>
      <p>Operates entirely within a standard web browser. Strictly responsible for real-time interaction, asynchronous data transmission, and physics calculations.</p>
      <ul>
        <li><b>Rendering:</b> <code>Three.js</code> + <code>gsplat.js</code></li>
        <li><b>Physics Middleware:</b> <code>Cannon.js</code></li>
        <li><b>UI Architecture:</b> Asynchronous Glassmorphism</li>
      </ul>
    </td>
    <td width="50%">
      <h3>Server-Side (The GPU Forge)</h3>
      <p>An autonomous Python backend hosting the neural networks, systematically managing VRAM flushing protocols.</p>
      <ul>
        <li><b>Computational Core:</b> <code>FastAPI</code></li>
        <li><b>Semantic Masking:</b> <code>U2-Net</code></li>
        <li><b>Volumetric Forging:</b> <code>TripoSR</code></li>
        <li><b>Latent Generation:</b> <code>SDXL-Lightning</code> (FP16)</li>
      </ul>
    </td>
  </tr>
</table>

<br>

## Hardware Requirements

<blockquote>
  <p><b>Strict Memory Constraint Warning:</b> This protocol is explicitly engineered to run on standard edge-computing hardware. Attempting to bypass the sequential loading limits without sufficient hardware architecture will result in immediate CUDA OOM errors.</p>
</blockquote>

<ul>
  <li><b>GPU:</b> NVIDIA RTX 4060 (or equivalent architecture)</li>
  <li><b>VRAM:</b> 8GB Minimum (System usage peaks at roughly 7.8GB during TripoSR inference)</li>
  <li><b>OS:</b> Ubuntu / Debian-based Linux environment is highly recommended for deep learning and tensor dependencies.</li>
</ul>

<br>

## Core Features & Protocols

<details>
  <summary><kbd>► Click to expand: Deep Splat Excavation (DBSE)</kbd></summary>
  <p>
    <br>
    The DBSE protocol solves spatial occlusion by capturing a 2D bounding box from the viewport, mapping it to absolute WebGL coordinates, and transmitting the pure pixel data payload. The rendering engine evaluates the spatial coordinates of every Gaussian splat against the defined 3D volume, dynamically overriding opacity values to zero in the fragment shader to mathematically excavate a clean void for the newly generated asset.
  </p>
</details>

<details>
  <summary><kbd>► Click to expand: Sequential VRAM Orchestration</kbd></summary>
  <p>
    <br>
    To guarantee the 8GB VRAM limit is never breached, neural networks are strictly prevented from loading simultaneously. The system loads SDXL-Lightning in half-precision (FP16), generates the 2D tensor, entirely purges the cache via <code>torch.cuda.empty_cache()</code>, invokes the garbage collector, and only reallocates memory for TripoSR once the GPU ceiling returns to baseline.
  </p>
</details>

<br>

## Citation & Research

<p>If you utilize this protocol, the VRAM orchestration logic, or the Deep Splat Excavation (DBSE) algorithm in your own academic research, please cite the associated Master's Thesis:</p>

<pre><code>@mastersthesis{vectra2026,
  author  = {Parsa Besharat},
  title   = {Vectra: The Quarantine Matrix, Constraining Neural Hallucinations in 3D Gaussian Environment},
  school  = {TU Bergakademie Freiberg},
  year    = {2026}
}
</code></pre>

<br>

<div align="center">
  <p><i>Engineered for secure, edge-computed spatial artificial intelligence.</i></p>
</div>
