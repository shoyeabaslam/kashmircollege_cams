'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Eye, FileText } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Student {
  id: string
  name: string
  email: string
  phone: string
  status: string
  applicationNumber: string | null
  createdAt: string
  counselingRemarks: Array<{ remark: string; createdAt: string }>
  certificates: Array<{ verificationStatus: string }>
  _count: {
    feeTransactions: number
  }
}

export function StudentList() {
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/students')
      if (response.ok) {
        const data = await response.json()
        setStudents(data.students || [])
      }
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoading(false)
    }
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

  if (loading) {
    return <div className="text-center py-8">Loading students...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Students</h2>
        <Button onClick={() => router.push('/counselor/students/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Student
        </Button>
      </div>

      {students.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No students found. Create your first student profile.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {students.map((student) => (
            <Card key={student.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{student.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {student.email} • {student.phone}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      student.status
                    )}`}
                  >
                    {student.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    <p>Application: {student.applicationNumber || 'N/A'}</p>
                    <p>Created: {formatDate(student.createdAt)}</p>
                    <p>
                      Certificates: {student.certificates.length} | Remarks:{' '}
                      {student.counselingRemarks.length} | Fees:{' '}
                      {student._count.feeTransactions}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/counselor/students/${student.id}`)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

