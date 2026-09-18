import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const ROLE_HOME: Record<string, string> = {
  teacher: '/teacher',
  security: '/duty',
  admin: '/admin',
}

const ROUTE_ROLES: { prefix: string; roles: string[] }[] = [
  { prefix: '/teacher', roles: ['teacher', 'admin'] },
  { prefix: '/duty', roles: ['security', 'admin'] },
  { prefix: '/admin', roles: ['admin'] },
]

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isPublic = path === '/login' || path.startsWith('/_next')

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role

    if (path === '/login') {
      const url = request.nextUrl.clone()
      url.pathname = role ? ROLE_HOME[role] ?? '/login' : '/login'
      return NextResponse.redirect(url)
    }

    const matched = ROUTE_ROLES.find((r) => path.startsWith(r.prefix))
    if (matched && (!role || !matched.roles.includes(role))) {
      const url = request.nextUrl.clone()
      url.pathname = role ? ROLE_HOME[role] ?? '/login' : '/login'
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
