"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

type Role = "customer" | "agent" | "admin"

export interface User {
  id: string
  name: string
  email: string
  role: Role
}

interface AuthContextProps {
  user: User | null
  login: (user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  // Persist user in localStorage for demo purposes
  useEffect(() => {
    const stored = localStorage.getItem("repairhub:user")
    if (stored) setUser(JSON.parse(stored))
  }, [])

  const login = (u: User) => {
    setUser(u)
    localStorage.setItem("repairhub:user", JSON.stringify(u))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("repairhub:user")
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
