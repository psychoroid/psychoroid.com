import { NextResponse } from 'next/server';
import { fal } from "@fal-ai/client"
import { ImageGenerationInput, Hyper3dRodinOutput } from '@/types/fal';

if (!process.env.FAL_KEY) {
  throw new Error('Missing FAL_KEY environment variable');
}

fal.config({
  credentials: process.env.FAL_KEY
});

// Set a longer timeout for the API route
export const maxDuration = 300; // 5 minutes

// Retry helper function
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 2000
): Promise<T> {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      // Only retry on specific errors that might be temporary
      if (!error.message?.includes('timeout') && 
          !error.message?.includes('rate limit') && 
          !error.message?.includes('queue')) {
        throw error;
      }
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  throw lastError;
}

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const image = data.get('image') as File;
    
    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    // Upload the image to FAL storage with retries
    const imageUrl = await retryOperation(
      async () => {
        const uploadPromise = Promise.race([
          fal.storage.upload(image),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Upload timeout')), 30000)
          )
        ]);
        return await uploadPromise as string;
      }
    );

    // Call FAL.AI Hyper3D model with retries and better error handling
    const result = await retryOperation(async () => {
      const conversionPromise = new Promise(async (resolve, reject) => {
        try {
          const result = await fal.subscribe("fal-ai/hyper3d/rodin", {
            input: {
              input_image_urls: [imageUrl],
              condition_mode: "concat",
              geometry_file_format: "glb",
              material: "PBR",
              quality: "medium",
              tier: "Regular"
            },
            logs: true,
            onQueueUpdate: (update: any) => {
              if (update.status === "IN_PROGRESS") {
                console.log('Progress:', update.logs?.map((log: { message: string }) => log.message));
              } else if (update.status === "ERROR" || update.status === "FAILED") {
                reject(new Error(update.logs?.map((log: { message: string }) => log.message).join(', ') || 'Conversion failed'));
              }
            },
          }) as { data: Hyper3dRodinOutput };
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Conversion timeout')), 240000)
      );

      return await Promise.race([conversionPromise, timeoutPromise]) as { data: Hyper3dRodinOutput };
    });

    // Validate the result
    if (!result?.data?.model_mesh?.url) {
      throw new Error('Invalid model data received from FAL.AI');
    }

    return NextResponse.json({
      modelUrl: result.data.model_mesh.url,
      textures: result.data.model_textures || []
    });

  } catch (error: any) {
    console.error('Error in FAL conversion:', error);
    
    // Return appropriate status codes based on error type
    if (error.message?.includes('timeout')) {
      return NextResponse.json(
        { error: 'Operation timed out. Please try again.' },
        { status: 504 }
      );
    }
    
    if (error.message?.includes('rate limit')) {
      return NextResponse.json(
        { error: 'Service is currently busy. Please try again in a few minutes.' },
        { status: 429 }
      );
    }

    if (error.message?.includes('queue')) {
      return NextResponse.json(
        { error: 'Service is currently processing too many requests. Please try again later.' },
        { status: 503 }
      );
    }

    if (error.message?.includes('Invalid model data')) {
      return NextResponse.json(
        { error: 'Failed to generate valid 3D model. Please try with a different image.' },
        { status: 422 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to process image',
        details: error.message || 'Unknown error'
      },
      { status: error.status || 500 }
    );
  }
} 