import { NextResponse } from "next/server"
import { OAuth2Client } from "google-auth-library"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import clientPromise from "@/lib/mongodb"

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

export async function POST(request) {
  try {
    const { credential, userType } = await request.json()

    console.log("=== Google Auth API Called ===")
    console.log("Received userType:", userType)
    console.log("Has credential:", !!credential)

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

    // Check both collections for existing users (for sign-in without userType)
    if (!userType) {
      console.log("No userType provided, checking both collections for existing user")
      
      // Check users collection first
      let existingUser = await db.collection("users").findOne({ 
        $or: [{ email }, { googleId }] 
      })
      
      if (existingUser) {
        console.log("Found existing user in users collection")
        // Update Google ID if needed
        if (!existingUser.googleId) {
          await db.collection("users").updateOne(
            { _id: existingUser._id },
            { $set: { googleId, profileImage: picture || existingUser.profileImage || "" } }
          )
        }
        
        const token = jwt.sign(
          { userId: existingUser._id.toString(), userType: "user" },
          process.env.JWT_SECRET || "fallback-secret",
          { expiresIn: "7d" },
        )

        return NextResponse.json({
          token,
          user: {
            id: existingUser._id.toString(),
            email: existingUser.email,
            name: existingUser.name,
            userType: "user",
          },
        })
      }

      // Check barbers collection
      let existingBarber = await db.collection("barbers").findOne({ 
        $or: [{ email }, { googleId }] 
      })
      
      if (existingBarber) {
        console.log("Found existing barber in barbers collection")
        // Update Google ID if needed
        if (!existingBarber.googleId) {
          await db.collection("barbers").updateOne(
            { _id: existingBarber._id },
            { $set: { googleId, profileImage: picture || existingBarber.profileImage || "" } }
          )
        }
        
        const token = jwt.sign(
          { userId: existingBarber._id.toString(), userType: "barber" },
          process.env.JWT_SECRET || "fallback-secret",
          { expiresIn: "7d" },
        )

        return NextResponse.json({
          token,
          user: {
            id: existingBarber._id.toString(),
            email: existingBarber.email,
            name: existingBarber.name,
            userType: "barber",
          },
        })
      }

      // User not found in either collection
      return NextResponse.json({ 
        error: "User not found. Please sign up first." 
      }, { status: 404 })
    }

    // Validate userType - must be exactly "user" or "barber"
    if (userType !== "user" && userType !== "barber") {
      console.log("Invalid userType received:", userType)
      return NextResponse.json({ 
        error: "Invalid user type. Must be 'user' or 'barber'." 
      }, { status: 400 })
    }

    console.log("Creating new account with userType:", userType)

    // Check if email already exists in the appropriate collection
    let existingAccount
    if (userType === "user") {
      existingAccount = await db.collection("users").findOne({ 
        $or: [{ email }, { googleId }] 
      })
    } else {
      existingAccount = await db.collection("barbers").findOne({ 
        $or: [{ email }, { googleId }] 
      })
    }

    if (existingAccount) {
      return NextResponse.json({ 
        error: "Account already exists with this email." 
      }, { status: 400 })
    }

    let result, responseData

    if (userType === "user") {
      console.log("Creating new user in users collection")
      
      const newUser = {
        email,
        name,
        phone: "",
        googleId,
        profileImage: picture || "",
        location: { address: "", coordinates: [0, 0] },
        createdAt: new Date(),
        password: await bcrypt.hash(googleId, 12),
      }

      result = await db.collection("users").insertOne(newUser)
      console.log("User created with ID:", result.insertedId.toString())

      const token = jwt.sign(
        { userId: result.insertedId.toString(), userType: "user" },
        process.env.JWT_SECRET || "fallback-secret",
        { expiresIn: "7d" },
      )

      responseData = {
        token,
        user: {
          id: result.insertedId.toString(),
          email,
          name,
          userType: "user",
        },
      }

    } else {
      console.log("Creating new barber in barbers collection")
      
      const newBarber = {
        email,
        name,
        phone: "",
        googleId,
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
        password: await bcrypt.hash(googleId, 12),
      }

      result = await db.collection("barbers").insertOne(newBarber)
      console.log("Barber created with ID:", result.insertedId.toString())

      const token = jwt.sign(
        { userId: result.insertedId.toString(), userType: "barber" },
        process.env.JWT_SECRET || "fallback-secret",
        { expiresIn: "7d" },
      )

      responseData = {
        token,
        user: {
          id: result.insertedId.toString(),
          email,
          name,
          userType: "barber",
        },
      }
    }

    console.log("Final response user data:", responseData.user)
    console.log("=== Google Auth API Complete ===")

    return NextResponse.json(responseData)
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
