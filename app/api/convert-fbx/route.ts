import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export async function POST(req: Request) {
    try {
        const { url } = await req.json();
        
        if (!url) {
            return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
        }

        // Download the GLB file
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch GLB file');
        }

        // Create temp directory if it doesn't exist
        const tempDir = path.join(process.cwd(), 'tmp');
        await fs.mkdir(tempDir, { recursive: true });

        // Save GLB file
        const glbPath = path.join(tempDir, 'temp.glb');
        const fbxPath = path.join(tempDir, 'output.fbx');
        
        await fs.writeFile(glbPath, Buffer.from(await response.arrayBuffer()));

        // Convert using external tool (you'll need to install this)
        await execAsync(`gltf2fbx ${glbPath} ${fbxPath}`);

        // Read the converted file
        const fbxData = await fs.readFile(fbxPath);

        // Cleanup
        await Promise.all([
            fs.unlink(glbPath),
            fs.unlink(fbxPath)
        ]);

        return new NextResponse(fbxData, {
            headers: {
                'Content-Type': 'application/octet-stream',
                'Content-Disposition': 'attachment; filename="model.fbx"'
            }
        });

    } catch (error) {
        console.error('FBX conversion error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Conversion failed' },
            { status: 500 }
        );
    }
} 