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
    const loadGoogle = async () => {
      try {
        // Remove any existing Google scripts to prevent caching
        document.querySelectorAll('script[src*="accounts.google.com"], script[src*="gsi"]').forEach(s => s.remove())
        
        // Clear Google globals
        if (typeof window !== 'undefined') {
          delete (window as any).google
          delete (window as any).gapi
        }

        // Load fresh Google script with cache busting
        const script = document.createElement('script')
        script.src = `https://accounts.google.com/gsi/client?v=${Date.now()}&nocache=${Math.random()}`
        script.async = true
        script.defer = true
        
        script.onload = () => {
          console.log("📦 Google script loaded")
          
          // Wait for window.google to be available
          const checkGoogle = setInterval(() => {
            if (window.google) {
              clearInterval(checkGoogle)
              console.log("✅ Google SDK ready")
              setIsReady(true)
            }
          }, 100)
          
          // Timeout after 15 seconds
          setTimeout(() => {
            clearInterval(checkGoogle)
            console.error("❌ Google SDK timeout")
            onError(new Error("Google SDK failed to load"))
          }, 15000)
        }
        
        script.onerror = () => {
          console.error("❌ Failed to load Google script")
          onError(new Error("Failed to load Google authentication"))
        }
        
        document.head.appendChild(script)
        
      } catch (error) {
        console.error("❌ Google loading error:", error)
        onError(error)
      }
    }

    loadGoogle()
  }, [onError])

  const handleGoogleAuth = async () => {
    if (!isReady || !window.google) {
      onError(new Error("Google authentication not ready"))
      return
    }

    setIsLoading(true)

    try {
      // Force fresh initialization every time
      const uniqueId = `google_${Date.now()}_${Math.random().toString(36).substring(7)}`
      
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        callback: (response: any) => {
          console.log("✅ Google credential received")
          setIsLoading(false)
          onSuccess(response.credential, userType)
        },
        auto_select: false,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: false, // Disable FedCM to prevent caching
        nonce: uniqueId,
      })

      // Small delay to ensure initialization is complete
      setTimeout(() => {
        console.log("📱 Prompting Google Sign-In...")
        window.google.accounts.id.prompt()
      }, 200)

    } catch (error) {
      console.error("❌ Google auth error:", error)
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
