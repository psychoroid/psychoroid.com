import { NextResponse } from 'next/server'

const ZOO_API_URL = process.env.ZOO_API_URL
const ZOO_API_TOKEN = process.env.ZOO_API_TOKEN

export async function GET(req: Request) {
    if (!ZOO_API_URL || !ZOO_API_TOKEN) {
        return NextResponse.json({ 
            error: 'Server configuration error',
            status: 'error'
        }, { status: 500 })
    }

    try {
        // Get the generation ID from the URL
        const { searchParams } = new URL(req.url)
        const generationId = searchParams.get('id')

        if (!generationId) {
            return NextResponse.json({
                error: 'Generation ID is required',
                status: 'error'
            }, { status: 400 })
        }

        const response = await fetch(`${ZOO_API_URL}/user/text-to-cad/${generationId}`, {
            headers: {
                'Authorization': `Bearer ${ZOO_API_TOKEN}`,
                'Accept': 'application/json'
            }
        })

        if (!response.ok) {
            return NextResponse.json({ 
                error: 'Failed to check generation status',
                status: 'error'
            }, { status: response.status })
        }

        const result = await response.json()

        if (result.status === 'failed') {
            return NextResponse.json({ 
                error: result.error || 'Failed to generate CAD model',
                status: 'error'
            }, { status: 400 })
        }

        if (result.status === 'completed' && result.outputs) {
            const glbData = result.outputs['source.glb']
            if (!glbData) {
                return NextResponse.json({ 
                    error: 'No GLB file generated',
                    status: 'error'
                }, { status: 400 })
            }

            return NextResponse.json({
                modelUrl: glbData,
                dataUrl: glbData,
                format: 'glb',
                modelId: result.id,
                status: 'success',
                message: 'Model generated successfully'
            })
        }

        // Still processing
        return NextResponse.json({
            status: result.status,
            message: 'Generation in progress'
        })

    } catch (error) {
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            status: 'error'
        }, { status: 500 })
    }
} 