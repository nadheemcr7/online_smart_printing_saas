import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Only run auth logic on protected routes
    const isProtected = pathname.startsWith('/dashboard')
    const isAuthPage = pathname === '/login' || pathname === '/signup'

    // Skip middleware entirely for non-protected, non-auth pages (like landing page)
    if (!isProtected && !isAuthPage) {
        return NextResponse.next()
    }

    let response = NextResponse.next({
        request: { headers: request.headers },
    })

    try {
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return request.cookies.get(name)?.value
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        request.cookies.set({ name, value, ...options })
                        response = NextResponse.next({
                            request: { headers: request.headers },
                        })
                        response.cookies.set({ name, value, ...options })
                    },
                    remove(name: string, options: CookieOptions) {
                        request.cookies.set({ name, value: '', ...options })
                        response = NextResponse.next({
                            request: { headers: request.headers },
                        })
                        response.cookies.set({ name, value: '', ...options })
                    },
                },
            }
        )

        // Only check session, don't fetch profile to avoid slow DB roundtrips in middleware
        const { data: { user } } = await supabase.auth.getUser()

        // 1. Redirect if trying to access dashboard without being logged in
        if (isProtected && !user) {
            return NextResponse.redirect(new URL('/login', request.url))
        }

        // 2. Redirect logged-in users away from login/signup
        if (isAuthPage && user) {
            // Default redirect - role specific redirect will happen on the client side
            return NextResponse.redirect(new URL('/dashboard/owner', request.url))
        }

    } catch (e) {
        console.error('Middleware error:', e)
    }

    return response
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/login',
        '/signup',
    ],
}
