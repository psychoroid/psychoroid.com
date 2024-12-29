import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

interface ConvertSTEPRequest {
    url: string;
}

export async function POST(request: Request) {
    try {
        const { url }: ConvertSTEPRequest = await request.json();
        
        // Create temporary directory
        const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'step-conversion-'));
        const objPath = path.join(tempDir, 'model.obj');
        const stepPath = path.join(tempDir, 'model.step');

        try {
            // Download the OBJ file
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to download OBJ file');
            const objData = await response.text();
            await fs.writeFile(objPath, objData);

            // Convert OBJ to STEP using FreeCAD (you need to have FreeCAD installed)
            const freecadScript = `
import FreeCAD
import Import
import ImportGui
import Part

# Import OBJ
ImportGui.insert("${objPath.replace(/\\/g, '\\\\')}", "Unnamed")

# Get all objects
objects = FreeCAD.ActiveDocument.Objects

# Export as STEP
Import.export(objects, "${stepPath.replace(/\\/g, '\\\\')}")
`;

            const scriptPath = path.join(tempDir, 'convert.py');
            await fs.writeFile(scriptPath, freecadScript);

            // Execute FreeCAD in headless mode
            await execAsync(`freecadcmd -c "${scriptPath}"`);

            // Read the converted STEP file
            const stepData = await fs.readFile(stepPath);

            // Clean up
            await fs.rm(tempDir, { recursive: true, force: true });

            // Return the STEP data
            return new NextResponse(stepData, {
                headers: {
                    'Content-Type': 'application/octet-stream',
                    'Content-Disposition': 'attachment; filename=converted.step'
                }
            });

        } finally {
            // Ensure cleanup in case of error
            await fs.rm(tempDir, { recursive: true, force: true }).catch(console.error);
        }

    } catch (error) {
        console.error('STEP conversion error:', error);
        return NextResponse.json({ 
            success: false, 
            error: 'STEP conversion failed: ' + (error as Error).message 
        }, { status: 500 });
    }
} 