"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { resetGoogleAuth } from "@/lib/google-auth"

interface GoogleAuthContextType {
  isReady: boolean
  signIn: (callback: (credential: string) => void) => Promise<void>
}

const GoogleAuthContext = createContext<GoogleAuthContextType | null>(null)

interface GoogleAuthProviderProps {
  children: ReactNode
}

export function GoogleAuthProvider({ children }: GoogleAuthProviderProps) {
  const [isReady, setIsReady] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let isMounted = true
    
    const initGoogle = async () => {
      setIsLoading(true)
      
      try {
        // Reset any existing state first
        resetGoogleAuth()
        
        if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
          throw new Error("Google Client ID not configured")
        }

        // Load script fresh
        const script = document.createElement("script")
        script.src = "https://accounts.google.com/gsi/client"
        script.async = true
        script.defer = true
        
        const loadPromise = new Promise<void>((resolve, reject) => {
          script.onload = () => {
            // Wait for Google object to be available
            const checkGoogle = setInterval(() => {
              if (window.google && isMounted) {
                clearInterval(checkGoogle)
                resolve()
              }
            }, 50)
            
            // Timeout after 10 seconds
            setTimeout(() => {
              clearInterval(checkGoogle)
              reject(new Error("Google SDK load timeout"))
            }, 10000)
          }
          
          script.onerror = () => reject(new Error("Failed to load Google SDK"))
        })
        
        document.head.appendChild(script)
        await loadPromise
        
        if (isMounted && window.google) {
          setIsReady(true)
        }
      } catch (error) {
        console.error("Failed to initialize Google Auth:", error)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    // Only initialize once on mount
    if (!isLoading && !isReady) {
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

  return (
    <GoogleAuthContext.Provider value={{ isReady, signIn }}>
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
