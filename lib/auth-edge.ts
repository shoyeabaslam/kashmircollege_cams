import { SignJWT, jwtVerify } from 'jose'
import { Role } from '@prisma/client'

const JWT_SECRET = process.env.JWT_SECRET || 'cams-super-secret-jwt-key-change-in-production-2024'
const secret = new TextEncoder().encode(JWT_SECRET)

export interface JWTPayload {
  userId: string
  email: string
  role: Role
}

export async function generateTokenEdge(payload: JWTPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret)
}

export async function verifyTokenEdge(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as Role,
    }
  } catch (error) {
    console.error('Token verification error (Edge):', error instanceof Error ? error.message : 'Unknown error')
    return null
  }
}
