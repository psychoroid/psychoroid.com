import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    try {
        // Validate Zoo API token and URL
        if (!process.env.ZOO_API_TOKEN || !process.env.ZOO_API_URL) {
            console.error('Missing required environment variables')
            return NextResponse.json({
                error: 'CAD service is not properly configured',
                status: 'error'
            }, { status: 500 })
        }

        const { prompt } = await req.json()
        
        if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
            return NextResponse.json({
                error: 'Please provide a detailed description of the CAD model you want to create',
                status: 'error'
            }, { status: 400 })
        }

        console.log('Submitting prompt to Zoo API:', prompt.trim())

        try {
            // Submit prompt to Zoo text-to-CAD API
            const response = await fetch(`${process.env.ZOO_API_URL}/ai/text-to-cad/glb`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${process.env.ZOO_API_TOKEN}`
                },
                body: JSON.stringify({
                    prompt: prompt.trim(),
                    formats: ['glb']
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                console.error('Zoo API error:', errorData)
                return NextResponse.json({ 
                    error: errorData.message || 'Failed to initiate CAD generation',
                    status: 'error',
                    details: errorData
                }, { status: response.status })
            }

            const result = await response.json()
            console.log('Zoo API response:', result)

            if (!result.id) {
                console.error('Invalid response from Zoo API:', result)
                return NextResponse.json({
                    error: 'Invalid response from CAD service - no generation ID',
                    status: 'error',
                    details: result
                }, { status: 500 })
            }

            console.log('CAD generation initiated successfully:', result.id)

            return NextResponse.json({
                id: result.id,
                status: 'pending',
                message: 'CAD generation initiated successfully'
            })

        } catch (apiError) {
            console.error('Zoo API call failed:', apiError)
            return NextResponse.json({ 
                error: apiError instanceof Error ? apiError.message : 'Failed to connect to CAD service',
                status: 'error',
                details: apiError
            }, { status: 500 })
        }

    } catch (error) {
        console.error('Error in submit-prompt:', error)
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            status: 'error'
        }, { status: 500 })
    }
} 