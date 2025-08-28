"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuthStore } from "@/lib/store"

interface RouteGuardProps {
  children: React.ReactNode
}

export function RouteGuard({ children }: RouteGuardProps) {
  const { user } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Allow access to login page without authentication
    if (pathname === "/login") {
      return
    }

    // Redirect to login if not authenticated
    if (!user) {
      router.push("/login")
      return
    }

    // Role-based access control
    if (pathname.startsWith("/admin") && user.role !== "teacher") {
      router.push("/")
      return
    }
  }, [user, pathname, router])

  // Show loading or redirect for unauthenticated users
  if (pathname !== "/login" && !user) {
    return null
  }

  // Block admin routes for students
  if (pathname.startsWith("/admin") && user?.role !== "teacher") {
    return null
  }

  return <>{children}</>
}
