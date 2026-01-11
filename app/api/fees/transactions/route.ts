import { NextResponse } from 'next/server'
import { requireAccountsOfficer } from '@/lib/middleware'
import { db } from '@/lib/db'
import { z } from 'zod'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const createTransactionSchema = z.object({
  studentId: z.string(),
  feeHeadId: z.string(),
  amount: z.number().positive(),
  paymentDate: z.string().optional(),
})

// Generate receipt number: REC-YYYY-XXXXX
async function generateReceiptNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `REC-${year}-`

  const lastTransaction = await db.feeTransaction.findFirst({
    where: {
      receiptNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      receiptNumber: 'desc',
    },
  })

  let nextNumber = 1
  if (lastTransaction?.receiptNumber) {
    const lastNum = parseInt(lastTransaction.receiptNumber.split('-')[2])
    nextNumber = lastNum + 1
  }

  return `${prefix}${String(nextNumber).padStart(5, '0')}`
}

export const POST = requireAccountsOfficer(async (req) => {
  try {
    if (!req.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = createTransactionSchema.parse(body)

    // Verify student exists
    const student = await db.student.findUnique({
      where: { id: validatedData.studentId },
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Verify fee head exists and is active
    const feeHead = await db.feeHead.findFirst({
      where: {
        id: validatedData.feeHeadId,
        active: true,
      },
    })

    if (!feeHead) {
      return NextResponse.json(
        { error: 'Fee head not found or inactive' },
        { status: 404 }
      )
    }

    // Generate receipt number
    const receiptNumber = await generateReceiptNumber()

    // Create transaction
    const transaction = await db.feeTransaction.create({
      data: {
        studentId: validatedData.studentId,
        feeHeadId: validatedData.feeHeadId,
        amount: validatedData.amount,
        receiptNumber,
        accountsOfficerId: req.user.userId,
        paymentDate: validatedData.paymentDate
          ? new Date(validatedData.paymentDate)
          : new Date(),
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            applicationNumber: true,
          },
        },
        feeHead: true,
        accountsOfficer: {
          select: {
            name: true,
          },
        },
      },
    })

    // Update student status if applicable
    if (student.status !== 'COMPLETED' && student.status !== 'FEES_PAID') {
      await db.student.update({
        where: { id: validatedData.studentId },
        data: { status: 'FEES_PAID' },
      })
    }

    return NextResponse.json({ transaction }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create transaction error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

export const GET = requireAccountsOfficer(async (req) => {
  try {
    if (!req.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const transactions = await db.feeTransaction.findMany({
      where: {
        accountsOfficerId: req.user.userId,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            applicationNumber: true,
          },
        },
        feeHead: true,
      },
      orderBy: {
        paymentDate: 'desc',
      },
      skip,
      take: limit,
    })

    const total = await db.feeTransaction.count({
      where: {
        accountsOfficerId: req.user.userId,
      },
    })

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get transactions error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

