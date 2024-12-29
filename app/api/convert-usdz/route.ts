import { NextResponse } from 'next/server';

interface ConvertUSDZRequest {
    url: string;
}

export async function POST(request: Request) {
    try {
        const { url }: ConvertUSDZRequest = await request.json();
        
        if (!process.env.NEXT_PUBLIC_LAMBDA_CONVERSION_URL) {
            throw new Error('Lambda conversion URL not configured');
        }

        // Call AWS Lambda function
        const response = await fetch(process.env.NEXT_PUBLIC_LAMBDA_CONVERSION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url, format: 'usdz' })
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
            const usdzResponse = await fetch(convertedUrl);
            if (!usdzResponse.ok) {
                throw new Error('Failed to download converted file');
            }

            const usdzData = await usdzResponse.arrayBuffer();

            return new NextResponse(usdzData, {
                headers: {
                    'Content-Type': 'model/vnd.usdz+zip',
                    'Content-Disposition': 'attachment; filename=converted.usdz'
                }
            });
        } catch (e) {
            throw new Error(`Invalid response format: ${responseText}`);
        }

    } catch (error) {
        console.error('USDZ conversion error:', error);
        return NextResponse.json({ 
            success: false, 
            error: 'USDZ conversion failed: ' + (error as Error).message,
            suggestion: process.env.NODE_ENV === 'production' 
                ? 'Please try again later or contact support.'
                : (error as Error).message
        }, { status: 500 });
    }
} 