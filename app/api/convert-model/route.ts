import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/supabase';
import type { ConversionRequest } from '@/types/api';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { USDZExporter } from 'three/examples/jsm/exporters/USDZExporter';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import * as THREE from 'three';

export async function POST(request: Request) {
    try {
        const body: ConversionRequest = await request.json();
        const { modelUrl, format, quality, productId } = body;

        // For USDZ conversion
        if (format === 'usdz') {
            try {
                // Create a Three.js scene
                const scene = new THREE.Scene();
                
                // Add lights
                const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
                const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
                scene.add(ambientLight);
                scene.add(directionalLight);

                // Load the GLB model
                const loader = new GLTFLoader();
                const gltf = await new Promise<GLTF>((resolve, reject) => {
                    loader.load(
                        modelUrl,
                        (gltf) => resolve(gltf),
                        undefined,
                        (error) => reject(error)
                    );
                });

                // Add the model to the scene
                scene.add(gltf.scene);

                // Convert to USDZ
                const exporter = new USDZExporter();
                const usdzBuffer = await exporter.parse(scene);

                // Upload to Supabase
                const fileName = `converted-${productId}-${Date.now()}.usdz`;
                const { data, error } = await supabase.storage
                    .from('converted-models')
                    .upload(fileName, new Blob([usdzBuffer], { type: 'model/vnd.usdz+zip' }), {
                        contentType: 'model/vnd.usdz+zip',
                        cacheControl: '3600',
                        upsert: true
                    });

                if (error) throw error;

                // Get the public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('converted-models')
                    .getPublicUrl(fileName);

                return NextResponse.json({ 
                    success: true, 
                    convertedUrl: publicUrl 
                });

            } catch (error) {
                console.error('USDZ conversion error:', error);
                return NextResponse.json({ 
                    success: false, 
                    error: 'USDZ conversion failed: ' + (error as Error).message 
                }, { status: 500 });
            }
        }

        return NextResponse.json({ 
            success: false, 
            error: 'Unsupported format' 
        }, { status: 400 });

    } catch (error) {
        console.error('Conversion error:', error);
        return NextResponse.json({ 
            success: false, 
            error: 'Conversion failed: ' + (error as Error).message 
        }, { status: 500 });
    }
} 