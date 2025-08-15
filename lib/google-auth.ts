"use client"

/**
 * Centralized Google Authentication utility
 * Prevents multiple initializations and script loading conflicts
 */

let isGoogleLoaded = false
let isGoogleInitialized = false
let loadingPromise: Promise<void> | null = null
let initPromise: Promise<void> | null = null

// Current active callback
let activeCallback: ((credential: string) => void) | null = null

// Reset function to clear all state
export function resetGoogleAuth(): void {
  isGoogleLoaded = false
  isGoogleInitialized = false
  loadingPromise = null
  initPromise = null
  activeCallback = null
  
  // Remove existing script
  const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')
  if (existingScript) {
    existingScript.remove()
  }
  
  // Clear window.google
  if (typeof window !== 'undefined') {
    delete (window as any).google
  }
}

// Global Google callback function
function globalGoogleCallback(response: any) {
  console.log("Global Google callback triggered")
  
  if (activeCallback) {
    activeCallback(response.credential)
    activeCallback = null // Clear after use
  }
}

/**
 * Load and initialize Google Sign-In SDK
 */
export function loadGoogleSDK(): Promise<void> {
  if (loadingPromise) {
    return loadingPromise
  }

  loadingPromise = new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.google && isGoogleLoaded) {
      resolve()
      return
    }

    // Check if script already exists
    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')
    if (existingScript && window.google) {
      isGoogleLoaded = true
      resolve()
      return
    }

    // Load the script
    const script = document.createElement("script")
    script.src = "https://accounts.google.com/gsi/client"
    script.async = true
    script.defer = true
    
    script.onload = () => {
      // Wait for Google object to be fully available
      const checkGoogle = setInterval(() => {
        if (window.google) {
          clearInterval(checkGoogle)
          isGoogleLoaded = true
          console.log("Google SDK loaded successfully")
          resolve()
        }
      }, 50)
      
      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkGoogle)
        reject(new Error("Google SDK load timeout"))
      }, 10000)
    }
    
    script.onerror = () => {
      reject(new Error("Failed to load Google SDK"))
    }
    
    document.head.appendChild(script)
  })

  return loadingPromise
}

/**
 * Initialize Google Sign-In (only once)
 */
export async function initializeGoogleAuth(): Promise<void> {
  if (initPromise) {
    return initPromise
  }

  initPromise = (async () => {
    if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
      throw new Error("Google Client ID not configured")
    }

    // Load SDK first
    await loadGoogleSDK()

    // Initialize only once
    if (!isGoogleInitialized && window.google) {
      try {
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          callback: globalGoogleCallback,
        })
        isGoogleInitialized = true
        console.log("Google Auth initialized successfully")
      } catch (error) {
        console.error("Error initializing Google Auth:", error)
        throw error
      }
    }
  })()

  return initPromise
}

/**
 * Register a callback and prompt for sign-in
 */
export async function promptGoogleSignIn(callback: (credential: string) => void): Promise<void> {
  await initializeGoogleAuth()

  if (!window.google || !isGoogleInitialized) {
    throw new Error("Google Sign-In not ready")
  }

  // Set the active callback
  activeCallback = callback

  try {
    window.google.accounts.id.prompt()
  } catch (error) {
    activeCallback = null
    throw error
  }
}

/**
 * Check if Google Auth is ready
 */
export function isGoogleAuthReady(): boolean {
  return isGoogleLoaded && isGoogleInitialized && !!window.google
}

// Type declarations
declare global {
  interface Window {
    google: any
  }
}
