import { NextResponse } from 'next/server'
import { requireCertificateOfficer } from '@/lib/middleware'
import { db } from '@/lib/db'

export const GET = requireCertificateOfficer(async (req) => {
  try {
    if (!req.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all students (certificate officer can see all for certificate upload)
    // In real scenario, you might want to filter by status or other criteria
    const students = await db.student.findMany({
      where: {
        OR: [
          { certificateOfficerId: req.user.userId },
          { certificateOfficerId: null },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        applicationNumber: true,
        status: true,
        certificates: {
          select: {
            id: true,
            documentType: true,
            verificationStatus: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100, // Limit to recent students
    })

    return NextResponse.json({ students })
  } catch (error) {
    console.error('Get students error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

