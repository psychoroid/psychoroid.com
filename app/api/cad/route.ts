import { NextResponse } from 'next/server'

const POLLING_INTERVAL = 3000 // 3 seconds
const MAX_RETRIES = 20 // Maximum number of polling attempts
const ZOO_API_URL = process.env.ZOO_API_URL
const ZOO_API_TOKEN = process.env.ZOO_API_TOKEN

// Organic shape enhancement patterns
const ORGANIC_PATTERNS = {
    flower: {
        petals: {
            base: 'Create a flower with curved petals using bezier curves. Each petal should have a natural, flowing shape.',
            modifiers: [
                'Add gentle curves to create organic petal shapes',
                'Include natural variations in petal size and orientation',
                'Create smooth transitions between petals'
            ]
        },
        leaf: {
            base: 'Add naturally curved leaves with organic vein patterns',
            modifiers: [
                'Include stem with natural taper',
                'Add subtle texture to leaf surface',
                'Create asymmetric, life-like leaf shapes'
            ]
        }
    },
    organic: {
        modifiers: [
            'Add subtle surface variations for natural appearance',
            'Include gradual transitions between features',
            'Create asymmetric elements for natural look',
            'Use flowing curves instead of straight lines'
        ]
    }
}

interface OrganicParams {
    type?: 'flower' | 'leaf' | 'custom'
    petals?: number
    height?: number
    complexity?: 'simple' | 'medium' | 'complex'
    style?: 'natural' | 'stylized'
}

export async function POST(req: Request) {
    console.log('CAD API: Starting request processing')
    
    // Validate environment variables
    if (!process.env.ZOO_API_URL || !process.env.ZOO_API_TOKEN) {
        console.error('CAD API: Missing required environment variables')
        return Response.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Validate token format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(process.env.ZOO_API_TOKEN)) {
        console.error('CAD API: Invalid API token format')
        return Response.json({ error: 'Invalid API token format' }, { status: 500 })
    }

    try {
        const { prompt } = await req.json()
        console.log('CAD API: Received request parameters', { prompt })

        // First, create the text-to-cad request
        const response = await fetch(`${process.env.ZOO_API_URL}/ai/text-to-cad/glb`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${process.env.ZOO_API_TOKEN}`
            },
            body: JSON.stringify({
                prompt,
                formats: ['glb', 'step']  // Request GLB instead of GLTF
            })
        })

        if (!response.ok) {
            const errorData = await response.json()
            console.error('CAD API: Zoo API error response', errorData)
            return Response.json({ 
                error: `Zoo API Error: ${errorData.message || errorData.error || response.statusText}`,
                details: errorData
            }, { status: response.status })
        }

        const result = await response.json()
        console.log('CAD API: Initial Zoo API response:', result)

        // Poll for completion
        let finalResult = result
        let retries = 0
        while (!finalResult.completed_at && retries < MAX_RETRIES) {
            await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL))
            retries++
            
            console.log(`CAD API: Polling attempt ${retries}...`)
            
            const statusResponse = await fetch(`${process.env.ZOO_API_URL}/user/text-to-cad/${result.id}`, {
                headers: {
                    'Authorization': `Bearer ${process.env.ZOO_API_TOKEN}`,
                    'Accept': 'application/json'
                }
            })

            if (!statusResponse.ok) {
                const errorData = await statusResponse.json()
                console.error('CAD API: Status check failed:', errorData)
                throw new Error(`Failed to check CAD generation status: ${errorData.error || statusResponse.statusText}`)
            }
            
            finalResult = await statusResponse.json()
            console.log('CAD API: Current status:', finalResult.status)

            // If the model failed, throw error immediately
            if (finalResult.status === 'failed') {
                throw new Error(finalResult.error || 'CAD generation failed')
            }

            // If completed, break the loop
            if (finalResult.status === 'completed' && finalResult.outputs) {
                console.log('CAD API: Model completed')
                break
            }
        }

        if (retries >= MAX_RETRIES) {
            throw new Error('CAD generation timed out')
        }

        if (!finalResult.outputs) {
            throw new Error('No output files generated')
        }

        // Get the GLB file
        const glbData = finalResult.outputs['source.glb']
        if (!glbData) {
            throw new Error('No GLB file generated')
        }

        console.log('CAD API: Successfully generated model', {
            modelId: finalResult.id,
            hasGlb: true,
            dataLength: glbData.length
        })

        // Create a proper data URL for the GLB file
        const modelUrl = `data:model/gltf-binary;base64,${glbData}`

        return Response.json({
            modelUrl,
            format: 'glb',
            modelId: finalResult.id,
            message: 'Model generated successfully'
        })

    } catch (error) {
        console.error('CAD API: Error:', error)
        return Response.json({ 
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        }, { status: 500 })
    }
} 