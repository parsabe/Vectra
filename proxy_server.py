import os
import sys
import httpx
import logging
from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging to write clearly to the terminal
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("VPS_Proxy")

app = FastAPI(title="Vectra VPS Traffic Controller")

# Strict CORS Configuration to allow cross-server/cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SummonRequest(BaseModel):
    prompt: str

class ConfigUpdateRequest(BaseModel):
    fal_key: str | None = None
    replicate_key: str | None = None
    local_engine_url: str | None = None

def get_local_engine_url() -> str:
    return os.getenv("LOCAL_ENGINE_URL", "http://127.0.0.1:8001")

async def generate_image_fal(prompt: str, client: httpx.AsyncClient) -> str:
    """Generate 2D image via Fal.ai API (Stable Diffusion 3.5 Large)"""
    fal_key = os.getenv("FAL_KEY")
    if not fal_key:
        raise ValueError("FAL_KEY environment variable is missing.")

    logger.info("Connecting to Fal.ai API for Stable Diffusion 3.5...")
    url = "https://fal.run/fal-ai/stable-diffusion-v35-large"
    headers = {
        "Authorization": f"Key {fal_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "prompt": prompt,
        "image_size": "square_hd",
        "sync_mode": True
    }
    
    response = await client.post(url, headers=headers, json=payload, timeout=60.0)
    if response.status_code != 200:
        raise HTTPException(
            status_code=502, 
            detail=f"Fal.ai generation failed: status {response.status_code} - {response.text}"
        )
    
    data = response.json()
    images = data.get("images", [])
    if not images or not images[0].get("url"):
        raise HTTPException(status_code=502, detail="Fal.ai response contains no image URL.")
    
    return images[0]["url"]

async def generate_image_replicate(prompt: str, client: httpx.AsyncClient) -> str:
    """Generate 2D image via Replicate API (Stable Diffusion 3)"""
    replicate_token = os.getenv("REPLICATE_API_TOKEN")
    if not replicate_token:
        raise ValueError("REPLICATE_API_TOKEN environment variable is missing.")

    logger.info("Initiating Replicate API prediction...")
    url = "https://api.replicate.com/v1/predictions"
    headers = {
        "Authorization": f"Token {replicate_token}",
        "Content-Type": "application/json"
    }
    # Stable Diffusion 3 model version
    payload = {
        "version": "528a60cd30131ea3a1e1a08418c2245b73650cfa823d4e082c974c0e64c619b0", 
        "input": {
            "prompt": prompt
        }
    }
    
    response = await client.post(url, headers=headers, json=payload, timeout=30.0)
    if response.status_code != 201:
        raise HTTPException(
            status_code=502, 
            detail=f"Replicate initiation failed: status {response.status_code} - {response.text}"
        )
    
    prediction = response.json()
    prediction_id = prediction["id"]
    status_url = prediction["urls"]["get"]
    
    # Poll Replicate prediction status until succeeded
    logger.info(f"Replicate Job {prediction_id} created. Polling for results...")
    import asyncio
    for attempt in range(30):
        await asyncio.sleep(2.0)
        status_res = await client.get(status_url, headers=headers, timeout=10.0)
        if status_res.status_code != 200:
            continue
        
        job = status_res.json()
        status = job.get("status")
        logger.info(f"Replicate Job Status: {status} (Attempt {attempt+1})")
        
        if status == "succeeded":
            output = job.get("output")
            if isinstance(output, list) and len(output) > 0:
                return output[0]
            elif isinstance(output, str):
                return output
            raise HTTPException(status_code=502, detail="Replicate output is empty or invalid.")
        elif status in ["failed", "canceled"]:
            raise HTTPException(status_code=502, detail=f"Replicate generation ended in status: {status}")
            
    raise HTTPException(status_code=504, detail="Replicate prediction timed out.")

@app.get("/api/config")
async def get_config():
    fal_key = os.getenv("FAL_KEY", "")
    replicate_key = os.getenv("REPLICATE_API_TOKEN", "")
    local_url = get_local_engine_url()
    
    def mask_key(k: str) -> str:
        if not k:
            return ""
        if len(k) <= 8:
            return "****"
        return f"{k[:4]}...{k[-4:]}"
        
    return {
        "fal_key_masked": mask_key(fal_key),
        "replicate_key_masked": mask_key(replicate_key),
        "local_engine_url": local_url,
        "fal_key_configured": bool(fal_key),
        "replicate_key_configured": bool(replicate_key)
    }

@app.post("/api/config")
async def update_config(req: ConfigUpdateRequest):
    try:
        # Load existing .env or create one
        env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
        env_lines = []
        if os.path.exists(env_path):
            with open(env_path, "r", encoding="utf-8") as f:
                env_lines = f.readlines()
        
        # Convert lines to dict
        env_dict = {}
        for line in env_lines:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                parts = line.split("=", 1)
                k = parts[0].strip()
                v = parts[1].strip().strip('"').strip("'")
                env_dict[k] = v
        
        # Update values
        if req.fal_key is not None:
            env_dict["FAL_KEY"] = req.fal_key
            os.environ["FAL_KEY"] = req.fal_key
        if req.replicate_key is not None:
            env_dict["REPLICATE_API_TOKEN"] = req.replicate_key
            os.environ["REPLICATE_API_TOKEN"] = req.replicate_key
        if req.local_engine_url is not None:
            env_dict["LOCAL_ENGINE_URL"] = req.local_engine_url
            os.environ["LOCAL_ENGINE_URL"] = req.local_engine_url
            
        # Write back to .env
        with open(env_path, "w", encoding="utf-8") as f:
            for k, v in env_dict.items():
                f.write(f'{k}="{v}"\n')
                
        return {"status": "success", "message": "Configuration updated successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/summon")
async def summon_protocol(req: SummonRequest):
    """
    Summoning Protocol: 
    1. Append system formatting prompt.
    2. Request 2D image via Fal.ai or Replicate.
    3. Forward generated URL to Local Machine's extract API.
    """
    # Build System-level prompt modification
    enhanced_prompt = f"A high-quality 3D asset of {req.prompt}, white background, orthographic projection, front view."
    logger.info(f"[SUMMON] Received prompt: '{req.prompt}'")
    logger.info(f"[SUMMON] Enhanced Prompt: '{enhanced_prompt}'")
    
    local_url = get_local_engine_url()
    
    async with httpx.AsyncClient() as client:
        # Step 1: Generate 2D image from Brain
        image_url = None
        try:
            if os.getenv("FAL_KEY"):
                image_url = await generate_image_fal(enhanced_prompt, client)
            elif os.getenv("REPLICATE_API_TOKEN"):
                image_url = await generate_image_replicate(enhanced_prompt, client)
            else:
                logger.error("[SYSTEM ERROR] Summoning Failed: No API credentials found in environment.")
                print("Summoning Failed: No API credentials found in environment")
                raise HTTPException(
                    status_code=500, 
                    detail="Summoning Failed: Environment lacks FAL_KEY or REPLICATE_API_TOKEN."
                )
        except Exception as e:
            logger.error(f"[SYSTEM ERROR] Summoning Failed during 2D generation: {str(e)}")
            print(f"Summoning Failed: {str(e)}")
            return {"status": "Summoning Failed", "error": str(e)}

        logger.info(f"[SUMMON] 2D Image Generated Successfully: {image_url}")
        
        # Step 2: Forward 2D Image to Local 3D Forge
        logger.info(f"[SUMMON] Forwarding image URL to Local Forge: {local_url}/api/extract")
        try:
            local_response = await client.post(
                f"{local_url}/api/extract",
                json={"image": image_url},
                timeout=180.0 # High timeout for mesh generation
            )
            
            if local_response.status_code != 200:
                logger.error(f"[SYSTEM ERROR] Local Forge returned status {local_response.status_code}: {local_response.text}")
                print(f"Summoning Failed: Local Forge returned status {local_response.status_code}")
                return {"status": "Local Forge Extraction Failed", "detail": local_response.text}
            
            logger.info("[SUMMON] Successful local mesh extraction completed.")
            print("Summoning Succeeded - 3D Mesh Received")
            # Return GLB mesh bytes directly, matching local response payload
            return Response(content=local_response.content, media_type="model/gltf-binary")
            
        except httpx.RequestError as exc:
            logger.error(f"[SYSTEM ERROR] Connection to Local Forge failed: {exc}")
            print(f"Summoning Failed: Connection to Local Forge failed: {exc}")
            return {"status": "Connection to Local Forge failed", "error": str(exc)}

if __name__ == "__main__":
    import uvicorn
    # Bind to port 8000 on the VPS
    uvicorn.run(app, host="0.0.0.0", port=8000)
