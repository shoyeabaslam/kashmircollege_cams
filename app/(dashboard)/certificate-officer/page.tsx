'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, CheckCircle, XCircle, Clock } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Certificate {
  id: string
  documentType: string
  verificationStatus: string
  uploadedAt: string
  student: {
    id: string
    name: string
    email: string
    applicationNumber: string | null
  }
}

export default function CertificateOfficerDashboard() {
  const router = useRouter()
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('PENDING')

  useEffect(() => {
    fetchCertificates()
  }, [statusFilter])

  const fetchCertificates = async () => {
    try {
      const response = await fetch(`/api/certificates?status=${statusFilter}`)
      if (response.ok) {
        const data = await response.json()
        setCertificates(data.certificates || [])
      }
    } catch (error) {
      console.error('Error fetching certificates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (certificateId: string, status: string) => {
    try {
      const response = await fetch(`/api/certificates/${certificateId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ verificationStatus: status }),
      })

      if (response.ok) {
        fetchCertificates()
      }
    } catch (error) {
      console.error('Error updating certificate:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'REJECTED':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      VERIFIED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const pendingCount = certificates.filter((c) => c.verificationStatus === 'PENDING').length
  const verifiedCount = certificates.filter((c) => c.verificationStatus === 'VERIFIED').length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Certificate Verification Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Upload and verify student certificates
          </p>
        </div>
        <Button onClick={() => router.push('/certificate-officer/upload')}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Certificate
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Verification</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{verifiedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Certificates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{certificates.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Certificates</CardTitle>
            <div className="flex space-x-2">
              <Button
                variant={statusFilter === 'PENDING' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('PENDING')}
              >
                Pending
              </Button>
              <Button
                variant={statusFilter === 'VERIFIED' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('VERIFIED')}
              >
                Verified
              </Button>
              <Button
                variant={statusFilter === 'REJECTED' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('REJECTED')}
              >
                Rejected
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading certificates...</div>
          ) : certificates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No certificates found
            </div>
          ) : (
            <div className="space-y-4">
              {certificates.map((certificate) => (
                <div
                  key={certificate.id}
                  className="border rounded-lg p-4 flex justify-between items-start"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(certificate.verificationStatus)}
                      <div>
                        <h3 className="font-semibold">{certificate.documentType}</h3>
                        <p className="text-sm text-muted-foreground">
                          {certificate.student.name} ({certificate.student.email})
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Application: {certificate.student.applicationNumber || 'N/A'} • Uploaded:{' '}
                          {formatDate(certificate.uploadedAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        certificate.verificationStatus
                      )}`}
                    >
                      {certificate.verificationStatus}
                    </span>
                    {certificate.verificationStatus === 'PENDING' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleVerify(certificate.id, 'VERIFIED')}
                        >
                          Verify
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleVerify(certificate.id, 'REJECTED')}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

