import { NextResponse } from 'next/server'
import { requireCounselor } from '@/lib/middleware'
import { db } from '@/lib/db'
import { z } from 'zod'
import { Role } from '@prisma/client'

const createStudentSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(10),
  address: z.string().min(1),
  academicDetails: z.object({
    degree: z.string().optional(),
    institution: z.string().optional(),
    yearOfPassing: z.string().optional(),
    percentage: z.number().optional(),
  }),
})

export const POST = requireCounselor(async (req) => {
  try {
    if (!req.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = createStudentSchema.parse(body)

    // Check if student with email already exists
    const existingStudent = await db.student.findFirst({
      where: { email: validatedData.email },
    })

    if (existingStudent) {
      return NextResponse.json(
        { error: 'Student with this email already exists' },
        { status: 400 }
      )
    }

    // Create student
    const student = await db.student.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone,
        address: validatedData.address,
        academicDetails: validatedData.academicDetails,
        counselorId: req.user.userId,
        status: 'PENDING',
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

    return NextResponse.json({ student }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create student error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

export const GET = requireCounselor(async (req) => {
  try {
    if (!req.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Only get students assigned to this counselor
    const students = await db.student.findMany({
      where: {
        counselorId: req.user.userId,
      },
      include: {
        counselingRemarks: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        certificates: {
          select: {
            verificationStatus: true,
          },
        },
        _count: {
          select: {
            feeTransactions: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    })

    const total = await db.student.count({
      where: {
        counselorId: req.user.userId,
      },
    })

    return NextResponse.json({
      students,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get students error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

