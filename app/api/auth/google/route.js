import { NextResponse } from "next/server"
import { OAuth2Client } from "google-auth-library"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import clientPromise from "@/lib/mongodb"

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

export async function POST(request) {
  try {
    const { credential, userType } = await request.json()

    if (!credential) {
      return NextResponse.json({ error: "No credential provided" }, { status: 400 })
    }

    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()
    const { email, name, picture, sub: googleId } = payload

    if (!email || !name) {
      return NextResponse.json({ error: "Invalid Google token" }, { status: 400 })
    }

    const mongoClient = await clientPromise
    const db = mongoClient.db("bookcut")

    // First check if user already exists by email (for sign-in)
    let user = await db.collection("users").findOne({ email })
    
    if (user) {
      // User exists by email, update with Google ID if needed and sign them in
      if (!user.googleId) {
        await db.collection("users").updateOne(
          { _id: user._id },
          { $set: { googleId, profileImage: picture || user.profileImage || "" } }
        )
      }
      
      const token = jwt.sign(
        { userId: user._id.toString(), userType: user.userType },
        process.env.JWT_SECRET || "fallback-secret",
        { expiresIn: "7d" },
      )

      return NextResponse.json({
        token,
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          userType: user.userType,
        },
      })
    }

    // Check if user exists by Google ID only (shouldn't happen but just in case)
    user = await db.collection("users").findOne({ googleId })
    if (user) {
      const token = jwt.sign(
        { userId: user._id.toString(), userType: user.userType },
        process.env.JWT_SECRET || "fallback-secret",
        { expiresIn: "7d" },
      )

      return NextResponse.json({
        token,
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          userType: user.userType,
        },
      })
    }

    // User doesn't exist, check if userType is provided for new registration
    if (!userType) {
      return NextResponse.json({ 
        error: "User not found. Please sign up first or specify user type." 
      }, { status: 404 })
    }

    // Create new user only if userType is specified
    {
      // Create new user
      const newUser = {
        email,
        name,
        phone: "", // Will be filled later if needed
        userType: userType || "user",
        googleId,
        profileImage: picture || "",
        location: { address: "", coordinates: [0, 0] },
        createdAt: new Date(),
        password: await bcrypt.hash(googleId, 12), // Use googleId as password hash
      }

      const result = await db.collection("users").insertOne(newUser)

      // If barber, create barber profile
      if (userType === "barber") {
        const barberProfile = {
          userId: result.insertedId,
          businessName: "",
          description: "",
          profileImage: picture || "",
          portfolioImages: [],
          location: { address: "", coordinates: [0, 0] },
          contactInfo: { phone: "", email },
          services: [],
          workingHours: {
            monday: { start: "09:00", end: "18:00", closed: false },
            tuesday: { start: "09:00", end: "18:00", closed: false },
            wednesday: { start: "09:00", end: "18:00", closed: false },
            thursday: { start: "09:00", end: "18:00", closed: false },
            friday: { start: "09:00", end: "18:00", closed: false },
            saturday: { start: "09:00", end: "18:00", closed: false },
            sunday: { start: "09:00", end: "18:00", closed: true },
          },
          rating: 0,
          reviewCount: 0,
          isProfileComplete: false,
          createdAt: new Date(),
        }

        await db.collection("barbers").insertOne(barberProfile)
      }

      const token = jwt.sign(
        { userId: result.insertedId.toString(), userType: userType || "user" },
        process.env.JWT_SECRET || "fallback-secret",
        { expiresIn: "7d" },
      )

      return NextResponse.json({
        token,
        user: {
          id: result.insertedId.toString(),
          email,
          name,
          userType: userType || "user",
        },
      })
    }
  } catch (error) {
    console.error("Google sign-in error:", error)
    return NextResponse.json(
      {
        error: "Google sign-in failed",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
