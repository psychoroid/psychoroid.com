import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: Request) {
    if (!process.env.ANTHROPIC_API_KEY) {
        return NextResponse.json({ error: 'Anthropic API key not configured' }, { status: 500 });
    }

    try {
        const { prompt } = await req.json();

        if (!prompt) {
            return NextResponse.json({ error: 'No prompt provided' }, { status: 400 });
        }

        const message = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20240620',
            max_tokens: 4096,
            messages: [{ role: 'user', content: prompt }],
        });

        // Extract text from the first content block
        const firstContent = message.content[0];
        const responseText = typeof firstContent === 'object' && 'text' in firstContent 
            ? firstContent.text 
            : 'Non-text response received';

        return NextResponse.json({
            response: responseText,
            messageId: message.id
        });

    } catch (error: any) {
        console.error('Anthropic API Error:', error);
        return NextResponse.json({ 
            error: error.message || 'Failed to process request',
            details: error
        }, { status: 500 });
    }
} 