import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    return NextResponse.json(
        { error: 'Direct conversion no longer supported - use client-side conversion' }, 
        { status: 400 }
    );
} 