import { NextResponse } from 'next/server'
import { requireAccountsOfficer } from '@/lib/middleware'
import { db } from '@/lib/db'

export const GET = requireAccountsOfficer(async (req) => {
  try {
    if (!req.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all students who have verified certificates (ready for fee payment)
    const students = await db.student.findMany({
      where: {
        status: {
          in: ['CERTIFICATE_VERIFIED', 'FEES_PAID', 'PENDING'],
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        applicationNumber: true,
        status: true,
        feeTransactions: {
          select: {
            id: true,
            feeHeadId: true,
            amount: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
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

