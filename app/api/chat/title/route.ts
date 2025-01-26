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
                content: `Generate a very short, practical title (2-4 words) for a CAD modeling chat that starts with this prompt: "${prompt}". The title should be simple and descriptive of the object being created, without any additional text or fancy words. For example, "Simple Gear Design" or "Basic Cube Model". Return only the title, no quotes or additional text.`
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