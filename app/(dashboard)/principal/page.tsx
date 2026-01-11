'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Users, DollarSign, FileText, Plus } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface DailyAdmissions {
  date: string
  summary: {
    totalStudents: number
    byStatus: Array<{ status: string; count: number }>
    byCounselor: Array<{ counselorId: string; count: number; counselorName: string }>
  }
  recentStudents: Array<{
    id: string
    name: string
    email: string
    status: string
    createdAt: string
    counselor: { name: string }
  }>
}

interface FeeSummary {
  date: string
  summary: {
    totalAmount: number
    totalCount: number
    byFeeHead: Record<string, { count: number; total: number }>
  }
  transactions: Array<{
    id: string
    amount: number
    receiptNumber: string
    student: { name: string; applicationNumber: string | null }
    feeHead: { name: string }
  }>
}

export default function PrincipalDashboard() {
  const [admissions, setAdmissions] = useState<DailyAdmissions | null>(null)
  const [feeSummary, setFeeSummary] = useState<FeeSummary | null>(null)
  const [remark, setRemark] = useState('')
  const [addingRemark, setAddingRemark] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  )

  useEffect(() => {
    fetchData()
  }, [selectedDate])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [admissionsRes, feeRes] = await Promise.all([
        fetch(`/api/reports/daily-admissions?date=${selectedDate}`),
        fetch(`/api/reports/fee-summary?date=${selectedDate}`),
      ])

      if (admissionsRes.ok) {
        const data = await admissionsRes.json()
        setAdmissions(data)
      }

      if (feeRes.ok) {
        const data = await feeRes.json()
        setFeeSummary(data)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddRemark = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!remark.trim()) return

    setAddingRemark(true)
    try {
      const response = await fetch('/api/principal/remarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          remark,
          date: selectedDate,
        }),
      })

      if (response.ok) {
        setRemark('')
        fetchData()
      }
    } catch (error) {
      console.error('Error adding remark:', error)
    } finally {
      setAddingRemark(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Principal Monitoring Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Daily admission and fee collection summaries
        </p>
        <div className="mt-4">
          <Label htmlFor="date">Select Date</Label>
          <input
            id="date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="mt-1 block rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Admissions</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {admissions?.summary.totalStudents || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fee Collection</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {feeSummary ? formatCurrency(feeSummary.summary.totalAmount) : '₹0'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {feeSummary?.summary.totalCount || 0} transactions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Date</CardTitle>
            <FileText className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">{formatDate(selectedDate)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Admission Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : (
              <div className="space-y-4">
                {admissions?.summary.byStatus.map((status) => (
                  <div key={status.status} className="flex justify-between">
                    <span className="text-sm capitalize">
                      {status.status.replace(/_/g, ' ')}:
                    </span>
                    <span className="font-medium">{status.count}</span>
                  </div>
                ))}
                {admissions && admissions.summary.byCounselor.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium mb-2">By Counselor:</p>
                    {admissions.summary.byCounselor.map((c) => (
                      <div key={c.counselorId} className="flex justify-between text-sm">
                        <span>{c.counselorName}:</span>
                        <span>{c.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fee Collection Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : feeSummary && Object.keys(feeSummary.summary.byFeeHead).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(feeSummary.summary.byFeeHead).map(([name, data]) => (
                  <div key={name} className="flex justify-between py-2 border-b">
                    <div>
                      <p className="font-medium">{name}</p>
                      <p className="text-xs text-muted-foreground">
                        {data.count} transaction{data.count !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <p className="font-medium">{formatCurrency(data.total)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No fee collection for this date</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily Remarks</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddRemark} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="remark">Add Remark for {formatDate(selectedDate)}</Label>
              <Textarea
                id="remark"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="Enter your daily remarks..."
                rows={3}
                disabled={addingRemark}
              />
            </div>
            <Button type="submit" disabled={addingRemark || !remark.trim()}>
              <Plus className="mr-2 h-4 w-4" />
              {addingRemark ? 'Adding...' : 'Add Remark'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

