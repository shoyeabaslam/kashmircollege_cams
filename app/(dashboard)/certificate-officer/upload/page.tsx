'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Upload } from 'lucide-react'
import Link from 'next/link'

const uploadSchema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  documentType: z.string().min(1, 'Document type is required'),
  file: z.any().refine((file) => file instanceof File, 'File is required'),
})

type UploadFormData = z.infer<typeof uploadSchema>

interface Student {
  id: string
  name: string
  email: string
  applicationNumber: string | null
}

export default function UploadCertificatePage() {
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingStudents, setLoadingStudents] = useState(true)
  const [error, setError] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
  })

  const selectedStudentId = watch('studentId')

  useEffect(() => {
    fetchStudents()
  }, [])

  const renderStudentOptions = () => {
    if (loadingStudents) {
      return (
        <SelectItem value="_loading" disabled>
          Loading students...
        </SelectItem>
      )
    }
    
    if (students.length === 0) {
      return (
        <SelectItem value="_empty" disabled>
          No students available
        </SelectItem>
      )
    }
    
    return students.map((student) => (
      <SelectItem key={student.id} value={student.id}>
        {student.name} ({student.email}) -{' '}
        {student.applicationNumber || 'No Application Number'}
      </SelectItem>
    ))
  }

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/certificates/students')
      if (response.ok) {
        const data = await response.json()
        setStudents(data.students || [])
      }
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoadingStudents(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
      if (!allowedTypes.includes(file.type)) {
        setError('Invalid file type. Only PDF, JPEG, JPG, and PNG are allowed.')
        return
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size exceeds 10MB limit')
        return
      }

      setSelectedFile(file)
      setValue('file', file)
      setError('')
    }
  }

  const onSubmit = async (data: UploadFormData) => {
    if (!selectedFile) {
      setError('Please select a file')
      return
    }

    setLoading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('studentId', data.studentId)
      formData.append('documentType', data.documentType)
      formData.append('file', selectedFile)

      const response = await fetch('/api/certificates', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to upload certificate')
        setLoading(false)
        return
      }

      router.push('/certificate-officer')
    } catch (err) {
      console.error('Upload error:', err)
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/certificate-officer">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Upload Certificate</h1>
          <p className="text-muted-foreground">Upload and verify student certificates</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Certificate Upload</CardTitle>
          <CardDescription>Upload a certificate document for verification</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="studentId">Student *</Label>
              <Select
                value={selectedStudentId || ''}
                onValueChange={(value) => setValue('studentId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  {renderStudentOptions()}
                </SelectContent>
              </Select>
              {errors.studentId && (
                <p className="text-sm text-red-600">{errors.studentId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="documentType">Document Type *</Label>
              <Input
                id="documentType"
                {...register('documentType')}
                placeholder="e.g., 10th Marksheet, 12th Marksheet, Aadhar Card, etc."
                disabled={loading}
              />
              {errors.documentType && (
                <p className="text-sm text-red-600">{errors.documentType.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Certificate File *</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                disabled={loading}
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
              {errors.file && (
                <p className="text-sm text-red-600">{errors.file.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Allowed formats: PDF, JPEG, JPG, PNG (Max size: 10MB)
              </p>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>
            )}

            <div className="flex justify-end space-x-4">
              <Link href="/certificate-officer">
                <Button type="button" variant="outline" disabled={loading}>
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={loading || !selectedFile}>
                <Upload className="mr-2 h-4 w-4" />
                {loading ? 'Uploading...' : 'Upload Certificate'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

