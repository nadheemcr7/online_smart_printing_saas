import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
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
                .single()

            const role = profiles?.role

            // Cross-role protection
            if (request.nextUrl.pathname.startsWith('/dashboard/owner') && role !== 'owner') {
                return NextResponse.redirect(new URL('/dashboard/customer', request.url))
            }

            if (request.nextUrl.pathname.startsWith('/dashboard/developer') && role !== 'developer') {
                return NextResponse.redirect(new URL('/dashboard/owner', request.url))
            }
        }

        // Auth Page Redirection
        if ((request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup') && user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()

            const role = profile?.role
            const target = role === 'developer' ? '/dashboard/developer' : (role === 'owner' ? '/dashboard/owner' : '/dashboard/customer')
            return NextResponse.redirect(new URL(target, request.url))
        }
    } catch (e) {
        console.error("Middleware error:", e)
        // If everything fails, just let it pass to avoid blocking the whole site
    }

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|api).*)',
    ],
}
