import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { Role } from '@prisma/client'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { LogOut, User } from 'lucide-react'
import { db } from '@/lib/db'

export default async function DirectorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) {
    redirect('/login')
  }

  const payload = verifyToken(token)
  if (!payload || payload.role !== Role.DIRECTOR) {
    redirect('/login')
  }

  // Fetch user name from database
  const user = await db.user.findUnique({
    where: { id: payload.userId },
    select: { name: true, email: true },
  })

  async function handleLogout() {
    'use server'
    const { cookies } = await import('next/headers')
    cookies().delete('token')
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/director" className="text-xl font-bold text-primary">
                CAMS - Director Portal
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground flex items-center">
                <User className="mr-2 h-4 w-4" />
                {user?.name || user?.email || payload.email}
              </span>
              <form action={handleLogout}>
                <Button type="submit" variant="ghost" size="sm">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </form>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}

