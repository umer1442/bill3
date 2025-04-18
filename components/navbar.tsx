"use client"

import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <div className="border-b">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex gap-6 md:gap-10">
          <h2 className="text-lg font-semibold">A1 Glass Enterprises</h2>
        </div>
        {user && (
          <div className="flex items-center gap-4">
            <p className="text-sm">{user.name}</p>
            <Button variant="ghost" size="icon" onClick={logout} title="Logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
