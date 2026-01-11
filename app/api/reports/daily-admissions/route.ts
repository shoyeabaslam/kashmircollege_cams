import { NextResponse } from 'next/server'
import { requirePrincipal } from '@/lib/middleware'
import { db } from '@/lib/db'

export const GET = requirePrincipal(async (req) => {
  try {
    if (!req.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

    const startDate = new Date(date)
    startDate.setHours(0, 0, 0, 0)
    const endDate = new Date(date)
    endDate.setHours(23, 59, 59, 999)

    // Get daily statistics
    const totalStudents = await db.student.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    })

    const byStatus = await db.student.groupBy({
      by: ['status'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: {
        id: true,
      },
    })

    const byCounselor = await db.student.groupBy({
      by: ['counselorId'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
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
      },
    })

    const byCounselorWithNames = byCounselor.map((g) => ({
      counselorId: g.counselorId,
      count: g._count.id,
      counselorName: counselors.find((c) => c.id === g.counselorId)?.name || 'Unknown',
    }))

    // Recent students
    const recentStudents = await db.student.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        counselor: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    })

    return NextResponse.json({
      date,
      summary: {
        totalStudents,
        byStatus: byStatus.map((s) => ({
          status: s.status,
          count: s._count.id,
        })),
        byCounselor: byCounselorWithNames,
      },
      recentStudents,
    })
  } catch (error) {
    console.error('Get daily admissions error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

