from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from gradio_client import Client, handle_file
import base64
import os
import uuid
from rembg import remove

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
    Spatially extract 3D mesh from bounding box image using local rembg + cloud TripoSR.
    """
    temp_png_path = None
    try:
        # 1. Decode base64 PNG
        if "," in req.image:
            base64_data = req.image.split(",")[1]
        else:
            base64_data = req.image
        image_bytes = base64.b64decode(base64_data)

        # 2. Local Background Removal
        transparent_bytes = remove(image_bytes)

        # Write to temporary file for gradio_client
        temp_dir = "/tmp/vectra"
        os.makedirs(temp_dir, exist_ok=True)
        temp_png_path = os.path.join(temp_dir, f"extract_{uuid.uuid4().hex}.png")
        with open(temp_png_path, "wb") as f:
            f.write(transparent_bytes)

        # 3. Cloud TripoSR generation
        space_name = "Pheerakarn/TripoSR"
        client = Client(space_name)
        
        result = client.predict(
            handle_file(temp_png_path),
            256,
            api_name="/generate"
        )
        
        obj_path, glb_path = result
        
        if not glb_path or not os.path.exists(glb_path):
            raise HTTPException(status_code=500, detail="TripoSR space failed to return GLB model.")

        with open(glb_path, "rb") as f:
            glb_bytes = f.read()

        return Response(content=glb_bytes, media_type="model/gltf-binary")

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if temp_png_path and os.path.exists(temp_png_path):
            try:
                os.remove(temp_png_path)
            except Exception:
                pass