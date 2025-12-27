"use client"

import Link from "next/link"
import { ThemeToggle } from "./ThemeToggle"
import { Button } from "@/components/ui/button"
import { useUserStore } from "@/lib/store/useUserStore"
import { Trophy, User } from "lucide-react"

export function Header() {
  const { xp, rankTitle } = useUserStore()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
              Quiz Master
            </span>
        </Link>

        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="font-medium text-foreground">{xp} XP</span>
            <span className="text-xs">({rankTitle})</span>
          </div>
          
          <nav className="flex items-center space-x-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" asChild>
                <Link href="/profile">
                    <User className="h-5 w-5" />
                </Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  )
}
