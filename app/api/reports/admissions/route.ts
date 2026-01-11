import { NextResponse } from 'next/server'
import { requireDirector } from '@/lib/middleware'
import { db } from '@/lib/db'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export const GET = requireDirector(async (req) => {
  try {
    if (!req.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const whereClause: any = {}
    if (startDate || endDate) {
      whereClause.createdAt = {}
      if (startDate) {
        whereClause.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        whereClause.createdAt.lte = new Date(endDate)
      }
    }

    // Overall statistics
    const totalStudents = await db.student.count({ where: whereClause })

    const byStatus = await db.student.groupBy({
      by: ['status'],
      where: whereClause,
      _count: {
        id: true,
      },
    })

    const byCounselor = await db.student.groupBy({
      by: ['counselorId'],
      where: whereClause,
      _count: {
        id: true,
      },
    })

    // Get counselor names
    const counselorIds = byCounselor.map((g) => g.counselorId)
    const counselors = await db.user.findMany({
      where: {
        id: {
          in: counselorIds,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    })

    const byCounselorWithNames = byCounselor.map((g) => ({
      counselorId: g.counselorId,
      count: g._count.id,
      counselorName: counselors.find((c) => c.id === g.counselorId)?.name || 'Unknown',
      counselorEmail: counselors.find((c) => c.id === g.counselorId)?.email || '',
    }))

    // Recent students
    const recentStudents = await db.student.findMany({
      where: whereClause,
      include: {
        counselor: {
          select: {
            name: true,
            email: true,
          },
        },
        certificateOfficer: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            certificates: true,
            feeTransactions: true,
            counselingRemarks: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    })

    // Certificate statistics
    const totalCertificates = await db.certificate.count()
    const certificatesByStatus = await db.certificate.groupBy({
      by: ['verificationStatus'],
      _count: {
        id: true,
      },
    })

    return NextResponse.json({
      summary: {
        totalStudents,
        byStatus: byStatus.map((s) => ({
          status: s.status,
          count: s._count.id,
        })),
        byCounselor: byCounselorWithNames,
        certificates: {
          total: totalCertificates,
          byStatus: certificatesByStatus.map((s) => ({
            status: s.verificationStatus,
            count: s._count.id,
          })),
        },
      },
      recentStudents,
    })
  } catch (error) {
    console.error('Get admissions report error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

