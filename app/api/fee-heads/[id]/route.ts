import { NextResponse } from 'next/server'
import { requireAccountsOfficer } from '@/lib/middleware'
import { db } from '@/lib/db'
import { z } from 'zod'

const updateFeeHeadSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  amount: z.number().positive().optional(),
  active: z.boolean().optional(),
})

export const PATCH = requireAccountsOfficer(async (req) => {
  try {
    if (!req.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const id = req.nextUrl.pathname.split('/').pop()
    const body = await req.json()
    const validatedData = updateFeeHeadSchema.parse(body)

    const feeHead = await db.feeHead.update({
      where: { id: id },
      data: validatedData,
    })

    return NextResponse.json({ feeHead })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Update fee head error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

