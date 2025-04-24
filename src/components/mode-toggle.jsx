"use client"

import * as React from "react"
import { MoonIcon, SunIcon } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()
  
  // ฟังก์ชันสลับธีมระหว่าง light และ dark เมื่อกดปุ่ม
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-9 w-9 rounded-md transition-transform hover:scale-110 active:scale-95"
      aria-label="Toggle theme"
    >
      {theme === "light" ? (
        <SunIcon className="h-5 w-5 text-yellow-500" />
      ) : (
        <MoonIcon className="h-5 w-5 text-blue-400" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
} 