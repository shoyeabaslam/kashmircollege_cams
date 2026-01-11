import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, generateToken } from '@/lib/auth'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = loginSchema.parse(body)

    // Find user by email (email is unique in schema)
    const user = await db.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    // Debug: Log token generation (remove in production)
    console.log('Login successful for:', user.email, 'Role:', user.role)
    console.log('Token generated:', token.substring(0, 20) + '...')

    // Determine redirect path based on role
    const roleDashboardMap: Record<string, string> = {
      ADMISSION_COUNSELOR: '/counselor',
      CERTIFICATE_OFFICER: '/certificate-officer',
      ACCOUNTS_OFFICER: '/accounts',
      PRINCIPAL: '/principal',
      DIRECTOR: '/director',
    }

    // Determine redirect path based on role
    const redirectPath = roleDashboardMap[user.role] || '/login'

    // Create JSON response with redirect information
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      redirect: redirectPath,
    })

    // Set token in HTTP-only cookie
    // Note: In development, secure should be false for localhost
    const isProduction = process.env.NODE_ENV === 'production'
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    // Debug logging
    console.log('Login successful:', {
      email: user.email,
      role: user.role,
      redirectTo: redirectPath,
      cookieSet: !!token,
    })

    return response
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

