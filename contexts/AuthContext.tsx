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
  googleSignIn: (credential: string, userType: "user" | "barber") => Promise<boolean>
  googleSignInLogin: (credential: string) => Promise<boolean>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = () => {
      try {
        const token = localStorage.getItem("token")
        const userData = localStorage.getItem("user")

        console.log("Initializing auth, token exists:", !!token, "userData exists:", !!userData)

        if (token && userData) {
          const payload = JSON.parse(atob(token.split(".")[1]))
          const currentTime = Date.now() / 1000
          const parsedUser = JSON.parse(userData)

          console.log("Token payload:", payload)
          console.log("Stored user data:", parsedUser)
          console.log("User type from localStorage:", parsedUser.userType)

          if (payload.exp > currentTime) {
            setUser(parsedUser)
            console.log("User set from localStorage:", parsedUser)
          } else {
            console.log("Token expired, clearing storage")
            localStorage.removeItem("token")
            localStorage.removeItem("user")
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error)
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
      console.log("Attempting login for:", email)

      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      console.log("Login response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("Login successful:", data.user.email)

        localStorage.setItem("token", data.token)
        localStorage.setItem("user", JSON.stringify(data.user))
        setUser(data.user)
        return true
      } else {
        const errorText = await response.text()
        console.error("Login failed:", errorText)

        try {
          const errorData = JSON.parse(errorText)
          console.error("Login error:", errorData.error)
        } catch {
          console.error("Login error (non-JSON):", errorText)
        }
        return false
      }
    } catch (error) {
      console.error("Login error:", error)
      return false
    }
  }

  const signup = async (userData: any): Promise<boolean> => {
    try {
      console.log("Attempting signup for:", userData.email)

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })

      console.log("Signup response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("Signup successful:", data.message)
        return true
      } else {
        const errorText = await response.text()
        console.error("Signup failed:", errorText)

        try {
          const errorData = JSON.parse(errorText)
          console.error("Signup error:", errorData.error)
        } catch {
          console.error("Signup error (non-JSON):", errorText)
        }
        return false
      }
    } catch (error) {
      console.error("Signup error:", error)
      return false
    }
  }

  const googleSignIn = async (credential: string, userType: "user" | "barber"): Promise<boolean> => {
    try {
      console.log("Attempting Google sign-in for userType:", userType)
      console.log("Sending to API:", { credential: credential.substring(0, 20) + "...", userType })

      const response = await fetch("/api/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ credential, userType }),
      })

      console.log("Google sign-in response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("Google sign-in successful:", data.user.email)

        localStorage.setItem("token", data.token)
        localStorage.setItem("user", JSON.stringify(data.user))
        setUser(data.user)
        return true
      } else {
        const errorText = await response.text()
        console.error("Google sign-in failed:", errorText)

        try {
          const errorData = JSON.parse(errorText)
          console.error("Google sign-in error:", errorData.error)
        } catch {
          console.error("Google sign-in error (non-JSON):", errorText)
        }
        return false
      }
    } catch (error) {
      console.error("Google sign-in error:", error)
      return false
    }
  }

  const googleSignInLogin = async (credential: string): Promise<boolean> => {
    try {
      console.log("Attempting Google sign-in for existing user")

      const response = await fetch("/api/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ credential }),
      })

      console.log("Google sign-in response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("Google sign-in successful:", data.user.email)
        console.log("Received user data from API:", data.user)
        console.log("User type from API:", data.user.userType)

        localStorage.setItem("token", data.token)
        localStorage.setItem("user", JSON.stringify(data.user))
        setUser(data.user)
        console.log("Set user in context:", data.user)
        return true
      } else {
        const errorText = await response.text()
        console.error("Google sign-in failed:", errorText)

        try {
          const errorData = JSON.parse(errorText)
          console.error("Google sign-in error:", errorData.error)
          
          // If user not found, show appropriate message
          if (response.status === 404) {
            alert("Account not found. Please sign up first or use email/password login.")
          }
        } catch {
          console.error("Google sign-in error (non-JSON):", errorText)
        }
        return false
      }
    } catch (error) {
      console.error("Google sign-in error:", error)
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, googleSignIn, googleSignInLogin, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
