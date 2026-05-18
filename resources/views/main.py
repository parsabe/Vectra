from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from gradio_client import Client
import base64
import os

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