import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/supabase';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        // Get product details and verify access
        const { data: product, error: productError } = await supabase
            .from('products')
            .select('*')
            .eq('id', params.id)
            .single();
            
        if (productError || !product) {
            return NextResponse.json(
                { error: 'Product not found' },
                { status: 404 }
            );
        }

        // Get the format from query params
        const { searchParams } = new URL(request.url);
        const format = searchParams.get('format') || 'glb';

        // Handle the model path correctly
        if (!product.model_path) {
            return NextResponse.json(
                { error: 'Model path not found' },
                { status: 404 }
            );
        }

        // For external URLs, redirect to them directly
        if (product.model_path.startsWith('http')) {
            return NextResponse.redirect(product.model_path);
        }

        // Clean up the storage path
        const storagePath = product.model_path.includes('product-models/') 
            ? product.model_path.replace('product-models/', '')
            : product.model_path;

        // Get the file from storage
        const { data: fileData, error: storageError } = await supabase
            .storage
            .from('product-models')
            .download(storagePath);

        if (storageError) {
            console.error('Storage error:', storageError);
            return NextResponse.json(
                { error: 'File not found in storage', details: storageError.message },
                { status: 404 }
            );
        }

        // Set appropriate headers based on format
        const headers = new Headers();
        switch (format) {
            case 'glb':
                headers.set('Content-Type', 'model/gltf-binary');
                headers.set('Content-Disposition', `attachment; filename="${product.name}.glb"`);
                break;
            case 'fbx':
                headers.set('Content-Type', 'application/octet-stream');
                headers.set('Content-Disposition', `attachment; filename="${product.name}.fbx"`);
                break;
            default:
                headers.set('Content-Type', 'application/octet-stream');
                headers.set('Content-Disposition', `attachment; filename="${product.name}.${format}"`);
        }

        // Allow cross-origin for 3D software
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
        headers.set('Access-Control-Allow-Headers', 'Content-Type');

        return new NextResponse(fileData, { headers });
    } catch (error) {
        console.error('Download error:', error);
        return NextResponse.json(
            { error: 'Download failed', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
} 