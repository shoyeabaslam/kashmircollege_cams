import { NextResponse } from 'next/server'
import { requireCertificateOfficer } from '@/lib/middleware'
import { db } from '@/lib/db'
import { z } from 'zod'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const uploadCertificateSchema = z.object({
  studentId: z.string(),
  documentType: z.string().min(1),
})

// Generate application number: APP-YYYY-XXXXX
async function generateApplicationNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `APP-${year}-`

  // Find the last application number for this year
  const lastStudent = await db.student.findFirst({
    where: {
      applicationNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      applicationNumber: 'desc',
    },
  })

  let nextNumber = 1
  if (lastStudent?.applicationNumber) {
    const lastNum = parseInt(lastStudent.applicationNumber.split('-')[2])
    nextNumber = lastNum + 1
  }

  return `${prefix}${String(nextNumber).padStart(5, '0')}`
}

export const POST = requireCertificateOfficer(async (req) => {
  try {
    if (!req.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const studentId = formData.get('studentId') as string
    const documentType = formData.get('documentType') as string
    const file = formData.get('file') as File

    if (!studentId || !documentType || !file) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate student exists
    const student = await db.student.findUnique({
      where: { id: studentId },
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF, JPEG, JPG, and PNG are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      )
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'certificates')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const filename = `${studentId}-${timestamp}.${fileExtension}`
    const filepath = join(uploadsDir, filename)

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Generate application number if this is the first certificate for this student
    let applicationNumber = student.applicationNumber
    if (!applicationNumber) {
      applicationNumber = await generateApplicationNumber()
      await db.student.update({
        where: { id: studentId },
        data: {
          applicationNumber,
          certificateOfficerId: req.user.userId,
        },
      })
    } else if (!student.certificateOfficerId) {
      await db.student.update({
        where: { id: studentId },
        data: {
          certificateOfficerId: req.user.userId,
        },
      })
    }

    // Create certificate record
    const certificate = await db.certificate.create({
      data: {
        studentId,
        certificateOfficerId: req.user.userId,
        documentType,
        fileUrl: `/uploads/certificates/${filename}`,
        verificationStatus: 'PENDING',
      },
      include: {
        student: {
          select: {
            name: true,
            applicationNumber: true,
          },
        },
      },
    })

    return NextResponse.json({ certificate }, { status: 201 })
  } catch (error) {
    console.error('Upload certificate error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

export const GET = requireCertificateOfficer(async (req) => {
  try {
    if (!req.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || 'PENDING'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const certificates = await db.certificate.findMany({
      where: {
        certificateOfficerId: req.user.userId,
        verificationStatus: status as any,
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
      },
      orderBy: {
        uploadedAt: 'desc',
      },
      skip,
      take: limit,
    })

    const total = await db.certificate.count({
      where: {
        certificateOfficerId: req.user.userId,
        verificationStatus: status as any,
      },
    })

    return NextResponse.json({
      certificates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get certificates error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

