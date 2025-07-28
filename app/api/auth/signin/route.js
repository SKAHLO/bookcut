import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import clientPromise from "@/lib/mongodb"

export async function POST(request) {
  try {
    const { email, password } = await request.json()

    console.log("=== Regular Signin API Called ===")
    console.log("Email:", email)

    const client = await clientPromise
    const db = client.db("bookcut")

    // Check users collection first
    let user = await db.collection("users").findOne({ email })
    let userType = "user"
    
    if (!user) {
      // Check barbers collection
      user = await db.collection("barbers").findOne({ email })
      userType = "barber"
    }

    if (!user) {
      console.log("No user found with email:", email)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 400 })
    }

    console.log("Found user in", userType === "user" ? "users" : "barbers", "collection")

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      console.log("Invalid password for:", email)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 400 })
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, userType: userType }, 
      process.env.JWT_SECRET || "fallback-secret", 
      { expiresIn: "7d" }
    )

    const responseData = {
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        userType: userType,
      },
    }

    console.log("Signin successful for:", email, "as", userType)
    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Signin error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
