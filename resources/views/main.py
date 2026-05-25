from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from gradio_client import Client, handle_file
import base64
import os
import uuid
from rembg import remove

import sys
sys.path.append("/www/wwwroot/vectra.parsabe.com/TripoSR")

import io
import torch
import rembg
import numpy as np
from PIL import Image
import tempfile
from tsr.system import TSR
from tsr.utils import remove_background, resize_foreground, to_gradio_3d_orientation

app = FastAPI(title="VoidMesh AI Core")

# CORS Configuration: Allows Laravel (localhost) to communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # NOTE: Update with strict Laravel origin in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SegmentRequest(BaseModel):
    image: str # base64 encoded image from canvas
    x: float
    y: float

class Generate3DRequest(BaseModel):
    image: str # masked base64 image
    prompt: str

class ExtractRequest(BaseModel):
    image: str # base64 encoded snapshot

# 1. Force Background Removal onto the RTX 4060 GPU if available
device = "cuda:0" if torch.cuda.is_available() else "cpu"
providers = ['CUDAExecutionProvider'] if torch.cuda.is_available() else ['CPUExecutionProvider']

print(f"[SYSTEM] CUDA availability: {torch.cuda.is_available()} | Device: {device}")
print(f"[SYSTEM] Initializing rembg session with providers: {providers}")
rembg_session = rembg.new_session("u2net", providers=providers)

# 2. Initialize TripoSR Model globally
print("[SYSTEM] Loading TripoSR to CUDA/CPU...")
model = TSR.from_pretrained(
    "stabilityai/TripoSR",
    config_name="config.yaml",
    weight_name="model.ckpt"
)

# VRAM Optimization for RTX 4060 (8GB)
model.renderer.set_chunk_size(8192)
# Force 3D Engine to GPU/CPU
model.to(device)
print("[SYSTEM] All Systems online. Engine ready.")

@app.post("/segment")
async def segment_object(req: SegmentRequest):
    print(f"[x] Target acquired at coordinates: {req.x}, {req.y}")
    
    # TODO: Connect to your Hugging Face SAM Model Space
    # Example:
    # client = Client("your-username/sam-space-name")
    # result = client.predict(req.image, req.x, req.y)
    
    return {"masked_image": req.image, "status": "Sector isolated"}

@app.post("/generate-3d")
async def generate_3d(req: Generate3DRequest):
    print(f"[x] Initiating mesh splice for prompt: {req.prompt}")
    
    # TODO: Connect to your DreamGaussian Hugging Face Space
    # Example: client = Client("jiaxiangc/dreamgaussian")
    
    output_dir = "outputs"
    os.makedirs(output_dir, exist_ok=True)
    mock_path = os.path.join(output_dir, "extracted_mesh.glb")
    with open(mock_path, "w") as f: f.write("mock binary data") # MOCK FILE

    return {"model_url": f"/storage/{mock_path}", "status": "Mesh generated"}

@app.post("/api/extract")
@app.post("/extract")
async def extract_object(req: ExtractRequest):
    """
    Spatially extract 3D mesh from bounding box image using local rembg + local TripoSR.
    """
    temp_glb_path = None
    try:
        # 1. Decode base64 PNG
        if "," in req.image:
            base64_data = req.image.split(",")[1]
        else:
            base64_data = req.image
        image_bytes = base64.b64decode(base64_data)

        # Convert to PIL Image
        image = Image.open(io.BytesIO(image_bytes)).convert("RGBA")

        # 2. Local Background Removal
        no_bg_image = remove_background(image, rembg_session=rembg_session, force=True)

        # 3. Resize foreground to standard 0.85 ratio
        resized_image = resize_foreground(no_bg_image, 0.85)

        # 4. Fill background with gray (0.5)
        img_np = np.array(resized_image).astype(np.float32) / 255.0
        img_np = img_np[:, :, :3] * img_np[:, :, 3:4] + (1.0 - img_np[:, :, 3:4]) * 0.5
        final_image = Image.fromarray((img_np * 255.0).astype(np.uint8))

        # 5. Forge 3D Geometry
        print("[SYSTEM] Forging 3D Mesh locally...")
        with torch.no_grad():
            scene_codes = model([final_image], device=device)
            meshes = model.extract_mesh(scene_codes, True) 

        mesh = meshes[0]
        # Rotate mesh to the correct orientation for Gradio/ThreeJS
        mesh = to_gradio_3d_orientation(mesh)

        temp_dir = tempfile.mkdtemp()
        temp_glb_path = os.path.join(temp_dir, f"extract_{uuid.uuid4().hex}.glb")
        mesh.export(temp_glb_path)
        
        if not os.path.exists(temp_glb_path):
            raise HTTPException(status_code=500, detail="TripoSR failed to generate GLB model.")

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