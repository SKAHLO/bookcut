"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface User {
  id: string
  email: string
  name: string
  userType: "user" | "barber"
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  signup: (userData: any) => Promise<boolean>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing token on mount
    const initAuth = () => {
      try {
        const token = localStorage.getItem("token")
        const userData = localStorage.getItem("user")

        if (token && userData) {
          // Verify token is not expired
          const payload = JSON.parse(atob(token.split(".")[1]))
          const currentTime = Date.now() / 1000

          if (payload.exp > currentTime) {
            setUser(JSON.parse(userData))
          } else {
            // Token expired, clear storage
            localStorage.removeItem("token")
            localStorage.removeItem("user")
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error)
        // Clear invalid data
        localStorage.removeItem("token")
        localStorage.removeItem("user")
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem("token", data.token)
        localStorage.setItem("user", JSON.stringify(data.user))
        setUser(data.user)
        return true
      } else {
        const errorData = await response.json()
        console.error("Login error:", errorData.error)
        return false
      }
    } catch (error) {
      console.error("Login error:", error)
      return false
    }
  }

  const signup = async (userData: any): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      })

      if (response.ok) {
        return true
      } else {
        const errorData = await response.json()
        console.error("Signup error:", errorData.error)
        return false
      }
    } catch (error) {
      console.error("Signup error:", error)
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, login, signup, logout, loading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
