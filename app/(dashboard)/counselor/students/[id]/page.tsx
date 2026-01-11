'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Plus } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

interface Student {
  id: string
  name: string
  email: string
  phone: string
  address: string
  academicDetails: any
  status: string
  applicationNumber: string | null
  createdAt: string
  counselor: {
    name: string
    email: string
  }
  counselingRemarks: Array<{
    id: string
    remark: string
    createdAt: string
    counselor: {
      name: string
    }
  }>
  certificates: Array<{
    id: string
    documentType: string
    verificationStatus: string
    uploadedAt: string
  }>
  feeTransactions: Array<{
    id: string
    amount: number
    receiptNumber: string
    paymentDate: string
    feeHead: {
      name: string
    }
  }>
}

export default function StudentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const studentId = params.id as string

  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)
  const [remark, setRemark] = useState('')
  const [addingRemark, setAddingRemark] = useState(false)

  useEffect(() => {
    fetchStudent()
  }, [studentId])

  const fetchStudent = async () => {
    try {
      const response = await fetch(`/api/students/${studentId}`)
      if (response.ok) {
        const data = await response.json()
        setStudent(data.student)
      } else {
        router.push('/counselor')
      }
    } catch (error) {
      console.error('Error fetching student:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddRemark = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!remark.trim()) return

    setAddingRemark(true)
    try {
      const response = await fetch(`/api/students/${studentId}/remarks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ remark }),
      })

      if (response.ok) {
        setRemark('')
        fetchStudent()
      }
    } catch (error) {
      console.error('Error adding remark:', error)
    } finally {
      setAddingRemark(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading student details...</div>
  }

  if (!student) {
    return <div className="text-center py-8">Student not found</div>
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      UNDER_REVIEW: 'bg-blue-100 text-blue-800',
      CERTIFICATE_VERIFIED: 'bg-green-100 text-green-800',
      FEES_PAID: 'bg-purple-100 text-purple-800',
      COMPLETED: 'bg-gray-100 text-gray-800',
      REJECTED: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/counselor">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{student.name}</h1>
          <p className="text-muted-foreground">{student.email}</p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
            student.status
          )}`}
        >
          {student.status.replace(/_/g, ' ')}
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm text-muted-foreground">Email</Label>
              <p className="font-medium">{student.email}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Phone</Label>
              <p className="font-medium">{student.phone}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Address</Label>
              <p className="font-medium">{student.address}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Application Number</Label>
              <p className="font-medium">{student.applicationNumber || 'Not assigned'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Academic Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {student.academicDetails && typeof student.academicDetails === 'object' ? (
              <>
                {student.academicDetails.degree && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Degree</Label>
                    <p className="font-medium">{student.academicDetails.degree}</p>
                  </div>
                )}
                {student.academicDetails.institution && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Institution</Label>
                    <p className="font-medium">{student.academicDetails.institution}</p>
                  </div>
                )}
                {student.academicDetails.yearOfPassing && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Year of Passing</Label>
                    <p className="font-medium">{student.academicDetails.yearOfPassing}</p>
                  </div>
                )}
                {student.academicDetails.percentage && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Percentage</Label>
                    <p className="font-medium">{student.academicDetails.percentage}%</p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">No academic details available</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Counseling Remarks</CardTitle>
          <CardDescription>Add remarks about this student</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleAddRemark} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="remark">New Remark</Label>
              <Textarea
                id="remark"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="Enter your remark..."
                rows={3}
                disabled={addingRemark}
              />
            </div>
            <Button type="submit" disabled={addingRemark || !remark.trim()}>
              <Plus className="mr-2 h-4 w-4" />
              {addingRemark ? 'Adding...' : 'Add Remark'}
            </Button>
          </form>

          <div className="mt-6 space-y-4">
            {student.counselingRemarks.length === 0 ? (
              <p className="text-muted-foreground text-sm">No remarks yet</p>
            ) : (
              student.counselingRemarks.map((remark) => (
                <div key={remark.id} className="border-l-4 border-primary pl-4 py-2">
                  <p className="text-sm">{remark.remark}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {remark.counselor.name} • {formatDate(remark.createdAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {student.certificates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Certificates ({student.certificates.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {student.certificates.map((cert) => (
                <div key={cert.id} className="flex justify-between items-center py-2 border-b">
                  <div>
                    <p className="font-medium">{cert.documentType}</p>
                    <p className="text-sm text-muted-foreground">
                      {cert.verificationStatus} • {formatDate(cert.uploadedAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {student.feeTransactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Fee Transactions ({student.feeTransactions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {student.feeTransactions.map((transaction) => (
                <div key={transaction.id} className="flex justify-between items-center py-2 border-b">
                  <div>
                    <p className="font-medium">{transaction.feeHead.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Receipt: {transaction.receiptNumber} • {formatDate(transaction.paymentDate)}
                    </p>
                  </div>
                  <p className="font-medium">₹{transaction.amount}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

