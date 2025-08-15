"use client"

/**
 * Centralized Google Authentication utility
 * Prevents multiple initializations and script loading conflicts
 */

let isGoogleLoaded = false
let isGoogleInitialized = false
let loadingPromise: Promise<void> | null = null

// Global callback registry
const callbackRegistry = new Map<string, (credential: string) => void>()
let callbackCounter = 0

// Global Google callback function
function globalGoogleCallback(response: any) {
  console.log("Global Google callback triggered")
  
  // Find and execute the most recent callback
  const callbacks = Array.from(callbackRegistry.entries())
  if (callbacks.length > 0) {
    const [, callback] = callbacks[callbacks.length - 1]
    callback(response.credential)
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
}

/**
 * Register a callback and prompt for sign-in
 */
export async function promptGoogleSignIn(callback: (credential: string) => void): Promise<void> {
  await initializeGoogleAuth()

  if (!window.google || !isGoogleInitialized) {
    throw new Error("Google Sign-In not ready")
  }

  // Register callback
  const callbackId = `callback_${++callbackCounter}`
  callbackRegistry.set(callbackId, callback)

  // Clean up old callbacks (keep only the 3 most recent)
  if (callbackRegistry.size > 3) {
    const oldestKey = callbackRegistry.keys().next().value
    if (oldestKey) {
      callbackRegistry.delete(oldestKey)
    }
  }

  try {
    window.google.accounts.id.prompt()
  } catch (error) {
    callbackRegistry.delete(callbackId)
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
