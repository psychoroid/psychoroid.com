import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
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
            "frame-src 'self' https://js.stripe.com",
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

// Apply middleware to all routes except static files and API routes
export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
        '/auth/callback',
        '/dashboard/:path*'
    ],
} 