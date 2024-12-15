import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    // Skip middleware for Stripe webhook requests
    if (request.nextUrl.pathname === '/api/stripe/webhook') {
        return NextResponse.next();
    }

    const response = NextResponse.next()
    const supabase = createMiddlewareClient({ req: request, res: response })

    // Add CSP headers
    response.headers.set(
        'Content-Security-Policy',
        [
            "default-src 'self'",
            "img-src 'self' https://peyzpnmmgsxjydvpussg.supabase.co data: blob:",
            "script-src 'self' 'unsafe-inline' https://js.stripe.com",
            "connect-src 'self' https://peyzpnmmgsxjydvpussg.supabase.co https://api.stripe.com",
            "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
            "form-action 'self' https://hooks.stripe.com",
        ].join('; ')
    )

    // Set secure cookie attributes
    if (process.env.NODE_ENV === 'production') {
        response.headers.set(
            'Set-Cookie',
            'SameSite=Strict; Secure; Path=/'
        )
    }

    // Check authentication for dashboard routes
    if (request.nextUrl.pathname.startsWith('/dashboard')) {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
            const redirectUrl = new URL('/auth/sign-in', request.url)
            redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
            return NextResponse.redirect(redirectUrl)
        }
    }

    return response
}

// Update matcher to include Stripe webhook path
export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
        '/auth/callback',
        '/dashboard/:path*'
    ],
} 