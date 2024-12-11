'use client'

import { useUser } from '@/lib/contexts/UserContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Navbar } from '@/components/design/Navbar'
import { Footer } from '@/components/design/Footer'
import { DashboardNav } from '@/components/dashboard/DashboardNav'
import HeadLoader from '@/components/design/loader'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, isLoading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !session) {
      router.push('/auth/sign-in')
    }
  }, [session, isLoading, router])

  if (isLoading) {
    return <HeadLoader />
  }

  if (!session) {
    return null
  }

  return (
    <div className="h-svh bg-background flex flex-col overflow-hidden">
      <Navbar />
      <main className="flex-1 overflow-hidden pt-16">
        <div className="max-w-3xl mx-auto px-4 py-8 h-full">
          <DashboardNav />
          {children}
        </div>
      </main>
      <Footer />
    </div>
  )
}
