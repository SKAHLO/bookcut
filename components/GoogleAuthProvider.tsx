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

        // FORCE complete reset - prevent caching issues
        resetGoogleAuth()
        console.log("✅ Reset Google auth state")

        // Remove ALL Google scripts (including cached ones)
        const allGoogleScripts = document.querySelectorAll('script[src*="google"], script[src*="gsi"]')
        allGoogleScripts.forEach(script => {
          const scriptElement = script as HTMLScriptElement
          console.log("🗑️ Removing Google script:", scriptElement.src || 'unknown')
          script.remove()
        })

        // Clear any Google-related globals that might be cached
        if (typeof window !== 'undefined') {
          delete (window as any).google
          delete (window as any).gapi
          delete (window as any).googleCallbackDispatcher
          console.log("🧹 Cleared all Google globals")
        }

        // Load script fresh with cache-busting
        console.log("📥 Loading Google script...")
        const script = document.createElement("script")
        script.src = `https://accounts.google.com/gsi/client?v=${Date.now()}` // Cache busting
        script.async = true
        script.defer = true
        script.crossOrigin = "anonymous"
        
        // Add additional cache-busting attributes
        script.setAttribute('data-timestamp', Date.now().toString())
        script.setAttribute('data-nocache', 'true')
        
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
        // FORCE re-initialize every time to prevent cache issues
        console.log("🔄 Force re-initializing Google Sign-In...")
        
        // Clear any existing rendered buttons or popups
        const existingButtons = document.querySelectorAll('[data-client-id], .g_id_signin, [role="button"][aria-labelledby]')
        existingButtons.forEach(btn => btn.remove())
        
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          callback: (response: any) => {
            console.log("✅ Google sign-in callback received")
            callback(response.credential)
            resolve()
          },
          auto_select: false, // Never auto-select to avoid cache issues
          cancel_on_tap_outside: true,
        })
        
        // Add a small delay to ensure initialization is complete
        setTimeout(() => {
          console.log("📱 Prompting Google Sign-In...")
          window.google.accounts.id.prompt()
        }, 100)
        
      } catch (error) {
        console.error("❌ Google sign-in error:", error)
        reject(error)
      }
    })
  }

  const retry = () => {
    console.log("🔄 Retrying Google Auth initialization...")
    
    // Force complete cleanup
    resetGoogleAuth()
    
    // Clear all Google-related DOM elements
    const allGoogleElements = document.querySelectorAll('[data-client-id], .g_id_signin, [role="button"][aria-labelledby], script[src*="google"], script[src*="gsi"]')
    allGoogleElements.forEach(el => el.remove())
    
    // Clear state and trigger re-initialization
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
