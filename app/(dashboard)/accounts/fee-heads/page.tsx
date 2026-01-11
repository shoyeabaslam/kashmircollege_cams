'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ArrowLeft, Plus, Edit, Check, X } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

const feeHeadSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  amount: z.string().refine((val) => !Number.isNaN(Number.parseFloat(val)) && Number.parseFloat(val) > 0, {
    message: 'Amount must be a positive number',
  }),
})

type FeeHeadFormData = z.infer<typeof feeHeadSchema>

interface FeeHead {
  id: string
  name: string
  description: string | null
  amount: number
  active: boolean
}

export default function FeeHeadsPage() {
  const [feeHeads, setFeeHeads] = useState<FeeHead[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FeeHeadFormData>({
    resolver: zodResolver(feeHeadSchema),
  })

  useEffect(() => {
    fetchFeeHeads()
  }, [])

  const fetchFeeHeads = async () => {
    try {
      const response = await fetch('/api/fee-heads')
      if (response.ok) {
        const data = await response.json()
        setFeeHeads(data.feeHeads || [])
      }
    } catch (error) {
      console.error('Error fetching fee heads:', error)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: FeeHeadFormData) => {
    try {
      if (editingId) {
        // Update existing
        const response = await fetch(`/api/fee-heads/${editingId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: data.name,
            description: data.description || null,
            amount: Number.parseFloat(data.amount),
          }),
        })

        if (response.ok) {
          fetchFeeHeads()
          reset()
          setEditingId(null)
          setShowForm(false)
        }
      } else {
        // Create new
        const response = await fetch('/api/fee-heads', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: data.name,
            description: data.description || null,
            amount: Number.parseFloat(data.amount),
          }),
        })

        if (response.ok) {
          fetchFeeHeads()
          reset()
          setShowForm(false)
        }
      }
    } catch (error) {
      console.error('Error saving fee head:', error)
    }
  }

  const handleEdit = (feeHead: FeeHead) => {
    setEditingId(feeHead.id)
    setValue('name', feeHead.name)
    setValue('description', feeHead.description || '')
    setValue('amount', feeHead.amount.toString())
    setShowForm(true)
  }

  const handleToggleActive = async (feeHead: FeeHead) => {
    try {
      const response = await fetch(`/api/fee-heads/${feeHead.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          active: !feeHead.active,
        }),
      })

      if (response.ok) {
        fetchFeeHeads()
      }
    } catch (error) {
      console.error('Error toggling fee head:', error)
    }
  }

  const handleCancel = () => {
    reset()
    setEditingId(null)
    setShowForm(false)
  }

  const renderFeeHeadsList = () => {
    if (loading) {
      return <div className="text-center py-8">Loading fee heads...</div>
    }

    if (feeHeads.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No fee heads found. Create your first fee head.
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {feeHeads.map((feeHead) => (
          <div
            key={feeHead.id}
            className="border rounded-lg p-4 flex justify-between items-start"
          >
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold">{feeHead.name}</h3>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    feeHead.active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {feeHead.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              {feeHead.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {feeHead.description}
                </p>
              )}
              <p className="text-lg font-medium mt-2">
                {formatCurrency(feeHead.amount)}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleEdit(feeHead)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button
                size="sm"
                variant={feeHead.active ? 'destructive' : 'default'}
                onClick={() => handleToggleActive(feeHead)}
              >
                {feeHead.active ? (
                  <>
                    <X className="mr-2 h-4 w-4" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Activate
                  </>
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/accounts">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Manage Fee Heads</h1>
          <p className="text-muted-foreground">Define and manage fee structure</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Fee Head
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Fee Head' : 'Create Fee Head'}</CardTitle>
            <CardDescription>
              {editingId ? 'Update fee head details' : 'Add a new fee head to the system'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Fee Head Name *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="e.g., Tuition Fee, Hostel Fee, Transport Fee"
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Optional description"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  {...register('amount')}
                  placeholder="0.00"
                />
                {errors.amount && (
                  <p className="text-sm text-red-600">{errors.amount.message}</p>
                )}
              </div>

              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button type="submit">{editingId ? 'Update' : 'Create'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Fee Heads</CardTitle>
        </CardHeader>
        <CardContent>
          {renderFeeHeadsList()}
        </CardContent>
      </Card>
    </div>
  )
}

