import { NextResponse } from 'next/server'
import { requireAccountsOfficer } from '@/lib/middleware'
import { db } from '@/lib/db'
import PDFDocument from 'pdfkit'

export const GET = requireAccountsOfficer(async (req) => {
  try {
    if (!req.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const id = req.nextUrl.pathname.split('/').pop()

    const transaction = await db.feeTransaction.findFirst({
      where: {
        id: id,
        accountsOfficerId: req.user.userId,
      },
      include: {
        student: true,
        feeHead: true,
        accountsOfficer: {
          select: {
            name: true,
          },
        },
      },
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // Generate PDF using pdfkit
    const chunks: Buffer[] = []
    const doc = new PDFDocument({ margin: 50 })

    doc.on('data', (chunk: Buffer) => chunks.push(chunk))

    // Header
    doc.fontSize(20).text('Fee Receipt', { align: 'center' })
    doc.moveDown()

    // Receipt details
    doc.fontSize(12)
    doc.text(`Receipt Number: ${transaction.receiptNumber}`)
    doc.text(`Date: ${new Date(transaction.paymentDate).toLocaleDateString()}`)
    doc.moveDown()

    // Student details
    doc.fontSize(14).text('Student Details:', { underline: true })
    doc.fontSize(12)
    doc.text(`Name: ${transaction.student.name}`)
    doc.text(`Application Number: ${transaction.student.applicationNumber || 'N/A'}`)
    doc.text(`Email: ${transaction.student.email}`)
    doc.moveDown()

    // Fee details
    doc.fontSize(14).text('Fee Details:', { underline: true })
    doc.fontSize(12)
    doc.text(`Fee Head: ${transaction.feeHead.name}`)
    if (transaction.feeHead.description) {
      doc.text(`Description: ${transaction.feeHead.description}`)
    }
    doc.text(`Amount: ₹${transaction.amount.toFixed(2)}`)
    doc.moveDown()

    // Footer
    doc.fontSize(10)
    doc.text(
      `Processed by: ${transaction.accountsOfficer.name}`,
      { align: 'right' }
    )
    doc.text('This is a computer-generated receipt.', { align: 'center' })

    doc.end()

    // Wait for PDF generation to complete
    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks))
      })
      doc.on('error', reject)
    })

    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="receipt-${transaction.receiptNumber}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Generate receipt error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

