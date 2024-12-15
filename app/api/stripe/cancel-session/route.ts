import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-11-20.acacia'
});

export async function POST(req: Request) {
    try {
        const { sessionId, userId } = await req.json();
        
        if (!sessionId || !userId) {
            return NextResponse.json(
                { error: 'Session ID and User ID are required' },
                { status: 400 }
            );
        }

        // First, retrieve the session to verify it exists and is cancellable
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        
        if (!session) {
            return NextResponse.json(
                { error: 'Session not found' },
                { status: 404 }
            );
        }

        const supabase = createRouteHandlerClient({ cookies });

        try {
            // Record the cancelled session
            await supabase.from('roids_transactions').insert({
                user_id: userId,
                amount: 0,
                transaction_type: 'cancelled',
                stripe_session_id: sessionId,
                description: 'Checkout cancelled by user',
                status: 'cancelled'
            });

            // Expire the checkout session if it's not already expired
            if (session.status !== 'expired') {
                await stripe.checkout.sessions.expire(sessionId);
            }

            return NextResponse.json({ 
                success: true,
                message: 'Session cancelled successfully'
            });
        } catch (dbError) {
            console.error('Database error:', dbError);
            return NextResponse.json(
                { error: 'Failed to record cancellation' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Error cancelling session:', error);
        return NextResponse.json(
            { 
                error: 'Failed to cancel session',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
} 