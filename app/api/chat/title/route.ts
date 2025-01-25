import { Anthropic } from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
})

export async function POST(req: Request) {
    try {
        const { prompt } = await req.json()

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
        }

        const message = await anthropic.messages.create({
            model: 'claude-3-sonnet-20240229',
            max_tokens: 50,
            messages: [{
                role: 'user',
                content: `Generate a concise, descriptive title (max 5 words) for a 3D modeling chat conversation that starts with this prompt: "${prompt}". Return only the title, no quotes or additional text.`
            }],
        })

        const title = typeof message.content[0] === 'object' && 'text' in message.content[0] 
            ? message.content[0].text 
            : 'a new chat'

        return NextResponse.json({ title })
    } catch (error) {
        console.error('Error generating title:', error)
        return NextResponse.json({ error: 'Failed to generate title' }, { status: 500 })
    }
} 