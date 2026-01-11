import { NextResponse } from 'next/server'
import { requirePrincipal } from '@/lib/middleware'
import { db } from '@/lib/db'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

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

    // Get daily fee collection
    const transactions = await db.feeTransaction.findMany({
      where: {
        paymentDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        feeHead: true,
        student: {
          select: {
            name: true,
            applicationNumber: true,
          },
        },
      },
    })

    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0)
    const totalCount = transactions.length

    // Group by fee head
    const byFeeHead = transactions.reduce((acc, t) => {
      const headName = t.feeHead.name
      if (!acc[headName]) {
        acc[headName] = { count: 0, total: 0 }
      }
      acc[headName].count++
      acc[headName].total += t.amount
      return acc
    }, {} as Record<string, { count: number; total: number }>)

    return NextResponse.json({
      date,
      summary: {
        totalAmount,
        totalCount,
        byFeeHead,
      },
      transactions: transactions.slice(0, 20), // Latest 20
    })
  } catch (error) {
    console.error('Get fee summary error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

