"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import Sidebar from "@/components/sidebar"
import Navbar from "@/components/navbar"

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  logout: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const checkAuth = useCallback(() => {
    try {
      const isLoggedIn = localStorage.getItem("isLoggedIn") === "true"
      const userJson = localStorage.getItem("currentUser")
      
      if (isLoggedIn && userJson) {
        setUser(JSON.parse(userJson))
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error("Error checking auth:", error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Check authentication status when component mounts
  useEffect(() => {
    checkAuth()
    // Add event listener for storage changes
    window.addEventListener("storage", checkAuth)
    return () => window.removeEventListener("storage", checkAuth)
  }, [checkAuth])

  // Handle routing based on auth status
  useEffect(() => {
    if (!isLoading) {
      const publicRoutes = ["/login"]
      const isPublicRoute = publicRoutes.includes(pathname)

      if (!user && !isPublicRoute) {
        router.replace("/login")
      } else if (user && isPublicRoute) {
        router.replace("/")
      }
    }
  }, [user, isLoading, pathname, router])

  const logout = useCallback(() => {
    // Only remove auth-related items, preserve user data
    localStorage.removeItem("isLoggedIn")
    localStorage.removeItem("currentUser")
    setUser(null)
    router.replace("/login")
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        logout,
      }}
    >
      {!user && pathname === "/login" ? (
        children
      ) : user ? (
        <div className="flex h-screen overflow-hidden bg-gradient-to-br from-background/80 to-background">
          <div className="print:hidden">
            <Sidebar />
          </div>
          <div className="flex flex-col flex-1 overflow-hidden pl-[70px] print:pl-0">
            <div className="print:hidden">
              <Navbar />
            </div>
            <main className="flex-1 overflow-auto p-4 md:p-6 print:p-0 print:overflow-visible">
              <div className="mx-auto max-w-7xl animate-fadeIn print:max-w-none print:animate-none print:m-0">
                {children}
              </div>
            </main>
          </div>
        </div>
      ) : null}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
