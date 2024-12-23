import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    const url = request.nextUrl.clone();

    // Handle www to non-www redirect
    if (url.hostname.startsWith('www.')) {
        url.hostname = url.hostname.replace('www.', '');
        return NextResponse.redirect(url);
    }

    // Handle HTTP to HTTPS redirect
    if (url.protocol === 'http:') {
        url.protocol = 'https:';
        return NextResponse.redirect(url);
    }

    // Handle trailing slash
    if (url.pathname !== '/' && url.pathname.endsWith('/')) {
        url.pathname = url.pathname.slice(0, -1);
        return NextResponse.redirect(url);
    }

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

    // Add additional security headers
    response.headers.set('X-DNS-Prefetch-Control', 'on');
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

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

// Update matcher to include all necessary paths while excluding static files
export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * 1. /api/ (API routes)
         * 2. /_next/ (Next.js internals)
         * 3. /_static (inside /public)
         * 4. /_vercel (Vercel internals)
         * 5. all root files inside /public (e.g. /favicon.ico)
         * 6. Include auth callback and dashboard paths
         */
        '/((?!api/stripe/webhook|_next/static|_next/image|favicon.ico).*)',
        '/auth/callback',
        '/dashboard/:path*'
    ],
} 