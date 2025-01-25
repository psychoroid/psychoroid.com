from typing import Optional
from .image import ImageData
from loguru import logger
import tempfile
from .v1.cad_code_generator import generate_cad

def render_image_to_file(image_data: ImageData, output_path: Optional[str] = None) -> str:
    with tempfile.NamedTemporaryFile(suffix=f".{image_data.type}", delete=False) as f:
        f.write(image_data.data)
        logger.info("Temporarily rendered image to {}", f.name)
        return f.name

def generate_cad_from_text(prompt: str, output_path: Optional[str] = None) -> str:
    try:
        # Generate CAD model from text
        result = generate_cad(prompt, output_path)
        return result
    except Exception as e:
        logger.error("Refinement failed. Skipping to the next step.")
        raise e 
