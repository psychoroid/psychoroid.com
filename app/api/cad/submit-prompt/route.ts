import { NextResponse } from 'next/server'

const ZOO_API_URL = process.env.ZOO_API_URL
const ZOO_API_TOKEN = process.env.ZOO_API_TOKEN

interface PromptRequest {
    prompt: string;
    referenceId?: string;  // ID of the previous generation to reference
    modifications?: string; // Specific modifications to make to the reference
}

export async function POST(req: Request) {
    if (!ZOO_API_URL || !ZOO_API_TOKEN) {
        return NextResponse.json({ 
            error: 'Server configuration error',
            status: 'error'
        }, { status: 500 })
    }

    try {
        const { prompt, referenceId, modifications } = await req.json() as PromptRequest
        
        if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
            return NextResponse.json({
                error: 'Please provide a detailed description of the CAD model you want to create',
                status: 'error'
            }, { status: 400 })
        }

        // If we have a reference ID, fetch the previous generation details
        let enhancedPrompt = prompt
        if (referenceId) {
            try {
                const refResponse = await fetch(`${ZOO_API_URL}/user/text-to-cad/${referenceId}`, {
                    headers: {
                        'Authorization': `Bearer ${ZOO_API_TOKEN}`,
                        'Accept': 'application/json'
                    }
                })

                if (refResponse.ok) {
                    const refData = await refResponse.json()
                    if (refData.status === 'completed') {
                        // Construct an enhanced prompt that references the previous generation
                        enhancedPrompt = `Reference Model ID: ${referenceId}.\n`
                        enhancedPrompt += modifications ? 
                            `Modifications Required: ${modifications}.\n` :
                            `Base Modification: ${prompt}.\n`
                        enhancedPrompt += `Original Prompt: ${refData.prompt}\n`
                        enhancedPrompt += `Please maintain the core characteristics of the reference model while applying these modifications.`
                    }
                }
            } catch (error) {
                console.error('Error fetching reference model:', error)
                // Continue with original prompt if reference fetch fails
            }
        }

        const response = await fetch(`${ZOO_API_URL}/ai/text-to-cad/glb`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${ZOO_API_TOKEN}`
            },
            body: JSON.stringify({
                prompt: enhancedPrompt,
                formats: ['glb', 'step'],
                reference_id: referenceId // Include reference ID if available
            })
        })

        if (!response.ok) {
            const errorData = await response.json()
            return NextResponse.json({ 
                error: errorData.message || 'Failed to initiate CAD generation',
                status: 'error',
                details: errorData
            }, { status: response.status })
        }

        const result = await response.json()
        
        return NextResponse.json({
            id: result.id,
            status: 'pending',
            message: 'CAD generation initiated successfully',
            isModification: !!referenceId,
            referenceId,
            originalPrompt: prompt,
            enhancedPrompt
        })

    } catch (error) {
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            status: 'error'
        }, { status: 500 })
    }
} 