"use client"

import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, User, Globe } from "lucide-react"

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <span className="text-xl font-bold">SkillsHub</span>
        </Link>

        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="搜索skills..."
              className="pl-8"
            />
          </div>
        </div>

        <div className="flex items-center space-x-4 ml-auto">
          <Button variant="ghost" size="icon">
            <Globe className="h-5 w-5" />
          </Button>

          <Link href="/login">
            <Button variant="ghost">
              <User className="h-4 w-4 mr-2" />
              登录
            </Button>
          </Link>

          <Link href="/register">
            <Button>注册</Button>
          </Link>
        </div>
      </div>
    </nav>
  )
}
