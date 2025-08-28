"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuthStore } from "@/lib/store"

interface RouteGuardProps {
  children: React.ReactNode
}

export function RouteGuard({ children }: RouteGuardProps) {
  const { user } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const [hydrated, setHydrated] = useState(false)

  // Wait for zustand persist hydration to avoid false redirects
  useEffect(() => {
    try {
      // set immediately if already hydrated
      // @ts-ignore
      if (useAuthStore.persist?.hasHydrated?.()) setHydrated(true)
      // @ts-ignore
      const unsub = useAuthStore.persist?.onFinishHydration?.(() => setHydrated(true))
      return () => {
        if (typeof unsub === "function") unsub()
      }
    } catch {
      setHydrated(true)
    }
  }, [])

  useEffect(() => {
    // Allow access to login page without authentication
    if (pathname === "/login") {
      return
    }

    // Wait hydration before enforcing auth
    if (!hydrated) return

    // Redirect to login if not authenticated after hydration
    if (!user) {
      router.push("/login")
      return
    }

    // Role-based access control
    if (pathname.startsWith("/admin") && user.role !== "teacher") {
      router.push("/")
      return
    }
  }, [user, pathname, router, hydrated])

  // Block rendering until hydration to prevent flashing/redirect loops
  if (!hydrated) return null

  // Show nothing while redirecting unauthenticated users
  if (pathname !== "/login" && !user) {
    return null
  }

  // Block admin routes for students
  if (pathname.startsWith("/admin") && user?.role !== "teacher") {
    return null
  }

  return <>{children}</>
}
