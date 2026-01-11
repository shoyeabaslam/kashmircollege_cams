import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, JWTPayload } from './auth'
import { Role } from '@prisma/client'

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload
}

export function requireAuth(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    const token = req.cookies.get('token')?.value || req.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const authReq = req as AuthenticatedRequest
    authReq.user = payload

    return handler(authReq)
  }
}

export function requireRole(allowedRoles: Role[]) {
  return (handler: (req: AuthenticatedRequest) => Promise<NextResponse>) => {
    return requireAuth(async (req: AuthenticatedRequest) => {
      if (!req.user || !allowedRoles.includes(req.user.role)) {
        return NextResponse.json({ error: 'Forbidden - Insufficient permissions' }, { status: 403 })
      }
      return handler(req)
    })
  }
}

// Role-specific middleware helpers
export const requireCounselor = requireRole([Role.ADMISSION_COUNSELOR])
export const requireCertificateOfficer = requireRole([Role.CERTIFICATE_OFFICER])
export const requireAccountsOfficer = requireRole([Role.ACCOUNTS_OFFICER])
export const requirePrincipal = requireRole([Role.PRINCIPAL])
export const requireDirector = requireRole([Role.DIRECTOR])

export const requireReadOnly = requireRole([Role.PRINCIPAL, Role.DIRECTOR])

