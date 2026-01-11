import { NextResponse } from 'next/server'
import { requireAccountsOfficer } from '@/lib/middleware'
import { db } from '@/lib/db'
import { z } from 'zod'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const createFeeHeadSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  amount: z.number().positive(),
})

export const POST = requireAccountsOfficer(async (req) => {
  try {
    if (!req.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = createFeeHeadSchema.parse(body)

    const feeHead = await db.feeHead.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        amount: validatedData.amount,
        accountsOfficerId: req.user.userId,
        active: true,
      },
    })

    return NextResponse.json({ feeHead }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create fee head error:', error)
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
    const active = searchParams.get('active')

    const feeHeads = await db.feeHead.findMany({
      where: {
        ...(active !== null && { active: active === 'true' }),
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ feeHeads })
  } catch (error) {
    console.error('Get fee heads error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

