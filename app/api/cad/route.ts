import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

// Initialize Anthropic client
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
})

const SYSTEM_PROMPT = `You are a CAD expert that interprets natural language requests and converts them into precise 3D shape instructions.
Your task is to analyze the user's request and return a JSON object that describes the 3D shapes and operations needed.

The output should follow this format:
{
    "shapes": [
        {
            "type": "primitive", // primitive, extrusion, revolution, etc.
            "shape": "cube", // cube, cylinder, sphere, etc.
            "parameters": {
                // Shape-specific parameters like dimensions, radius, etc.
            },
            "position": [x, y, z],
            "rotation": [x, y, z],
            "operations": [
                {
                    "type": "boolean", // boolean, fillet, chamfer, etc.
                    "operation": "union", // union, difference, intersection
                    "parameters": {}
                }
            ]
        }
    ]
}

Example:
User: "Create a cube with sides of 10 units and round its edges with a 1 unit radius"
Response:
{
    "shapes": [
        {
            "type": "primitive",
            "shape": "cube",
            "parameters": {
                "width": 10,
                "height": 10,
                "depth": 10
            },
            "position": [0, 0, 0],
            "rotation": [0, 0, 0],
            "operations": [
                {
                    "type": "fillet",
                    "operation": "edge",
                    "parameters": {
                        "radius": 1
                    }
                }
            ]
        }
    ]
}`

export async function POST(req: Request) {
    try {
        const { prompt } = await req.json()

        if (!prompt) {
            return NextResponse.json(
                { error: 'Missing prompt parameter' },
                { status: 400 }
            )
        }

        // Call Anthropic's API
        const message = await anthropic.messages.create({
            model: 'claude-3-opus-20240229',
            max_tokens: 4096,
            temperature: 0,
            system: SYSTEM_PROMPT,
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ]
        })

        // Parse the response to ensure it's valid JSON
        let parsedResponse
        try {
            const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
            parsedResponse = JSON.parse(responseText)
        } catch (error) {
            console.error('Failed to parse Claude response:', error)
            return NextResponse.json(
                { error: 'Failed to parse CAD instructions' },
                { status: 500 }
            )
        }

        return NextResponse.json(parsedResponse)
    } catch (error) {
        console.error('CAD generation error:', error)
        return NextResponse.json(
            { error: 'Failed to generate CAD instructions' },
            { status: 500 }
        )
    }
} 