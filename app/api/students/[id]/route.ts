import { NextResponse } from 'next/server'
import { requireCounselor } from '@/lib/middleware'
import { db } from '@/lib/db'
import { z } from 'zod'

const updateStudentSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(10).optional(),
  address: z.string().min(1).optional(),
  academicDetails: z
    .object({
      degree: z.string().optional(),
      institution: z.string().optional(),
      yearOfPassing: z.string().optional(),
      percentage: z.number().optional(),
    })
    .optional(),
})

export const GET = requireCounselor(async (req) => {
  try {
    if (!req.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const id = req.nextUrl.pathname.split('/').pop()

    const student = await db.student.findFirst({
      where: {
        id: id,
        counselorId: req.user.userId, // Only allow access to own students
      },
      include: {
        counselor: {
          select: {
            name: true,
            email: true,
          },
        },
        counselingRemarks: {
          orderBy: { createdAt: 'desc' },
          include: {
            counselor: {
              select: {
                name: true,
              },
            },
          },
        },
        certificates: {
          include: {
            certificateOfficer: {
              select: {
                name: true,
              },
            },
          },
        },
        feeTransactions: {
          include: {
            feeHead: true,
            accountsOfficer: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    return NextResponse.json({ student })
  } catch (error) {
    console.error('Get student error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

export const PATCH = requireCounselor(async (req) => {
  try {
    if (!req.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const id = req.nextUrl.pathname.split('/').pop()
    const body = await req.json()
    const validatedData = updateStudentSchema.parse(body)

    // Verify student belongs to this counselor
    const existingStudent = await db.student.findFirst({
      where: {
        id: id,
        counselorId: req.user.userId,
      },
    })

    if (!existingStudent) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Update student (counselor can only update limited fields)
    const student = await db.student.update({
      where: { id: id },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.phone && { phone: validatedData.phone }),
        ...(validatedData.address && { address: validatedData.address }),
        ...(validatedData.academicDetails && {
          academicDetails: {
            ...(existingStudent.academicDetails as object),
            ...validatedData.academicDetails,
          },
        }),
      },
    })

    return NextResponse.json({ student })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Update student error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

