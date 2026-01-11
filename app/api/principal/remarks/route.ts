import { NextResponse } from 'next/server'
import { requirePrincipal } from '@/lib/middleware'
import { db } from '@/lib/db'
import { z } from 'zod'

const createRemarkSchema = z.object({
  remark: z.string().min(1),
  date: z.string().optional(),
})

export const POST = requirePrincipal(async (req) => {
  try {
    if (!req.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { remark, date } = createRemarkSchema.parse(body)

    const principalRemark = await db.principalRemark.create({
      data: {
        remark,
        date: date ? new Date(date) : new Date(),
        principalId: req.user.userId,
      },
    })

    return NextResponse.json({ remark: principalRemark }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create principal remark error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

export const GET = requirePrincipal(async (req) => {
  try {
    if (!req.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '30')

    const remarks = await db.principalRemark.findMany({
      where: {
        principalId: req.user.userId,
      },
      orderBy: {
        date: 'desc',
      },
      take: limit,
    })

    return NextResponse.json({ remarks })
  } catch (error) {
    console.error('Get principal remarks error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

