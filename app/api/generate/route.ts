import { fal } from "@fal-ai/client"
import { NextResponse } from 'next/server'
import type { ImageGenerationInput } from "@/types/fal"

// Configure FAL client with server-side API key
fal.config({
  credentials: process.env.FAL_KEY
})

export async function POST(request: Request) {
  try {
    const params: ImageGenerationInput = await request.json()

    // Enhance the prompt for better 3D-suitable results
    const enhancedPrompt = `${params.prompt}, single object, product photography on pure white background, centered composition, ultra detailed, studio lighting setup, 8k uhd, photorealistic, commercial quality, sharp focus, crystal clear, perfectly isolated, professional product shot`

    // Strengthen negative prompt to ensure clean, isolated objects
    const negativePrompt = "multiple objects, background details, patterns, shadows, text, watermarks, blur, noise, grain, distortion, deformation, artifacts, cropped, incomplete, floating, unrealistic proportions, artistic effects, filters, background texture, environment, scene, multiple views, duplicate, symmetrical, mirrored"

    const result = await fal.subscribe("fal-ai/stable-diffusion-v35-medium", {
      input: {
        prompt: enhancedPrompt,
        negative_prompt: negativePrompt,
        num_images: params.num_images || 2,
        image_size: params.image_size || "square_hd",
        guidance_scale: params.guidance_scale || 4.5,
        num_inference_steps: params.num_inference_steps || 40,
        enable_safety_checker: true,
        seed: Math.floor(Math.random() * 2147483647)
      }
    })

    const data = result.data
    
    if (!data || !data.images) {
      throw new Error('No images generated')
    }

    return NextResponse.json({
      images: data.images.map(img => ({
        url: img.url,
        content_type: img.content_type || 'image/jpeg'
      })),
      prompt: enhancedPrompt,
      num_images: params.num_images || 2
    })
  } catch (error) {
    console.error('Image generation error:', error)
    return NextResponse.json(
      { error: 'Image generation failed' },
      { status: 500 }
    )
  }
} 