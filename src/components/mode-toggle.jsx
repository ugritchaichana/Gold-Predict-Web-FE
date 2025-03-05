"use client"

import * as React from "react"
import { MoonIcon, SunIcon, LaptopIcon } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useTheme } from "@/components/theme-provider"
import { themes } from "@/components/theme-provider"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-md">
          {theme === "light" ? (
            <SunIcon className="h-5 w-5" />
          ) : theme === "dark" ? (
            <MoonIcon className="h-5 w-5" />
          ) : (
            <LaptopIcon className="h-5 w-5" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themes.map((t) => (
          <DropdownMenuItem
            key={t}
            onClick={() => setTheme(t)}
            className={theme === t ? "bg-accent" : ""}
          >
            {t === "light" ? (
              <SunIcon className="mr-2 h-4 w-4" />
            ) : t === "dark" ? (
              <MoonIcon className="mr-2 h-4 w-4" />
            ) : (
              <LaptopIcon className="mr-2 h-4 w-4" />
            )}
            <span className="capitalize">{t}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 