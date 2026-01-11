'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Download, DollarSign, Receipt } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface FeeSummary {
  totalAmount: number
  totalCount: number
  byFeeHead: Record<string, { count: number; total: number }>
}

interface Transaction {
  id: string
  amount: number
  receiptNumber: string
  paymentDate: string
  student: {
    name: string
    applicationNumber: string | null
  }
  feeHead: {
    name: string
  }
}

export default function AccountsDashboard() {
  const router = useRouter()
  const [summary, setSummary] = useState<FeeSummary | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSummary()
    fetchTransactions()
  }, [])

  const fetchSummary = async () => {
    try {
      const response = await fetch('/api/fees/summary')
      if (response.ok) {
        const data = await response.json()
        setSummary(data.summary)
      }
    } catch (error) {
      console.error('Error fetching summary:', error)
    }
  }

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/fees/transactions?limit=10')
      if (response.ok) {
        const data = await response.json()
        setTransactions(data.transactions || [])
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadReceipt = async (transactionId: string) => {
    try {
      const response = await fetch(`/api/fees/receipt/${transactionId}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `receipt-${transactionId}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error downloading receipt:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Accounts Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage fee heads and record payments
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => router.push('/accounts/fee-heads')}
          >
            Manage Fee Heads
          </Button>
          <Button onClick={() => router.push('/accounts/payments/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Record Payment
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Collection</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary ? formatCurrency(summary.totalAmount) : '₹0'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Receipt className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fee Heads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary ? Object.keys(summary.byFeeHead).length : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {summary && Object.keys(summary.byFeeHead).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Collection by Fee Head</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(summary.byFeeHead).map(([name, data]) => (
                <div key={name} className="flex justify-between items-center py-2 border-b">
                  <div>
                    <p className="font-medium">{name}</p>
                    <p className="text-sm text-muted-foreground">
                      {data.count} transaction{data.count !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <p className="font-medium">{formatCurrency(data.total)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No transactions yet
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="border rounded-lg p-4 flex justify-between items-start"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold">{transaction.feeHead.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {transaction.student.name} ({transaction.student.applicationNumber || 'N/A'})
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Receipt: {transaction.receiptNumber} • {formatDate(transaction.paymentDate)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <p className="font-medium">{formatCurrency(transaction.amount)}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadReceipt(transaction.id)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Receipt
                    </Button>
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

