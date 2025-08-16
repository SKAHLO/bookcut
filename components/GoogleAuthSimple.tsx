"use client"

import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"

interface GoogleAuthSimpleProps {
  userType?: "user" | "barber"
  onSuccess: (credential: string, userType?: "user" | "barber") => void
  onError: (error: any) => void
  disabled?: boolean
  isSignup?: boolean
}

export default function GoogleAuthSimple({
  userType,
  onSuccess,
  onError,
  disabled = false,
  isSignup = false
}: GoogleAuthSimpleProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Simple Google SDK loading
    const loadGoogle = () => {
      if (window.google) {
        setIsReady(true)
        return
      }

      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      
      script.onload = () => {
        console.log("Google script loaded")
        // Simple check for Google availability
        const interval = setInterval(() => {
          if (window.google) {
            clearInterval(interval)
            setIsReady(true)
            console.log("Google SDK ready")
          }
        }, 100)
        
        // Simple timeout
        setTimeout(() => {
          clearInterval(interval)
          if (!window.google) {
            console.log("Google SDK took too long to load")
          }
        }, 30000)
      }
      
      script.onerror = () => {
        console.log("Failed to load Google SDK")
      }
      
      document.head.appendChild(script)
    }

    loadGoogle()
  }, [])

  const handleGoogleAuth = async () => {
    if (!window.google) {
      onError(new Error("Google authentication not available"))
      return
    }

    setIsLoading(true)
    console.log("Starting Google authentication...")

    try {
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        callback: (response: any) => {
          console.log("Google credential received")
          setIsLoading(false)
          onSuccess(response.credential, userType)
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      })

      // Try to show prompt
      setTimeout(() => {
        try {
          window.google.accounts.id.prompt()
        } catch (error) {
          console.log("Prompt blocked, but authentication is ready")
          setIsLoading(false)
        }
      }, 100)

    } catch (error) {
      console.error("Google auth error:", error)
      setIsLoading(false)
      onError(error)
    }
  }

  const buttonText = () => {
    if (!isReady) return "Loading Google..."
    if (isLoading) return "Authenticating..."
    if (isSignup && userType) {
      return `Continue with Google as ${userType === "user" ? "Customer" : "Barber"}`
    }
    return "Continue with Google"
  }

  return (
    <Button
      type="button"
      onClick={handleGoogleAuth}
      disabled={disabled || !isReady || isLoading}
      className="w-full flex items-center justify-center gap-3 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
    >
      {(isLoading || !isReady) ? (
        <div className="animate-spin w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full"></div>
      ) : (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      )}
      {buttonText()}
    </Button>
  )
}

// Global type declaration
declare global {
  interface Window {
    google: any
  }
}
