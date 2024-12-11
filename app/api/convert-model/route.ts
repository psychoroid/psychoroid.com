import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/supabase';
import path from 'path';
import { 
    Document,
    NodeIO,
    transform,
    dedup,
    prune,
    draco,
    resample,
    quantize
} from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { meshopt } from '@gltf-transform/functions';
import draco3d from 'draco3d';

// Initialize IO
const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS);

// Helper function to load WASM file
async function loadWasmFile(filePath: string): Promise<ArrayBuffer> {
    try {
        const response = await fetch(filePath);
        if (!response.ok) throw new Error(`Failed to load WASM file: ${filePath}`);
        return await response.arrayBuffer();
    } catch (error) {
        console.error('Error loading WASM file:', error);
        throw error;
    }
}

export async function POST(req: Request) {
    try {
        const { modelUrl, format, quality, productId } = await req.json();

        if (!modelUrl || !format || !productId) {
            return NextResponse.json(
                { error: 'Missing required parameters' }, 
                { status: 400 }
            );
        }

        // Ensure modelUrl is a full URL
        const fullModelUrl = modelUrl.startsWith('http') 
            ? modelUrl 
            : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${modelUrl}`;

        // Download the model
        const response = await fetch(fullModelUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch model: ${response.statusText}`);
        }
        
        const modelBuffer = await response.arrayBuffer();

        // Initialize Draco modules
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        
        // @ts-ignore - Ignore type checking for Draco module creation
        const decoder = await draco3d.createDecoderModule();
        // @ts-ignore - Ignore type checking for Draco module creation
        const encoder = await draco3d.createEncoderModule();

        io.registerDependencies({
            'draco3d.decoder': decoder,
            'draco3d.encoder': encoder,
        });

        // Read the GLB file
        let document;
        try {
            document = await io.readBinary(new Uint8Array(modelBuffer));
        } catch (error: unknown) {
            console.error('Error reading model:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error reading model';
            throw new Error(`Failed to read model: ${errorMessage}`);
        }

        // Apply optimizations based on quality
        const optimizationLevel = quality === 'high' ? {
            quantizePosition: 14,
            quantizeNormal: 10,
            quantizeTexcoord: 12,
            quantizeColor: 8,
            quantizeGeneric: 12,
            meshopt: true
        } : {
            quantizePosition: 12,
            quantizeNormal: 8,
            quantizeTexcoord: 10,
            quantizeColor: 8,
            quantizeGeneric: 10,
            meshopt: false
        };

        // Apply transformations
        await document.transform(
            prune(),
            dedup(),
            draco(),
            ...(optimizationLevel.meshopt ? [meshopt()] : []),
            resample(),
            quantize()
        );

        // Convert to desired format
        const convertedBuffer = await io.writeBinary(document);

        // Upload to Supabase
        const fileName = `converted-${productId}-${Date.now()}.${format.toLowerCase()}`;
        const { data, error } = await supabase.storage
            .from('converted-models')
            .upload(fileName, convertedBuffer, {
                contentType: 'model/gltf-binary',
                cacheControl: '3600',
                upsert: true
            });

        if (error) {
            console.error('Supabase upload error:', error);
            throw error;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('converted-models')
            .getPublicUrl(fileName);

        return NextResponse.json({ 
            success: true,
            convertedUrl: publicUrl 
        });

    } catch (error) {
        console.error('Error converting model:', error);
        return NextResponse.json(
            { 
                error: error instanceof Error ? error.message : 'Conversion failed',
                details: error
            }, 
            { status: 500 }
        );
    }
} 