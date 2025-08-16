"use client"

import { Button } from "@/components/ui/button"
import { useState } from "react"

interface GoogleAuthNuclearProps {
  userType?: "user" | "barber"
  onSuccess: (credential: string, userType?: "user" | "barber") => void
  onError: (error: any) => void
  disabled?: boolean
  isSignup?: boolean
}

export default function GoogleAuthNuclear({
  userType,
  onSuccess,
  onError,
  disabled = false,
  isSignup = false
}: GoogleAuthNuclearProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleAuth = async () => {
    setIsLoading(true)
    
    try {
      // NUCLEAR APPROACH: Use direct Google OAuth URL with popup
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
      if (!clientId) {
        throw new Error("Google Client ID not configured")
      }

      // Generate random state to prevent CSRF and force fresh requests
      const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      const nonce = Math.random().toString(36).substring(2, 15) + Date.now().toString()
      
      // Construct Google OAuth URL with cache-busting parameters
      const googleAuthUrl = new URL('https://accounts.google.com/oauth/v2/auth')
      googleAuthUrl.searchParams.set('client_id', clientId)
      googleAuthUrl.searchParams.set('redirect_uri', window.location.origin + '/api/auth/google/callback')
      googleAuthUrl.searchParams.set('response_type', 'code')
      googleAuthUrl.searchParams.set('scope', 'email profile openid')
      googleAuthUrl.searchParams.set('state', state + (userType ? `|${userType}` : ''))
      googleAuthUrl.searchParams.set('nonce', nonce)
      googleAuthUrl.searchParams.set('access_type', 'online')
      googleAuthUrl.searchParams.set('include_granted_scopes', 'false')
      googleAuthUrl.searchParams.set('prompt', 'select_account') // Force account selection
      
      // Add cache-busting parameters
      googleAuthUrl.searchParams.set('_t', Date.now().toString())
      googleAuthUrl.searchParams.set('_r', Math.random().toString())
      
      console.log("🚀 Opening Google Auth popup with URL:", googleAuthUrl.toString())

      // Open popup window
      const popup = window.open(
        googleAuthUrl.toString(),
        'googleauth',
        'width=500,height=600,scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=no,menubar=no'
      )

      if (!popup) {
        throw new Error("Popup blocked. Please allow popups for this site.")
      }

      // Listen for the popup to close or send a message
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed)
          setIsLoading(false)
          onError(new Error("Authentication cancelled"))
        }
      }, 1000)

      // Listen for messages from the popup
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return
        
        clearInterval(checkClosed)
        popup.close()
        window.removeEventListener('message', handleMessage)
        setIsLoading(false)

        if (event.data.success) {
          console.log("✅ Google Auth successful:", event.data)
          onSuccess(event.data.credential || event.data.code, userType)
        } else {
          console.error("❌ Google Auth failed:", event.data.error)
          onError(new Error(event.data.error || "Authentication failed"))
        }
      }

      window.addEventListener('message', handleMessage)

    } catch (error) {
      console.error("❌ Google Auth error:", error)
      setIsLoading(false)
      onError(error)
    }
  }

  const buttonText = () => {
    if (isLoading) return "Opening Google..."
    if (isSignup && userType) {
      return `Continue with Google as ${userType === "user" ? "Customer" : "Barber"}`
    }
    return "Continue with Google"
  }

  return (
    <Button
      type="button"
      onClick={handleGoogleAuth}
      disabled={disabled || isLoading}
      className="w-full flex items-center justify-center gap-3 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
    >
      {isLoading ? (
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
