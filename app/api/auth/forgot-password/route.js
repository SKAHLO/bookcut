import { NextResponse } from "next/server"
import crypto from "crypto"
import clientPromise from "@/lib/mongodb"

export async function POST(request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("bookcut")

    // Find user
    const user = await db.collection("users").findOne({ email })
    if (!user) {
      // Return success even if user doesn't exist for security
      return NextResponse.json({ message: "If an account with that email exists, we've sent a password reset link." })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour from now

    // Save reset token to user document
    await db.collection("users").updateOne(
      { email },
      {
        $set: {
          resetToken,
          resetTokenExpiry
        }
      }
    )

    // In a real app, you would send an email here
    // For now, we'll just return the token (remove this in production)
    console.log(`Password reset token for ${email}: ${resetToken}`)

    return NextResponse.json({ 
      message: "If an account with that email exists, we've sent a password reset link.",
      // Remove this in production - only for testing
      resetToken 
    })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
