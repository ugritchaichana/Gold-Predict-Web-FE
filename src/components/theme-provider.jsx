"use client"

import * as React from "react"
import { createContext, useContext, useEffect, useState } from "react"

export const themes = ["light", "dark"]

const ThemeProviderContext = createContext({ 
  theme: "dark", 
  setTheme: () => null 
})

export function ThemeProvider({
  children,
  storageKey = "vite-ui-theme",
  ...props
}) {
  const getSystemPreference = () => 
    window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem(storageKey) || getSystemPreference()
  })
  
  const setTheme = (newTheme) => {
    // console.log('Theme changing from:', theme, 'to:', newTheme);
    // console.log('Theme change timestamp:', new Date().toISOString());
    setThemeState(newTheme);
  }
  useEffect(() => {
    const root = window.document.documentElement
    
    root.style.transition = "background-color 0.8s ease, color 0.8s ease, border-color 0.8s ease"
    
    document.head.insertAdjacentHTML(
      'beforeend',
      `<style>
        * {
          transition: background-color 0.8s ease, color 0.8s ease, border-color 0.8s ease, fill 0.8s ease, stroke 0.8s ease !important;
        }
      </style>`
    )
    
    root.classList.remove("light", "dark")
    root.classList.add(theme)
    
    return () => {
      root.style.transition = ""
    }
  }, [theme])

  const value = {
    theme,
    setTheme: (newTheme) => {
      localStorage.setItem(storageKey, newTheme)
      setTheme(newTheme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
} 