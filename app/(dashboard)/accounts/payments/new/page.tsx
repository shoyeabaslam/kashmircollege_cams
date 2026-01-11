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
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

const paymentSchema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  feeHeadId: z.string().min(1, 'Fee head is required'),
  amount: z.string().refine((val) => !Number.isNaN(Number.parseFloat(val)) && Number.parseFloat(val) > 0, {
    message: 'Amount must be a positive number',
  }),
  paymentDate: z.string().optional(),
})

type PaymentFormData = z.infer<typeof paymentSchema>

interface Student {
  id: string
  name: string
  email: string
  applicationNumber: string | null
}

interface FeeHead {
  id: string
  name: string
  amount: number
  active: boolean
}

export default function NewPaymentPage() {
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [feeHeads, setFeeHeads] = useState<FeeHead[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState('')
  const [selectedFeeHead, setSelectedFeeHead] = useState<FeeHead | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      paymentDate: new Date().toISOString().split('T')[0],
    },
  })

  const selectedFeeHeadId = watch('feeHeadId')

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (selectedFeeHeadId) {
      const feeHead = feeHeads.find((fh) => fh.id === selectedFeeHeadId)
      setSelectedFeeHead(feeHead || null)
      if (feeHead) {
        setValue('amount', feeHead.amount.toString())
      }
    }
  }, [selectedFeeHeadId, feeHeads, setValue])

  const renderStudentOptions = () => {
    if (loadingData) {
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

  const renderFeeHeadOptions = () => {
    if (loadingData) {
      return (
        <SelectItem value="_loading" disabled>
          Loading fee heads...
        </SelectItem>
      )
    }
    
    if (feeHeads.length === 0) {
      return (
        <SelectItem value="_empty" disabled>
          No fee heads available. Create one first.
        </SelectItem>
      )
    }
    
    return feeHeads.map((feeHead) => (
      <SelectItem key={feeHead.id} value={feeHead.id}>
        {feeHead.name} - {formatCurrency(feeHead.amount)}
      </SelectItem>
    ))
  }

  const fetchData = async () => {
    try {
      const [studentsRes, feeHeadsRes] = await Promise.all([
        fetch('/api/fees/students'),
        fetch('/api/fee-heads?active=true'),
      ])

      if (studentsRes.ok) {
        const studentsData = await studentsRes.json()
        setStudents(studentsData.students || [])
      }

      if (feeHeadsRes.ok) {
        const feeHeadsData = await feeHeadsRes.json()
        setFeeHeads(feeHeadsData.feeHeads || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const onSubmit = async (data: PaymentFormData) => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/fees/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: data.studentId,
          feeHeadId: data.feeHeadId,
          amount: Number.parseFloat(data.amount),
          paymentDate: data.paymentDate || new Date().toISOString(),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to record payment')
        setLoading(false)
        return
      }

      router.push('/accounts')
    } catch (err) {
      console.error('Payment error:', err)
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/accounts">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Record Payment</h1>
          <p className="text-muted-foreground">Record a new fee payment</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
          <CardDescription>Enter payment details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="studentId">Student *</Label>
              <Select
                value={watch('studentId') || ''}
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
              <Label htmlFor="feeHeadId">Fee Head *</Label>
              <Select
                value={watch('feeHeadId') || ''}
                onValueChange={(value) => setValue('feeHeadId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a fee head" />
                </SelectTrigger>
                <SelectContent>
                  {renderFeeHeadOptions()}
                </SelectContent>
              </Select>
              {errors.feeHeadId && (
                <p className="text-sm text-red-600">{errors.feeHeadId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                {...register('amount')}
                placeholder="0.00"
                disabled={!!selectedFeeHead}
              />
              {selectedFeeHead && (
                <p className="text-sm text-muted-foreground">
                  Default amount: {formatCurrency(selectedFeeHead.amount)}
                </p>
              )}
              {errors.amount && (
                <p className="text-sm text-red-600">{errors.amount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentDate">Payment Date *</Label>
              <Input
                id="paymentDate"
                type="date"
                {...register('paymentDate')}
                disabled={loading}
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <Link href="/accounts">
                <Button type="button" variant="outline" disabled={loading}>
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={loading}>
                {loading ? 'Recording...' : 'Record Payment'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

