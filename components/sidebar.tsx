"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FileText,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useMobile } from "@/hooks/use-mobile"
import { useRouter } from "next/navigation"

const navItems = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Invoices",
    href: "/invoices",
    icon: FileText,
  },
  {
    name: "Customers",
    href: "/customers",
    icon: Users,
  },
  {
    name: "Reports",
    href: "/reports",
    icon: BarChart3,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const isMobile = useMobile()
  const [isOpen, setIsOpen] = useState(true)
  const router = useRouter()

  // Load sidebar state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem("sidebarOpen")
    if (savedState !== null) {
      setIsOpen(savedState === "true")
    } else {
      // Default to closed on mobile, open on desktop
      setIsOpen(!isMobile)
    }
  }, [isMobile])

  const toggleSidebar = () => {
    const newState = !isOpen
    setIsOpen(newState)
    localStorage.setItem("sidebarOpen", String(newState))
  }

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn")
    localStorage.removeItem("user")
    router.push("/login")
  }

  return (
    <>
      <Button variant="outline" size="icon" className="fixed top-4 left-4 z-50 md:hidden" onClick={toggleSidebar}>
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </Button>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col bg-black/40 backdrop-blur-xl border-r border-border/40 transition-all duration-300 ease-in-out",
          isOpen ? "w-64" : "w-[70px]",
          isMobile && !isOpen && "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between h-16 border-b border-border/40 px-4">
          <h1
            className={cn(
              "text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent transition-opacity duration-300",
              !isOpen && !isMobile && "opacity-0",
            )}
          >
            A1 Glass
          </h1>
          {!isMobile && (
            <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-8 w-8">
              {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </Button>
          )}
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center px-4 py-3 text-sm rounded-lg transition-all duration-200 group",
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_10px_rgba(0,255,255,0.1)]"
                    : "text-muted-foreground hover:bg-primary/5 hover:text-primary",
                )}
                onClick={() => isMobile && setIsOpen(false)}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary",
                    !isOpen && !isMobile && "mr-0",
                    isOpen && "mr-3",
                  )}
                />
                <span
                  className={cn(
                    "transition-opacity duration-300",
                    !isOpen && !isMobile && "opacity-0 w-0 overflow-hidden",
                  )}
                >
                  {item.name}
                </span>
                {isActive && <div className="absolute inset-y-0 left-0 w-1 bg-primary rounded-r-full" />}
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-border/40">
          <button
            className={cn(
              "flex items-center w-full px-4 py-2 text-sm text-muted-foreground rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors",
            )}
            onClick={handleLogout}
          >
            <LogOut className={cn("h-5 w-5", !isOpen && !isMobile && "mr-0", isOpen && "mr-3")} />
            <span
              className={cn("transition-opacity duration-300", !isOpen && !isMobile && "opacity-0 w-0 overflow-hidden")}
            >
              Logout
            </span>
          </button>
        </div>
      </aside>
    </>
  )
}
