import { NextResponse } from 'next/server'

const ZOO_API_URL = process.env.ZOO_API_URL
const ZOO_API_TOKEN = process.env.ZOO_API_TOKEN

const SUPPORTED_FORMATS = ['glb', 'step', 'stl', 'obj', 'fbx']

export async function POST(req: Request) {
    if (!ZOO_API_URL || !ZOO_API_TOKEN) {
        return NextResponse.json({ 
            error: 'Server configuration error',
            status: 'error'
        }, { status: 500 })
    }

    try {
        const { searchParams } = new URL(req.url)
        const outputFormat = searchParams.get('format')

        if (!outputFormat || !SUPPORTED_FORMATS.includes(outputFormat)) {
            return NextResponse.json({
                error: 'Please provide a valid output format (glb, step, stl, obj, fbx)',
                status: 'error'
            }, { status: 400 })
        }

        const modelData = await req.blob()
        if (!modelData || modelData.size === 0) {
            return NextResponse.json({
                error: 'Please provide the model data in the request body',
                status: 'error'
            }, { status: 400 })
        }

        const formData = new FormData()
        formData.append('model', modelData)
        formData.append('output_format', outputFormat)

        const response = await fetch(`${ZOO_API_URL}/convert`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ZOO_API_TOKEN}`,
                'Accept': 'application/json'
            },
            body: formData
        })

        if (!response.ok) {
            const errorData = await response.json()
            return NextResponse.json({ 
                error: errorData.message || 'Failed to convert model',
                status: 'error',
                details: errorData
            }, { status: response.status })
        }

        const result = await response.json()
        
        return NextResponse.json({
            status: 'success',
            message: 'Model converted successfully',
            data: {
                url: result.url,
                format: outputFormat
            }
        })

    } catch (error) {
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            status: 'error'
        }, { status: 500 })
    }
} 