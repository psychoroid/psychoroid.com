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

    // Enhance the prompt for better 3D printing-suitable results
    const enhancedPrompt = `${params.prompt}, single object, bright studio lighting, pure white background, 3D printable, clear edges, high detail, product photography`

    // Strengthen negative prompt to ensure clean, 3D-print-ready designs  
    const negativePrompt = "dark, shadows, multiple objects, busy background, text, blur, noise, distortion, cropped, floating, thin structures, artistic effects"

    const result = await fal.subscribe("fal-ai/stable-diffusion-v35-medium", {
      input: {
        prompt: enhancedPrompt,
        negative_prompt: negativePrompt,
        num_images: params.num_images || 2,
        image_size: params.image_size || "square_hd",
        guidance_scale: params.guidance_scale || 7,
        num_inference_steps: params.num_inference_steps || 30,
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
      num_images: 2
    })
  } catch (error) {
    console.error('Image generation error:', error)
    return NextResponse.json(
      { error: 'Image generation failed' },
      { status: 500 }
    )
  }
} 