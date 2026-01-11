import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyTokenEdge } from './lib/auth-edge'

// Routes that don't require authentication
const publicRoutes = ['/login']

// Role-based route mapping
const roleRoutes: Record<string, string[]> = {
  ADMISSION_COUNSELOR: ['/counselor'],
  CERTIFICATE_OFFICER: ['/certificate-officer'],
  ACCOUNTS_OFFICER: ['/accounts'],
  PRINCIPAL: ['/principal'],
  DIRECTOR: ['/director'],
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Check for token in cookies
  const token = request.cookies.get('token')?.value

  // Debug logging (remove in production)
  if (pathname !== '/login') {
    console.log('Middleware check:', {
      pathname,
      hasToken: !!token,
      tokenPreview: token ? token.substring(0, 20) + '...' : 'none',
      allCookies: request.cookies.getAll().map(c => c.name),
    })
  }

  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Verify token
  const payload = await verifyTokenEdge(token)
  if (!payload) {
    console.log('Token verification failed for:', pathname)
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    const response = NextResponse.redirect(loginUrl)
    response.cookies.delete('token')
    return response
  }

  // API routes are handled by their own middleware, skip route-based checks
  if (pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  // Check if user has access to this route
  const userRole = payload.role
  const allowedRoutes = roleRoutes[userRole] || []

  const hasAccess = allowedRoutes.some(route => pathname.startsWith(route))

  if (!hasAccess) {
    // Redirect to role-specific dashboard
    const dashboardPath = allowedRoutes[0] || '/login'
    return NextResponse.redirect(new URL(dashboardPath, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|uploads).*)',
  ],
}

