import { NextResponse } from 'next/server';

interface ConvertFBXRequest {
    url: string;
}

export async function POST(request: Request) {
    try {
        const { url }: ConvertFBXRequest = await request.json();
        
        if (!process.env.NEXT_PUBLIC_LAMBDA_CONVERSION_URL) {
            throw new Error('Lambda conversion URL not configured');
        }

        // Call AWS Lambda function
        const response = await fetch(process.env.NEXT_PUBLIC_LAMBDA_CONVERSION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url, format: 'fbx' })
        });

        // Log the response for debugging
        const responseText = await response.text();
        console.log('Lambda response:', responseText);

        if (!response.ok) {
            try {
                const error = JSON.parse(responseText);
                throw new Error(error.error || 'Conversion failed');
            } catch (e) {
                throw new Error(`Conversion failed: ${responseText}`);
            }
        }

        try {
            const { url: convertedUrl } = JSON.parse(responseText);
            
            // Forward the converted file
            const fbxResponse = await fetch(convertedUrl);
            if (!fbxResponse.ok) {
                throw new Error('Failed to download converted file');
            }

            const fbxData = await fbxResponse.arrayBuffer();

            return new NextResponse(fbxData, {
                headers: {
                    'Content-Type': 'application/octet-stream',
                    'Content-Disposition': 'attachment; filename=converted.fbx'
                }
            });
        } catch (e) {
            throw new Error(`Invalid response format: ${responseText}`);
        }

    } catch (error) {
        console.error('FBX conversion error:', error);
        return NextResponse.json({ 
            success: false, 
            error: 'FBX conversion failed: ' + (error as Error).message,
            suggestion: process.env.BUN_ENV === 'production' 
                ? 'Please try again later or contact support.'
                : (error as Error).message
        }, { status: 500 });
    }
} 