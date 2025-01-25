import argparse
import os
from cad3dify.pipeline import generate_step_from_text

def main():
    parser = argparse.ArgumentParser(description="Generate 3D CAD models from text descriptions")
    parser.add_argument("text_prompt", type=str, help="Text description of the desired 3D model")
    parser.add_argument("--output", "-o", type=str, default="output.step", help="Output STEP file path")
    parser.add_argument("--model", "-m", type=str, default="gpt", choices=["gpt", "claude", "gemini", "llama"], help="Model type to use")
    parser.add_argument("--refinements", "-r", type=int, default=3, help="Number of refinement iterations")
    
    args = parser.parse_args()
    
    # Ensure output directory exists
    os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
    
    # Generate the CAD model
    generate_step_from_text(
        text_prompt=args.text_prompt,
        output_filepath=args.output,
        num_refinements=args.refinements,
        model_type=args.model
    )
    
    print(f"Generated CAD model saved to: {args.output}")

if __name__ == "__main__":
    main() 