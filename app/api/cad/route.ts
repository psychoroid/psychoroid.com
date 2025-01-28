import { NextResponse } from 'next/server'

const POLLING_INTERVAL = 3000 // 3 seconds
const MAX_RETRIES = 20 // Maximum number of polling attempts
const ZOO_API_URL = process.env.ZOO_API_URL
const ZOO_API_TOKEN = process.env.ZOO_API_TOKEN

export async function POST(req: Request) {
    console.log('CAD API: Starting request processing')
    
    // Validate environment variables
    if (!process.env.ZOO_API_URL || !process.env.ZOO_API_TOKEN) {
        console.error('CAD API: Missing required environment variables')
        return Response.json({ 
            error: 'Server configuration error',
            status: 'error'
        }, { status: 500 })
    }

    try {
        const { prompt } = await req.json()
        
        // Validate prompt
        if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
            return Response.json({
                error: 'Please provide a detailed description of the CAD model you want to create',
                status: 'error'
            }, { status: 400 })
        }

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
                formats: ['glb'],  // Only request GLB format
                output_format: 'glb'  // Explicitly request GLB output
            })
        })

        if (!response.ok) {
            const errorData = await response.json()
            console.error('CAD API: Zoo API error response', errorData)
            return Response.json({ 
                error: errorData.message || 'Failed to generate CAD model',
                status: 'error',
                details: errorData
            }, { status: response.status })
        }

        const result = await response.json()
        console.log('CAD API: Initial Zoo API response:', {
            id: result.id,
            status: result.status,
            hasOutputs: !!result.outputs
        })

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
                throw new Error('Failed to check generation status')
            }
            
            finalResult = await statusResponse.json()
            console.log('CAD API: Current status:', {
                status: finalResult.status,
                hasOutputs: !!finalResult.outputs,
                outputKeys: finalResult.outputs ? Object.keys(finalResult.outputs) : []
            })

            // If the model failed, return error immediately
            if (finalResult.status === 'failed') {
                return Response.json({ 
                    error: finalResult.error || 'Failed to generate CAD model',
                    status: 'error'
                }, { status: 400 })
            }

            // If completed, break the loop
            if (finalResult.status === 'completed' && finalResult.outputs) {
                break
            }
        }

        if (retries >= MAX_RETRIES) {
            return Response.json({ 
                error: 'Generation timed out',
                status: 'error'
            }, { status: 408 })
        }

        if (!finalResult.outputs) {
            return Response.json({ 
                error: 'No output files generated',
                status: 'error'
            }, { status: 400 })
        }

        // Get the GLB file
        const glbData = finalResult.outputs['source.glb']
        if (!glbData) {
            console.error('CAD API: No GLB data in outputs:', Object.keys(finalResult.outputs))
            return Response.json({ 
                error: 'No GLB file generated',
                status: 'error'
            }, { status: 400 })
        }

        console.log('CAD API: Successfully generated model', {
            modelId: finalResult.id,
            hasGlb: true,
            glbDataType: typeof glbData,
            isUrl: glbData.startsWith('http'),
            isDataUrl: glbData.startsWith('data:'),
            dataPreview: glbData.substring(0, 100)
        })

        // Return in a format compatible with both React and Svelte apps
        return Response.json({
            modelUrl: glbData,  // For React app
            dataUrl: glbData,   // For Svelte app
            format: 'glb',
            modelId: finalResult.id,
            status: 'success',
            message: 'Model generated successfully'
        })

    } catch (error) {
        console.error('CAD API: Error:', error)
        return Response.json({ 
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            status: 'error'
        }, { status: 500 })
    }
} 