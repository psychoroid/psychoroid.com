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

        console.log('Checking generation status:', generationId)

        // First, check the generation status
        const statusResponse = await fetch(`${ZOO_API_URL}/user/text-to-cad/${generationId}`, {
            headers: {
                'Authorization': `Bearer ${ZOO_API_TOKEN}`,
                'Accept': 'application/json'
            }
        })

        if (!statusResponse.ok) {
            return NextResponse.json({ 
                error: 'Failed to check generation status',
                status: 'error'
            }, { status: statusResponse.status })
        }

        const statusResult = await statusResponse.json()
        console.log('Generation status:', statusResult.status)

        if (statusResult.status === 'failed') {
            return NextResponse.json({ 
                error: statusResult.error || 'Failed to generate CAD model',
                status: 'error'
            }, { status: 400 })
        }

        if (statusResult.status === 'completed') {
            // If completed, get the GLB data from the outputs
            console.log('Generation completed, processing GLB data...')
            
            if (!statusResult.outputs || !statusResult.outputs['source.glb']) {
                return NextResponse.json({ 
                    error: 'No GLB file in outputs',
                    status: 'error'
                }, { status: 400 })
            }

            // Get the GLB data from outputs
            const glbData = statusResult.outputs['source.glb']
            
            // Convert to base64 if not already
            let base64Data = typeof glbData === 'string' ? glbData : Buffer.from(glbData).toString('base64')
            
            // Ensure it has the correct data URL prefix
            if (!base64Data.startsWith('data:')) {
                base64Data = `data:model/gltf-binary;base64,${base64Data}`
            }

            console.log('GLB data processed successfully')

            return NextResponse.json({
                modelUrl: base64Data,
                format: 'glb',
                status: 'completed',
                message: 'Model generated successfully',
                id: generationId,
                details: {
                    format: 'glb',
                    size: base64Data.length,
                    timestamp: new Date().toISOString()
                }
            })
        }

        // Still processing
        return NextResponse.json({
            status: statusResult.status || 'in_progress',
            message: 'Generation in progress',
            id: generationId
        })

    } catch (error) {
        console.error('Error processing GLB data:', error)
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            status: 'error'
        }, { status: 500 })
    }
} 