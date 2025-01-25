import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'

// Initialize output directory
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'cad_output')
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

export async function POST(req: Request) {
    try {
        const { prompt } = await req.json()

        if (!prompt) {
            return NextResponse.json(
                { error: 'Missing prompt parameter' },
                { status: 400 }
            )
        }

        // Generate unique IDs for output files
        const stepId = uuidv4()
        const previewId = uuidv4()
        const stepFilePath = path.join(OUTPUT_DIR, `${stepId}.step`)
        const previewFilePath = path.join(OUTPUT_DIR, `${previewId}.png`)

        // Run cad3dify text-to-CAD generation
        const pythonProcess = spawn('poetry', [
            'run',
            'python',
            'cad3dify/scripts/text_cli.py',
            prompt,
            '--output', stepFilePath,
            '--model', 'claude',
            '--refinements', '3'
        ], {
            cwd: process.cwd(),
            env: {
                ...process.env,
                ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY
            }
        })

        // Handle process output
        let errorOutput = ''
        pythonProcess.stderr.on('data', (data) => {
            errorOutput += data.toString()
        })

        await new Promise((resolve, reject) => {
            pythonProcess.on('close', (code) => {
                if (code === 0) {
                    resolve(null)
                } else {
                    reject(new Error(`CAD generation failed: ${errorOutput}`))
                }
            })
        })

        // Return the file paths for the generated files
        return NextResponse.json({
            stepFile: `/cad_output/${stepId}.step`,
            previewImage: `/cad_output/${previewId}.png`,
            message: 'CAD model generated successfully'
        })
    } catch (error) {
        console.error('CAD generation error:', error)
        return NextResponse.json(
            { error: 'Failed to generate CAD model' },
            { status: 500 }
        )
    }
} 