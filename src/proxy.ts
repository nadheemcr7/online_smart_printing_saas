import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export default async function proxy(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    // Protected Routes
    if (request.nextUrl.pathname.startsWith('/dashboard')) {
        if (!user) {
            return NextResponse.redirect(new URL('/login', request.url))
        }

        const { data: profiles } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .limit(1)

        const role = profiles?.[0]?.role

        // Cross-role protection
        if (request.nextUrl.pathname.startsWith('/dashboard/owner') && role !== 'owner') {
            const redirectResponse = NextResponse.redirect(new URL('/dashboard/customer', request.url))
            redirectResponse.headers.set('x-middleware-cache', 'no-cache')
            return redirectResponse
        }

        if (request.nextUrl.pathname.startsWith('/dashboard/developer') && role !== 'developer') {
            return NextResponse.redirect(new URL('/dashboard/owner', request.url))
        }
    }

    // Auth Page Redirection (Prevention of double login)
    if ((request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup') && user) {
        const { data: profiles } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .limit(1)

        const role = profiles?.[0]?.role
        if (role === 'developer') {
            const res = NextResponse.redirect(new URL('/dashboard/developer', request.url))
            res.headers.set('x-middleware-cache', 'no-cache')
            return res
        }
        if (role === 'owner') {
            const res = NextResponse.redirect(new URL('/dashboard/owner', request.url))
            res.headers.set('x-middleware-cache', 'no-cache')
            return res
        }
        const res = NextResponse.redirect(new URL('/dashboard/customer', request.url))
        res.headers.set('x-middleware-cache', 'no-cache')
        return res
    }

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|api).*)',
    ],
}
