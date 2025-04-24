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
  // เช็คธีมระบบของผู้ใช้เป็นค่าเริ่มต้น
  const getSystemPreference = () => 
    window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"

  const [theme, setTheme] = useState(() => {
    // หากมีค่าที่บันทึกไว้ใน localStorage ให้ใช้ค่านั้น
    // ถ้าไม่มีให้ใช้ค่าที่อ่านได้จากธีมของระบบ
    return localStorage.getItem(storageKey) || getSystemPreference()
  })
  useEffect(() => {
    const root = window.document.documentElement
    
    // เพิ่ม transition CSS ให้กับ document element เพื่อให้เปลี่ยนธีมอย่างนุ่มนวล
    root.style.transition = "background-color 0.8s ease, color 0.8s ease, border-color 0.8s ease"
    
    // สำหรับองค์ประกอบอื่นๆ ที่อาจเปลี่ยนสีตามธีม
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
    
    // ทำความสะอาด style เมื่อ unmount
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