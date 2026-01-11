import { NextResponse } from 'next/server'
import { requireCounselor } from '@/lib/middleware'
import { db } from '@/lib/db'
import { z } from 'zod'

const createRemarkSchema = z.object({
  remark: z.string().min(1),
})

export const POST = requireCounselor(async (req) => {
  try {
    if (!req.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const studentId = req.nextUrl.pathname.split('/').slice(-2, -1)[0]
    const body = await req.json()
    const { remark } = createRemarkSchema.parse(body)

    // Verify student belongs to this counselor
    const student = await db.student.findFirst({
      where: {
        id: studentId,
        counselorId: req.user.userId,
      },
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Create remark
    const counselingRemark = await db.counselingRemark.create({
      data: {
        studentId,
        counselorId: req.user.userId,
        remark,
      },
      include: {
        counselor: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ remark: counselingRemark }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create remark error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

