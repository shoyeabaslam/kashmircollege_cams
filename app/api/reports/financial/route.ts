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
      whereClause.paymentDate = {}
      if (startDate) {
        whereClause.paymentDate.gte = new Date(startDate)
      }
      if (endDate) {
        whereClause.paymentDate.lte = new Date(endDate)
      }
    }

    // Overall financial statistics
    const transactions = await db.feeTransaction.findMany({
      where: whereClause,
      include: {
        feeHead: true,
        student: {
          select: {
            name: true,
            applicationNumber: true,
          },
        },
        accountsOfficer: {
          select: {
            name: true,
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
        acc[headName] = { count: 0, total: 0, transactions: [] }
      }
      acc[headName].count++
      acc[headName].total += t.amount
      acc[headName].transactions.push(t)
      return acc
    }, {} as Record<string, { count: number; total: number; transactions: any[] }>)

    // Group by accounts officer
    const byAccountsOfficer = transactions.reduce((acc, t) => {
      const officerName = t.accountsOfficer.name
      if (!acc[officerName]) {
        acc[officerName] = { count: 0, total: 0 }
      }
      acc[officerName].count++
      acc[officerName].total += t.amount
      return acc
    }, {} as Record<string, { count: number; total: number }>)

    // Daily breakdown (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const dailyTransactions = await db.feeTransaction.findMany({
      where: {
        paymentDate: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        amount: true,
        paymentDate: true,
      },
    })

    const dailyBreakdown = dailyTransactions.reduce((acc, t) => {
      const date = t.paymentDate.toISOString().split('T')[0]
      if (!acc[date]) {
        acc[date] = 0
      }
      acc[date] += t.amount
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      summary: {
        totalAmount,
        totalCount,
        byFeeHead,
        byAccountsOfficer,
        dailyBreakdown: Object.entries(dailyBreakdown)
          .map(([date, amount]) => ({ date, amount }))
          .sort((a, b) => a.date.localeCompare(b.date)),
      },
      recentTransactions: transactions.slice(0, 50),
    })
  } catch (error) {
    console.error('Get financial report error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

