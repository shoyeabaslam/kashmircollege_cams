import { StudentList } from '@/components/counselor/StudentList'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { Role } from '@prisma/client'
import { redirect } from 'next/navigation'

export default async function CounselorDashboard() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) {
    redirect('/login')
  }

  const payload = verifyToken(token)
  if (!payload || payload.role !== Role.ADMISSION_COUNSELOR) {
    redirect('/login')
  }

  // Get statistics
  const totalStudents = await db.student.count({
    where: { counselorId: payload.userId },
  })

  const pendingStudents = await db.student.count({
    where: {
      counselorId: payload.userId,
      status: 'PENDING',
    },
  })

  const verifiedStudents = await db.student.count({
    where: {
      counselorId: payload.userId,
      status: 'CERTIFICATE_VERIFIED',
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admission Counselor Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Manage student profiles and counseling remarks
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingStudents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{verifiedStudents}</div>
          </CardContent>
        </Card>
      </div>

      <StudentList />
    </div>
  )
}

