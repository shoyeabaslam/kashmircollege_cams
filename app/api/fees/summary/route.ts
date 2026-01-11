import { NextResponse } from 'next/server'
import { requireAccountsOfficer } from '@/lib/middleware'
import { db } from '@/lib/db'

export const GET = requireAccountsOfficer(async (req) => {
  try {
    if (!req.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const whereClause: any = {
      accountsOfficerId: req.user.userId,
    }

    if (startDate || endDate) {
      whereClause.paymentDate = {}
      if (startDate) {
        whereClause.paymentDate.gte = new Date(startDate)
      }
      if (endDate) {
        whereClause.paymentDate.lte = new Date(endDate)
      }
    }

    const transactions = await db.feeTransaction.findMany({
      where: whereClause,
      include: {
        feeHead: true,
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
      summary: {
        totalAmount,
        totalCount,
        byFeeHead,
      },
      transactions: transactions.slice(0, 10), // Latest 10
    })
  } catch (error) {
    console.error('Get fee summary error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

