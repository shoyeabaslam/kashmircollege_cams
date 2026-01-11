'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, DollarSign, FileCheck, TrendingUp } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface AdmissionsReport {
  summary: {
    totalStudents: number
    byStatus: Array<{ status: string; count: number }>
    byCounselor: Array<{
      counselorId: string
      count: number
      counselorName: string
      counselorEmail: string
    }>
    certificates: {
      total: number
      byStatus: Array<{ status: string; count: number }>
    }
  }
  recentStudents: Array<{
    id: string
    name: string
    email: string
    status: string
    applicationNumber: string | null
    createdAt: string
    counselor: { name: string; email: string }
    certificateOfficer: { name: string } | null
    _count: {
      certificates: number
      feeTransactions: number
      counselingRemarks: number
    }
  }>
}

interface FinancialReport {
  summary: {
    totalAmount: number
    totalCount: number
    byFeeHead: Record<string, { count: number; total: number }>
    byAccountsOfficer: Record<string, { count: number; total: number }>
    dailyBreakdown: Array<{ date: string; amount: number }>
  }
  recentTransactions: Array<{
    id: string
    amount: number
    receiptNumber: string
    paymentDate: string
    student: { name: string; applicationNumber: string | null }
    feeHead: { name: string }
    accountsOfficer: { name: string }
  }>
}

export default function DirectorDashboard() {
  const [admissions, setAdmissions] = useState<AdmissionsReport | null>(null)
  const [financial, setFinancial] = useState<FinancialReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState(
    new Date(new Date().setMonth(new Date().getMonth() - 1))
      .toISOString()
      .split('T')[0]
  )
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split('T')[0]
  )

  useEffect(() => {
    fetchReports()
  }, [startDate, endDate])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const [admissionsRes, financialRes] = await Promise.all([
        fetch(
          `/api/reports/admissions?startDate=${startDate}&endDate=${endDate}`
        ),
        fetch(
          `/api/reports/financial?startDate=${startDate}&endDate=${endDate}`
        ),
      ])

      if (admissionsRes.ok) {
        const data = await admissionsRes.json()
        setAdmissions(data)
      }

      if (financialRes.ok) {
        const data = await financialRes.json()
        setFinancial(data)
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Director Monitoring Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive admission and financial reports
        </p>
        <div className="mt-4 flex space-x-4">
          <div>
            <label className="text-sm font-medium">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 block rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 block rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
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
            <CardTitle className="text-sm font-medium">Total Collection</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {financial ? formatCurrency(financial.summary.totalAmount) : '₹0'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {financial?.summary.totalCount || 0} transactions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certificates</CardTitle>
            <FileCheck className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {admissions?.summary.certificates.total || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {admissions?.summary.certificates.byStatus.find((s) => s.status === 'VERIFIED')
                ?.count || 0}{' '}
              verified
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Period</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {formatDate(startDate)} to {formatDate(endDate)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="admissions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="admissions">Admissions Report</TabsTrigger>
          <TabsTrigger value="financial">Financial Report</TabsTrigger>
        </TabsList>

        <TabsContent value="admissions" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Students by Status</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-4">Loading...</div>
                ) : (
                  <div className="space-y-2">
                    {admissions?.summary.byStatus.map((status) => (
                      <div key={status.status} className="flex justify-between py-2 border-b">
                        <span className="text-sm capitalize">
                          {status.status.replace(/_/g, ' ')}:
                        </span>
                        <span className="font-medium">{status.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Students by Counselor</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-4">Loading...</div>
                ) : (
                  <div className="space-y-2">
                    {admissions?.summary.byCounselor.map((c) => (
                      <div key={c.counselorId} className="flex justify-between py-2 border-b">
                        <div>
                          <p className="text-sm font-medium">{c.counselorName}</p>
                          <p className="text-xs text-muted-foreground">{c.counselorEmail}</p>
                        </div>
                        <span className="font-medium">{c.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Students</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Loading...</div>
              ) : admissions && admissions.recentStudents.length > 0 ? (
                <div className="space-y-4">
                  {admissions.recentStudents.slice(0, 20).map((student) => (
                    <div key={student.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{student.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {student.email} • {student.applicationNumber || 'No App Number'}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Counselor: {student.counselor.name} • Status:{' '}
                            {student.status.replace(/_/g, ' ')}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Certificates: {student._count.certificates} | Fees:{' '}
                            {student._count.feeTransactions} | Remarks:{' '}
                            {student._count.counselingRemarks}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(student.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No students found
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Collection by Fee Head</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-4">Loading...</div>
                ) : financial && Object.keys(financial.summary.byFeeHead).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(financial.summary.byFeeHead).map(([name, data]) => (
                      <div key={name} className="flex justify-between py-2 border-b">
                        <div>
                          <p className="text-sm font-medium">{name}</p>
                          <p className="text-xs text-muted-foreground">
                            {data.count} transaction{data.count !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <span className="font-medium">{formatCurrency(data.total)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No data available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Collection by Accounts Officer</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-4">Loading...</div>
                ) : financial && Object.keys(financial.summary.byAccountsOfficer).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(financial.summary.byAccountsOfficer).map(([name, data]) => (
                      <div key={name} className="flex justify-between py-2 border-b">
                        <div>
                          <p className="text-sm font-medium">{name}</p>
                          <p className="text-xs text-muted-foreground">
                            {data.count} transaction{data.count !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <span className="font-medium">{formatCurrency(data.total)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No data available</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Loading...</div>
              ) : financial && financial.recentTransactions.length > 0 ? (
                <div className="space-y-4">
                  {financial.recentTransactions.slice(0, 20).map((transaction) => (
                    <div key={transaction.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{transaction.feeHead.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {transaction.student.name} ({transaction.student.applicationNumber || 'N/A'})
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Receipt: {transaction.receiptNumber} • Officer:{' '}
                            {transaction.accountsOfficer.name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(transaction.amount)}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(transaction.paymentDate)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No transactions found
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

