import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const response = NextResponse.next();

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
    );

    // Set secure cookie attributes
    if (process.env.NODE_ENV === 'production') {
        response.headers.set(
            'Set-Cookie',
            'SameSite=Strict; Secure; Path=/'
        );
    }

    return response;
}

// Only apply middleware to pages, not to static files or API routes
export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|api/).*)',
    ],
}; 