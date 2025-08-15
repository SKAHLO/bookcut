"use client"

import { useEffect } from "react"

/**
 * Hook to ensure Google Auth is completely clean and fresh
 * Prevents browser caching issues that require cache clearing
 */
export function useGoogleAuthClean() {
  useEffect(() => {
    // Run on every page load/navigation to prevent cached state
    const cleanGoogleAuth = () => {
      console.log("🧹 Cleaning Google Auth for fresh start...")
      
      // 1. Clear all Google-related globals
      if (typeof window !== 'undefined') {
        delete (window as any).google
        delete (window as any).gapi
        delete (window as any).googleCallbackDispatcher
        delete (window as any).__google_oauth
        delete (window as any).g_state
      }
      
      // 2. Remove all Google-related DOM elements
      const googleElements = document.querySelectorAll(`
        script[src*="google"],
        script[src*="gsi"],
        [data-client-id],
        .g_id_signin,
        [role="button"][aria-labelledby*="google"],
        iframe[src*="google"],
        div[id*="google"]
      `)
      
      googleElements.forEach(el => {
        console.log("🗑️ Removing cached Google element:", el.tagName, el.className || el.id)
        el.remove()
      })
      
      // 3. Clear any cached authentication state in sessionStorage/localStorage
      try {
        const keysToRemove = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && (key.includes('google') || key.includes('gsi') || key.includes('oauth'))) {
            keysToRemove.push(key)
          }
        }
        keysToRemove.forEach(key => {
          localStorage.removeItem(key)
          console.log("🗑️ Cleared localStorage:", key)
        })
        
        const sessionKeysToRemove = []
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i)
          if (key && (key.includes('google') || key.includes('gsi') || key.includes('oauth'))) {
            sessionKeysToRemove.push(key)
          }
        }
        sessionKeysToRemove.forEach(key => {
          sessionStorage.removeItem(key)
          console.log("🗑️ Cleared sessionStorage:", key)
        })
      } catch (error) {
        console.warn("Could not clear storage:", error)
      }
      
      console.log("✅ Google Auth cleaned successfully")
    }
    
    // Clean immediately on mount
    cleanGoogleAuth()
    
    // Also clean on focus (when user returns to tab)
    const handleFocus = () => {
      console.log("👁️ Tab focused - cleaning Google Auth cache...")
      cleanGoogleAuth()
    }
    
    window.addEventListener('focus', handleFocus)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [])
}
