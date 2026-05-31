import os
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["VECLIB_MAXIMUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"

import sys
import time
import base64
import uuid
import io
import tempfile
import torch
torch.set_num_threads(1)
torch.set_num_interop_threads(1)
import rembg
import numpy as np
from PIL import Image
from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Append TripoSR to path
sys.path.append("/www/wwwroot/vectra.parsabe.com/TripoSR")
from tsr.system import TSR
from tsr.utils import remove_background, resize_foreground, to_gradio_3d_orientation

# Initialize FastAPI
app = FastAPI(title="Vectra Unified Local Engine")

# Configure CORS with allow_credentials=False to prevent initialization crash
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SummonRequest(BaseModel):
    prompt: str

class ExtractRequest(BaseModel):
    image: str

# 1. Device and Model Setup
device = "cuda:0" if torch.cuda.is_available() else "cpu"
providers = ['CUDAExecutionProvider'] if torch.cuda.is_available() else ['CPUExecutionProvider']
torch_dtype = torch.float16 if torch.cuda.is_available() else torch.float32

print(f"[SYSTEM] CUDA status: {torch.cuda.is_available()} | Device: {device}")
print(f"[SYSTEM] Initializing rembg session on {providers}...")
rembg_session = rembg.new_session("u2net", providers=providers)

print("[SYSTEM] Loading TripoSR model locally...")
model = TSR.from_pretrained(
    "stabilityai/TripoSR",
    config_name="config.yaml",
    weight_name="model.ckpt"
)
if device.startswith("cuda"):
    model.renderer.set_chunk_size(8192)
else:
    model.renderer.set_chunk_size(1024)
model.to(device)

t2i_pipe = None

def load_t2i_pipeline():
    global t2i_pipe
    if t2i_pipe is None:
        from diffusers import StableDiffusionPipeline, LCMScheduler
        print(f"[SYSTEM] Loading LCM Dreamshaper v7 locally to {device}...")
        if device.startswith("cuda"):
            t2i_pipe = StableDiffusionPipeline.from_pretrained(
                "SimianLuo/LCM_Dreamshaper_v7",
                torch_dtype=torch.float16,
                safety_checker=None
            )
        else:
            t2i_pipe = StableDiffusionPipeline.from_pretrained(
                "SimianLuo/LCM_Dreamshaper_v7",
                torch_dtype=torch.float32,
                safety_checker=None
            )
        # Set LCM scheduler
        t2i_pipe.scheduler = LCMScheduler.from_config(t2i_pipe.scheduler.config)
        t2i_pipe.to(device)
        print(f"[SYSTEM] LCM Dreamshaper v7 loaded successfully on {device}.")

# 2. Pipeline functions
def generate_image(prompt: str) -> Image.Image:
    load_t2i_pipeline()
    # Enhance the prompt format for optimal 3D generation quality
    enhanced_prompt = f"A high-quality 3D asset of {prompt}, white background, orthographic projection, front view."
    print(f"[BRAIN] Generating 2D image for prompt: '{enhanced_prompt}'...")
    
    with torch.inference_mode():
        # LCM model generates great images in 2 steps with guidance_scale=8.0
        # By reducing resolution to 256x256, we speed up generation by 3x on CPU
        result = t2i_pipe(
            prompt=enhanced_prompt,
            num_inference_steps=2,
            guidance_scale=8.0,
            width=256,
            height=256
        )
        image = result.images[0]
    return image

def generate_3d(image: Image.Image):
    print("[BODY] Running background removal...")
    if image.mode != "RGBA":
        image = image.convert("RGBA")
    
    # Aggressive background removal using rembg session directly
    no_bg_image = rembg.remove(image, session=rembg_session)
    
    print("[BODY] Cropping empty transparent space tightly...")
    bbox = no_bg_image.getbbox()
    if bbox:
        cropped_image = no_bg_image.crop(bbox)
    else:
        cropped_image = no_bg_image
        
    print("[BODY] Resizing foreground & compositing onto solid white background...")
    # TripoSR requires a solid background to infer geometry correctly.
    # Paste the foreground centered onto a pure white (255, 255, 255) background.
    # The foreground is resized to fit within 85% of the target canvas.
    target_size = 512
    max_dim = int(target_size * 0.85)
    
    w, h = cropped_image.size
    scale = max_dim / max(w, h)
    new_w = int(w * scale)
    new_h = int(h * scale)
    
    resample_filter = getattr(Image, "Resampling", Image).LANCZOS
    resized_fg = cropped_image.resize((new_w, new_h), resample_filter)
    
    white_bg = Image.new("RGBA", (target_size, target_size), (255, 255, 255, 255))
    paste_x = (target_size - new_w) // 2
    paste_y = (target_size - new_h) // 2
    white_bg.alpha_composite(resized_fg, (paste_x, paste_y))
    final_image = white_bg.convert("RGB")
    
    print("[BODY] Extracting 3D geometry locally...")
    with torch.no_grad():
        scene_codes = model([final_image], device=device)
        meshes = model.extract_mesh(scene_codes, True) 

    mesh = meshes[0]
    mesh = to_gradio_3d_orientation(mesh)
    return mesh

# 3. FastAPI Endpoints
@app.post("/summon")
@app.post("/api/summon")
def summon_protocol(req: SummonRequest):
    try:
        # Phase 1: Brain (T2I)
        image = generate_image(req.prompt)
        torch.cuda.empty_cache() # Avoid VRAM OOM
        
        # Phase 2: Body (I23D)
        mesh = generate_3d(image)
        torch.cuda.empty_cache() # Clean up VRAM
        
        temp_dir = tempfile.mkdtemp()
        temp_glb_path = os.path.join(temp_dir, f"summon_{uuid.uuid4().hex}.glb")
        mesh.export(temp_glb_path)
        
        if not os.path.exists(temp_glb_path):
            raise HTTPException(status_code=500, detail="TripoSR failed to generate GLB.")
            
        with open(temp_glb_path, "rb") as f:
            glb_bytes = f.read()
            
        # Clean up
        os.remove(temp_glb_path)
        os.rmdir(temp_dir)
        
        print("[SYSTEM] Summon request completed successfully.")
        return Response(content=glb_bytes, media_type="model/gltf-binary")
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/extract")
@app.post("/extract")
def extract_object(req: ExtractRequest):
    temp_glb_path = None
    try:
        # 1. Decode base64 PNG or fetch from URL
        if req.image.startswith("http://") or req.image.startswith("https://"):
            import httpx
            with httpx.Client() as client:
                res = client.get(req.image, timeout=30.0)
                if res.status_code != 200:
                    raise HTTPException(status_code=400, detail=f"Failed to fetch image: status {res.status_code}")
                image_bytes = res.content
        else:
            if "," in req.image:
                base64_data = req.image.split(",")[1]
            else:
                base64_data = req.image
            image_bytes = base64.b64decode(base64_data)

        image = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
        
        mesh = generate_3d(image)
        torch.cuda.empty_cache() # Clean up VRAM
        
        temp_dir = tempfile.mkdtemp()
        temp_glb_path = os.path.join(temp_dir, f"extract_{uuid.uuid4().hex}.glb")
        mesh.export(temp_glb_path)
        
        if not os.path.exists(temp_glb_path):
            raise HTTPException(status_code=500, detail="TripoSR failed to generate GLB.")
            
        with open(temp_glb_path, "rb") as f:
            glb_bytes = f.read()
            
        return Response(content=glb_bytes, media_type="model/gltf-binary")
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if temp_glb_path and os.path.exists(temp_glb_path):
            try:
                os.remove(temp_glb_path)
                os.rmdir(os.path.dirname(temp_glb_path))
            except Exception:
                pass

@app.get("/api/config")
async def get_config():
    return {
        "fal_key_masked": "LOCAL_MODE",
        "replicate_key_masked": "LOCAL_MODE",
        "local_engine_url": "http://127.0.0.1:8001",
        "fal_key_configured": True,
        "replicate_key_configured": False
    }

# 4. CLI Execution Mode
def run_cli(prompt: str):
    print(f"=== Running Local Text-to-3D Offline Generation ===")
    print(f"Prompt: '{prompt}'")
    
    # Run pipeline
    image = generate_image(prompt)
    torch.cuda.empty_cache()
    
    mesh = generate_3d(image)
    torch.cuda.empty_cache()
    
    # Save output files
    output_dir = "output"
    os.makedirs(output_dir, exist_ok=True)
    
    timestamp = int(time.time())
    img_path = os.path.join(output_dir, f"output_{timestamp}.png")
    glb_path = os.path.join(output_dir, f"output_{timestamp}.glb")
    
    image.save(img_path)
    mesh.export(glb_path)
    
    print(f"\n[SUCCESS] Generation complete!")
    print(f"- 2D Image saved to: {img_path}")
    print(f"- 3D GLB Model saved to: {glb_path}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        # CLI Mode
        prompt_arg = " ".join(sys.argv[1:])
        run_cli(prompt_arg)
    else:
        # Server Mode
        import uvicorn
        uvicorn.run(app, host="127.0.0.1", port=8001)