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
            return new Response(
                JSON.stringify({ error: 'Session ID and User ID are required' }),
                { 
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId);
        
        if (!session) {
            return new Response(
                JSON.stringify({ error: 'Session not found' }),
                { 
                    status: 404,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        const supabase = createRouteHandlerClient({ cookies });

        try {
            await supabase.from('roids_transactions').insert({
                user_id: userId,
                amount: 0,
                transaction_type: 'cancelled',
                stripe_session_id: sessionId,
                description: 'Checkout cancelled by user',
                status: 'cancelled'
            });

            if (session.status !== 'expired') {
                await stripe.checkout.sessions.expire(sessionId);
            }

            return new Response(
                JSON.stringify({ 
                    success: true,
                    message: 'Session cancelled successfully'
                }),
                { 
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        } catch (dbError) {
            console.error('❌ Database error:', dbError);
            return new Response(
                JSON.stringify({ error: 'Failed to record cancellation' }),
                { 
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }
    } catch (error) {
        console.error('❌ Error cancelling session:', error);
        return new Response(
            JSON.stringify({ 
                error: 'Failed to cancel session',
                details: error instanceof Error ? error.message : 'Unknown error'
            }),
            { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

export const runtime = 'edge';