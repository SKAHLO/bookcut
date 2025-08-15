"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { resetGoogleAuth } from "@/lib/google-auth"

interface GoogleAuthContextType {
  isReady: boolean
  isLoading: boolean
  error: string | null
  signIn: (callback: (credential: string) => void) => Promise<void>
  retry: () => void
}

const GoogleAuthContext = createContext<GoogleAuthContextType | null>(null)

interface GoogleAuthProviderProps {
  children: ReactNode
}

export function GoogleAuthProvider({ children }: GoogleAuthProviderProps) {
  const [isReady, setIsReady] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    
    const initGoogle = async () => {
      console.log("🚀 Starting Google Auth initialization...")
      setIsLoading(true)
      setError(null)
      
      try {
        // Check environment variable
        if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
          throw new Error("Google Client ID not configured")
        }
        console.log("✅ Google Client ID found")

        // Reset any existing state first
        resetGoogleAuth()
        console.log("✅ Reset Google auth state")

        // Check if script already exists
        let existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')
        if (existingScript) {
          console.log("🔄 Removing existing Google script")
          existingScript.remove()
        }

        // Load script fresh
        console.log("📥 Loading Google script...")
        const script = document.createElement("script")
        script.src = "https://accounts.google.com/gsi/client"
        script.async = true
        script.defer = true
        
        const loadPromise = new Promise<void>((resolve, reject) => {
          script.onload = () => {
            console.log("📦 Google script loaded, waiting for window.google...")
            // Wait for Google object to be available
            const checkGoogle = setInterval(() => {
              if (window.google && isMounted) {
                console.log("✅ window.google is available!")
                clearInterval(checkGoogle)
                resolve()
              } else {
                console.log("⏳ Still waiting for window.google...")
              }
            }, 100)
            
            // Timeout after 15 seconds (increased)
            setTimeout(() => {
              console.error("❌ Timeout waiting for window.google")
              clearInterval(checkGoogle)
              reject(new Error("Google SDK load timeout - window.google not available"))
            }, 15000)
          }
          
          script.onerror = (e) => {
            console.error("❌ Failed to load Google script:", e)
            reject(new Error("Failed to load Google SDK script"))
          }
        })
        
        document.head.appendChild(script)
        await loadPromise
        
        if (isMounted && window.google) {
          console.log("🎉 Google Auth ready!")
          setIsReady(true)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error"
        console.error("❌ Failed to initialize Google Auth:", errorMessage)
        setError(errorMessage)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    // Only initialize once on mount
    if (!isLoading && !isReady && !error) {
      initGoogle()
    }

    return () => {
      isMounted = false
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const signIn = async (callback: (credential: string) => void): Promise<void> => {
    if (!isReady || !window.google) {
      throw new Error("Google Sign-In not ready")
    }

    return new Promise((resolve, reject) => {
      try {
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          callback: (response: any) => {
            callback(response.credential)
            resolve()
          },
        })
        
        window.google.accounts.id.prompt()
      } catch (error) {
        reject(error)
      }
    })
  }

  const retry = () => {
    setError(null)
    setIsReady(false)
    setIsLoading(false)
    // This will trigger the useEffect again
  }

  return (
    <GoogleAuthContext.Provider value={{ 
      isReady, 
      isLoading, 
      error, 
      signIn, 
      retry 
    }}>
      {children}
    </GoogleAuthContext.Provider>
  )
}

export function useGoogleAuth() {
  const context = useContext(GoogleAuthContext)
  if (!context) {
    throw new Error("useGoogleAuth must be used within GoogleAuthProvider")
  }
  return context
}

// Global type declaration
declare global {
  interface Window {
    google: any
  }
}
