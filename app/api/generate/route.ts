import { fal } from "@fal-ai/client"
import { NextResponse } from 'next/server'
import type { ImageGenerationInput } from "@/types/fal"

interface FalImage {
  url: string;
  content_type?: string;
}

interface FalOutput {
  images: FalImage[];
  seed?: number;
  has_nsfw_concepts?: boolean[];
}

// Configure FAL client with server-side API key
fal.config({
  credentials: process.env.FAL_KEY
})

// Maximum retries for failed requests
const MAX_RETRIES = 2
const TIMEOUT = 90000 // 90 seconds timeout

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function generateWithRetry(params: ImageGenerationInput, retryCount = 0): Promise<{ data: FalOutput; requestId: string }> {
  try {
    const enhancedPrompt = `${params.prompt}, single complete object, centered composition, full view, entire object visible, professional product photography, pure white background, bright studio lighting, 3D printable, clear edges, high detail, jewelry catalog style, floating display`
    const negativePrompt = "dark, shadows, cropped, partial view, cutoff edges, multiple objects, busy background, text, blur, noise, distortion, floating, thin structures, artistic effects, incomplete objects, body parts, mannequin"

    const result = await Promise.race([
      fal.subscribe("fal-ai/stable-diffusion-v35-medium", {
        input: {
          prompt: enhancedPrompt,
          negative_prompt: negativePrompt,
          num_images: params.num_images || 4,
          image_size: params.image_size || "square_hd",
          guidance_scale: params.guidance_scale || 7.5,
          num_inference_steps: params.num_inference_steps || 30,
          enable_safety_checker: true,
          seed: Math.floor(Math.random() * 2147483647),
          output_format: "jpeg"
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            console.log(`Generation progress: ${update.logs.map(log => log.message).join(", ")}`)
          }
        }
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), TIMEOUT)
      )
    ]) as { data: FalOutput; requestId: string }

    // If no result data, try to get it from queue
    if (!result.data) {
      const queueResult = await fal.queue.result("fal-ai/stable-diffusion-v35-medium", {
        requestId: result.requestId
      })
      return queueResult as { data: FalOutput; requestId: string }
    }

    return result
  } catch (error: any) {
    if (error.message === 'Request timeout') {
      // On timeout, try to get result from queue before giving up
      if (error.requestId) {
        try {
          const queueResult = await fal.queue.result("fal-ai/stable-diffusion-v35-medium", {
            requestId: error.requestId
          })
          return queueResult as { data: FalOutput; requestId: string }
        } catch (queueError) {
          console.error('Queue result fetch failed:', queueError)
        }
      }
      throw new Error('Request timeout')
    }

    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying request (${retryCount + 1}/${MAX_RETRIES})...`)
      await sleep(Math.pow(2, retryCount) * 1000)
      return generateWithRetry(params, retryCount + 1)
    }
    throw error
  }
}

export async function POST(request: Request) {
  try {
    const params: ImageGenerationInput = await request.json()
    const result = await generateWithRetry(params)
    const data = result.data

    if (!data || !data.images) {
      throw new Error('No images generated')
    }

    return NextResponse.json({
      images: data.images.map((img: { url: string; content_type?: string }) => ({
        url: img.url,
        content_type: img.content_type || 'image/jpeg'
      })),
      prompt: params.prompt,
      num_images: params.num_images || 4,
      seed: data.seed,
      has_nsfw_concepts: data.has_nsfw_concepts
    })
  } catch (error: any) {
    console.error('Image generation error:', error)
    
    const errorMessage = error.message === 'Request timeout' 
      ? 'Request timed out. Please try again.'
      : 'Image generation failed'
    
    const statusCode = error.message === 'Request timeout' ? 504 : 500
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
} 