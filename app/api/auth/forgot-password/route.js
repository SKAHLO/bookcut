import { NextResponse } from "next/server"
import crypto from "crypto"
import bcrypt from "bcryptjs"
import clientPromise from "@/lib/mongodb"
import { sendPasswordResetEmail } from "@/lib/email-resend"

export async function POST(request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("bookcut")

    // Find user in both collections
    let user = await db.collection("users").findOne({ email })
    let collection = "users"
    
    if (!user) {
      user = await db.collection("barbers").findOne({ email })
      collection = "barbers"
    }
    
    if (!user) {
      // Return success even if user doesn't exist for security
      return NextResponse.json({ message: "If an account with that email exists, we've sent a password reset link." })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour from now

    // Save reset token to user document
    await db.collection(collection).updateOne(
      { email },
      {
        $set: {
          resetToken,
          resetTokenExpiry
        }
      }
    )

    // Send password reset email
    const emailResult = await sendPasswordResetEmail(email, resetToken)
    
    if (emailResult.success) {
      console.log(`Password reset email sent to ${email}`)
    } else {
      console.error(`Failed to send email to ${email}:`, emailResult.error)
      // Still return success for security, but log the error
    }

    return NextResponse.json({ 
      message: "If an account with that email exists, we've sent a password reset link."
    })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
