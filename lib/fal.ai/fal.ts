import type { ImageGenerationInput, GenerationResponse } from "@/types/fal"
import { fal } from "@fal-ai/client"

// Function to generate images using server-side API
export async function generateImage(params: ImageGenerationInput): Promise<GenerationResponse> {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      throw new Error('Image generation request failed')
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error in generateImage:', error)
    throw error
  }
}

// Function to upload files to FAL.AI storage
export async function uploadFile(file: File): Promise<string> {
  try {
    const url = await fal.storage.upload(file);
    return url;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
} 