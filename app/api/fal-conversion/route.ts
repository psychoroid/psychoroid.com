import { NextResponse } from 'next/server';
import { fal } from "@fal-ai/client"
import { ImageGenerationInput } from '@/types/fal';

type GeometryFileFormat = "glb" | "usdz" | "fbx" | "obj" | "stl";
type Quality = "high" | "medium" | "low" | "extra-low";
type ConditionMode = "fuse" | "concat";
type Material = "PBR" | "Shaded";
type Tier = "Regular" | "Sketch";
type Addons = "HighPack";

interface Hyper3dRodinInput {
  prompt?: string;
  input_image_urls?: string[];
  condition_mode?: ConditionMode;
  seed?: number;
  geometry_file_format?: GeometryFileFormat;
  material?: Material;
  quality?: Quality;
  tier?: Tier;
  use_hyper?: boolean;
  addons?: Addons;
  bbox_condition?: [number, number, number];
}

interface Hyper3dRodinOutput {
  model_mesh: {
    url: string;
    file_size?: number;
    file_name?: string;
    content_type?: string;
  };
  model_textures?: Array<{
    url: string;
    content_type?: string;
    file_name?: string;
    file_size?: number;
    width?: number;
    height?: number;
  }>;
}

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
    const prompt = data.get('prompt') as string;
    
    // Quality optimization: default to high for best results
    const quality = (data.get('quality') as string) || 'high';
    const format = (data.get('format') as string) || 'glb';
    
    // Only enable these for explicit high-quality needs
    const useHighPack = false; // Disabled by default to keep costs reasonable
    const useHyper = true;     // Enabled by default as it gives good quality boost for minimal cost
    
    // Enhanced prompt for better quality
    const qualityTerms = "ultra high detail, professional 3D model, perfect topology, clean geometry, high-resolution textures"
    const enhancedPrompt = prompt && image 
      ? `${prompt}. ${qualityTerms}. Ensure professional quality suitable for real-time rendering and close-up viewing.`
      : prompt ? `${prompt}. ${qualityTerms}. Generate with emphasis on detail preservation.` 
      : undefined;

    let imageUrl: string | undefined;
    
    // Upload image if provided
    if (image) {
      imageUrl = await retryOperation(
        async () => {
          const uploadPromise = Promise.race([
            fal.storage.upload(image),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Upload timeout')), 60000)
            )
          ]);
          return await uploadPromise as string;
        }
      );
    }

    // Optimized model configuration for quality
    const modelConfig: Hyper3dRodinInput = {
      ...(imageUrl && { input_image_urls: [imageUrl] }),
      ...(enhancedPrompt && { prompt: enhancedPrompt }),
      condition_mode: imageUrl ? "concat" : undefined,
      geometry_file_format: format as GeometryFileFormat,
      material: "PBR",
      quality: quality as Quality,
      tier: "Regular" as Tier,
      use_hyper: useHyper,
      seed: Math.floor(Math.random() * 65535),
      bbox_condition: [1024, 1024, 1024] // Balanced dimensions for better quality
    };

    // Adjust timeout based on input type and quality
    const baseTimeout = 180000; // 3 minutes base
    const timeoutDuration = baseTimeout * (
      (quality === 'high' ? 2 : quality === 'medium' ? 1.5 : 1) * 
      (image && prompt ? 1.3 : 1)
    );

    // Call FAL.AI Hyper3D model with retries and better error handling
    const result = await retryOperation(async () => {
      const conversionPromise = new Promise(async (resolve, reject) => {
        try {
          const result = await fal.subscribe("fal-ai/hyper3d/rodin", {
            input: modelConfig,
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
        setTimeout(() => reject(new Error('Conversion timeout')), timeoutDuration)
      );

      return await Promise.race([conversionPromise, timeoutPromise]) as { data: Hyper3dRodinOutput };
    });

    // Validate the result
    if (!result?.data?.model_mesh?.url) {
      throw new Error('Invalid model data received from FAL.AI');
    }

    return NextResponse.json({
      modelUrl: result.data.model_mesh.url,
      modelTextures: result.data.model_textures || [],
      quality,
      format,
      useHyper,
      optimizedSettings: {
        quality,
        useHyper,
        enhancedPrompt: !!enhancedPrompt,
        inputType: image && prompt ? 'both' : image ? 'image' : 'prompt',
        estimatedQuality: (
          (quality === 'high' ? 1 : quality === 'medium' ? 0.8 : 0.6) *
          (useHyper ? 1.2 : 1) *
          (image && prompt ? 1.3 : 1)  // Better results when using both
        )
      }
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
        { error: 'Failed to generate valid 3D model. Please try with a different image or prompt.' },
        { status: 422 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to process request',
        details: error.message || 'Unknown error'
      },
      { status: error.status || 500 }
    );
  }
} 