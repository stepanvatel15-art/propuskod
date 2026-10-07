import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Middleware только проверяет, что пользователь вошёл, и обновляет сессию.
 * Роль (кто куда может заходить) проверяется в app/(app)/layout.tsx —
 * там профиль всё равно загружается, так что лишнего запроса к базе нет.
 */
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  // Layout узнаёт текущий адрес из этого заголовка, чтобы проверить права роли
  request.headers.set('x-pathname', path)

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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data } = await supabase.auth.getClaims()
  const loggedIn = Boolean(data?.claims?.sub)

  const isPublic = path === '/login' || path.startsWith('/_next')

  if (!loggedIn && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (loggedIn && path === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/' // главная перенаправит на страницу роли
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
