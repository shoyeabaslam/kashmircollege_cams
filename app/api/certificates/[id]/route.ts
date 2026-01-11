import { NextResponse } from 'next/server'
import { requireCertificateOfficer } from '@/lib/middleware'
import { db } from '@/lib/db'
import { z } from 'zod'
import { VerificationStatus } from '@prisma/client'

const updateCertificateSchema = z.object({
  verificationStatus: z.nativeEnum(VerificationStatus),
})

export const PATCH = requireCertificateOfficer(async (req) => {
  try {
    if (!req.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const id = req.nextUrl.pathname.split('/').pop()
    const body = await req.json()
    const { verificationStatus } = updateCertificateSchema.parse(body)

    // Verify certificate belongs to this certificate officer
    const certificate = await db.certificate.findFirst({
      where: {
        id: id,
        certificateOfficerId: req.user.userId,
      },
      include: {
        student: true,
      },
    })

    if (!certificate) {
      return NextResponse.json(
        { error: 'Certificate not found' },
        { status: 404 }
      )
    }

    // Update certificate status
    const updated = await db.certificate.update({
      where: { id: id },
      data: {
        verificationStatus,
        verifiedAt: verificationStatus !== 'PENDING' ? new Date() : null,
      },
    })

    // Update student status if all certificates are verified
    if (verificationStatus === 'VERIFIED') {
      const allCertificates = await db.certificate.findMany({
        where: { studentId: certificate.studentId },
      })

      const allVerified = allCertificates.every(
        (c) => c.verificationStatus === 'VERIFIED'
      )

      if (allVerified && certificate.student.status === 'PENDING') {
        await db.student.update({
          where: { id: certificate.studentId },
          data: { status: 'CERTIFICATE_VERIFIED' },
        })
      }
    }

    return NextResponse.json({ certificate: updated })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Update certificate error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

