"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (email === "admin@a1glass.com" && password === "admin") {
        // Store auth state and user data in localStorage
        const userData = {
          id: "admin",
          name: "Admin User",
          email: email,
          role: "admin"
        }
        
        // Initialize user-specific storage areas only if they don't exist
        if (!localStorage.getItem(`invoices_${userData.id}`)) {
          localStorage.setItem(`invoices_${userData.id}`, JSON.stringify([]))
        }
        if (!localStorage.getItem(`customers_${userData.id}`)) {
          localStorage.setItem(`customers_${userData.id}`, JSON.stringify([]))
        }
        
        // Set auth state last to trigger auth provider update
        localStorage.setItem("currentUser", JSON.stringify(userData))
        localStorage.setItem("isLoggedIn", "true")

        toast({
          title: "Login successful",
          description: "Welcome to A1 Glass Enterprises Invoice System",
        })

        // Force a synchronous dispatch of storage event
        window.dispatchEvent(new Event('storage'))
        
        // Add a small delay to ensure state is updated
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Use replace and await to ensure navigation completes
        await router.replace("/")
      } else {
        toast({
          variant: "destructive",  
          title: "Login failed",
          description: "Invalid email or password. Try admin@a1glass.com/admin",
        })
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Login error:", error)
      toast({
        variant: "destructive",
        title: "Login error", 
        description: "An error occurred while logging in. Please try again.",
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background/80 to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="w-32 h-32 relative mb-4">
            <Image src="/images/logo.png" alt="A1 Glass Enterprises Logo" fill className="object-contain" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
          <CardDescription className="text-center">Enter your credentials to access the invoice system</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@a1glass.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
