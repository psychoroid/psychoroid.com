import { NextResponse } from 'next/server'

const ZOO_API_URL = process.env.ZOO_API_URL
const ZOO_API_TOKEN = process.env.ZOO_API_TOKEN

export async function POST(req: Request) {
    if (!ZOO_API_URL || !ZOO_API_TOKEN) {
        return NextResponse.json({ 
            error: 'Server configuration error',
            status: 'error'
        }, { status: 500 })
    }

    try {
        const { id, feedback } = await req.json()
        
        if (!id || !feedback) {
            return NextResponse.json({
                error: 'Please provide both id and feedback',
                status: 'error'
            }, { status: 400 })
        }

        const response = await fetch(`${ZOO_API_URL}/user/text-to-cad/${id}/feedback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${ZOO_API_TOKEN}`
            },
            body: JSON.stringify({ feedback })
        })

        if (!response.ok) {
            const errorData = await response.json()
            return NextResponse.json({ 
                error: errorData.message || 'Failed to submit feedback',
                status: 'error',
                details: errorData
            }, { status: response.status })
        }

        const result = await response.json()
        
        return NextResponse.json({
            status: 'success',
            message: 'Feedback submitted successfully',
            data: result
        })

    } catch (error) {
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            status: 'error'
        }, { status: 500 })
    }
} 