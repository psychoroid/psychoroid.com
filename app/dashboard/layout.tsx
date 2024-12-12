'use client'

import { useUser } from '@/lib/contexts/UserContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
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
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  useEffect(() => {
    if (!isLoading) {
      setIsInitialLoad(false)
      if (!session) {
        router.push('/auth/sign-in')
      }
    }
  }, [session, isLoading, router])

  // Show loader only on initial load
  if (isInitialLoad && isLoading) {
    return <HeadLoader />
  }

  // Don't render anything while redirecting
  if (!session && !isLoading) {
    return null
  }

  return (
    <div className="h-svh bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 overflow-y-auto scrollbar-hide pt-16">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <DashboardNav />
          {children}
        </div>
      </main>
      <Footer />
    </div>
  )
}
