import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import clientPromise from "@/lib/mongodb"

export async function POST(request) {
  try {
    const { email, password, name, phone, userType, location } = await request.json()

    console.log("=== Regular Signup API Called ===")
    console.log("Email:", email, "UserType:", userType)

    // Validate userType
    if (userType !== "user" && userType !== "barber") {
      return NextResponse.json({ 
        error: "Invalid user type. Must be 'user' or 'barber'." 
      }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("bookcut")

    // Check if email already exists in both collections
    const existingUser = await db.collection("users").findOne({ email })
    const existingBarber = await db.collection("barbers").findOne({ email })
    
    if (existingUser || existingBarber) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    let result

    if (userType === "user") {
      console.log("Creating user in users collection")
      
      const newUser = {
        email,
        password: hashedPassword,
        name,
        phone,
        location,
        createdAt: new Date(),
      }

      result = await db.collection("users").insertOne(newUser)
      console.log("User created with ID:", result.insertedId.toString())

    } else {
      console.log("Creating barber in barbers collection")
      
      const newBarber = {
        email,
        password: hashedPassword,
        name,
        phone,
        businessName: "",
        description: "",
        profileImage: "",
        portfolioImages: [],
        location,
        contactInfo: { phone, email },
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

      result = await db.collection("barbers").insertOne(newBarber)
      console.log("Barber created with ID:", result.insertedId.toString())
    }

    return NextResponse.json({
      message: `${userType === "user" ? "User" : "Barber"} created successfully`,
      userId: result.insertedId,
      userType,
    })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
