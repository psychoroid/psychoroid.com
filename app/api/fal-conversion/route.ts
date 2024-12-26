import { NextResponse } from 'next/server';
import { fal } from "@fal-ai/client"
import { ImageGenerationInput, Hyper3dRodinOutput } from '@/types/fal';

if (!process.env.FAL_KEY) {
  throw new Error('Missing FAL_KEY environment variable');
}

fal.config({
  credentials: process.env.FAL_KEY
});

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

    // Upload the image to FAL storage
    const imageUrl = await fal.storage.upload(image);

    // Call FAL.AI Hyper3D model
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
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          console.log(update.logs?.map((log) => log.message));
        }
      },
    }) as { data: Hyper3dRodinOutput };

    return NextResponse.json({
      modelUrl: result.data.model_mesh.url,
      textures: result.data.model_textures || []
    });

  } catch (error: any) {
    console.error('Error in FAL conversion:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process image' },
      { status: 500 }
    );
  }
} 