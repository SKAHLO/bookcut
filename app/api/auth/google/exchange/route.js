import { NextResponse } from "next/server"
import { OAuth2Client } from "google-auth-library"

const client = new OAuth2Client(
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/google/callback`
)

export async function POST(request) {
  try {
    const { code, state } = await request.json()

    console.log("=== Google Token Exchange ===")
    console.log("Code received:", !!code)
    console.log("State:", state)

    if (!code) {
      return NextResponse.json({ success: false, error: "No authorization code provided" }, { status: 400 })
    }

    // Extract userType from state if present
    let userType = null
    if (state && state.includes('|')) {
      const [, extractedUserType] = state.split('|')
      userType = extractedUserType
    }

    // Get the origin from the request
    const origin = request.headers.get('origin') || request.headers.get('referer')?.split('/').slice(0, 3).join('/')
    
    // Exchange authorization code for tokens
    const { tokens } = await client.getToken({
      code,
      redirect_uri: `${origin}/api/auth/google/callback`
    })

    console.log("Tokens received:", !!tokens.id_token)

    if (!tokens.id_token) {
      return NextResponse.json({ success: false, error: "No ID token received" }, { status: 400 })
    }

    // Return the credential (JWT token) that your existing API expects
    return NextResponse.json({
      success: true,
      credential: tokens.id_token,
      userType: userType
    })

  } catch (error) {
    console.error("Token exchange error:", error)
    return NextResponse.json({
      success: false,
      error: "Token exchange failed: " + error.message
    }, { status: 500 })
  }
}
