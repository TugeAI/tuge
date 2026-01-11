/**
 * Proxy Next.js pour la gestion des routes
 *
 * Gère :
 * - Protection des routes nécessitant une authentification
 * - Redirection des utilisateurs authentifiés depuis les pages auth
 * - Redirection des utilisateurs non authentifiés vers l'inscription
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes protégées nécessitant une authentification
// /agent est retiré car elle gère l'onboarding pour les non-authentifiés
const PROTECTED_ROUTES: string[] = []

// Routes d'authentification (signup, login) - redirige si déjà authentifié
const AUTH_ROUTES = ['/auth/signup', '/auth/login', '/auth/otp']

// Routes publiques (toujours accessibles)
const PUBLIC_ROUTES = ['/', '/auth', '/api', '/agent', '/onboarding']

// Assets et fichiers statiques à ignorer
const IGNORED_PATHS = ['/_next', '/favicon.ico', '/logo.svg', '/og-image.png']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Ignore les assets et fichiers statiques
  if (IGNORED_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Crée une réponse modifiable pour les cookies
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Si Supabase n'est pas configuré, permet l'accès aux routes publiques
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('[Proxy] Supabase not configured - allowing public access')
    // Ignore les routes publiques
    if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))) {
      return NextResponse.next()
    }
    // Pour les routes protégées, redirige vers /auth
    const isProtectedRoute = PROTECTED_ROUTES.some(route =>
      pathname === route || pathname.startsWith(route + '/')
    )
    if (isProtectedRoute) {
      return NextResponse.redirect(new URL('/auth', request.url))
    }
    return NextResponse.next()
  }

  // Crée le client Supabase avec gestion des cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Vérifie la session utilisateur
  const { data: { user }, error } = await supabase.auth.getUser()

  // Gestion des routes d'authentification (signup, login)
  const isAuthRoute = AUTH_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))

  if (isAuthRoute) {
    // Si utilisateur déjà authentifié, redirige vers /agent
    if (user && !error) {
      return NextResponse.redirect(new URL('/agent', request.url))
    }
    // Sinon, laisse accéder à la page d'auth
    return response
  }

  // Ignore les routes publiques
  if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return NextResponse.next()
  }

  // Vérifie si c'est une route protégée
  const isProtectedRoute = PROTECTED_ROUTES.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  )

  if (!isProtectedRoute) {
    return NextResponse.next()
  }

  // Si pas d'utilisateur authentifié, redirige vers /auth/login
  if (error || !user) {
    const loginUrl = new URL('/auth/login', request.url)
    // Conserve l'URL de destination pour redirection après auth
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match toutes les routes sauf :
     * - _next/static (fichiers statiques)
     * - _next/image (optimisation images)
     * - favicon.ico (favicon)
     * - fichiers avec extensions (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
