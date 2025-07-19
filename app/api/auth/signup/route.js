import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import clientPromise from "@/lib/mongodb"

export async function POST(request) {
  try {
    const { email, password, name, phone, userType, location } = await request.json()

    const client = await clientPromise
    const db = client.db("bookcut")

    // Check if user already exists
    const existingUser = await db.collection("users").findOne({ email })
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = {
      email,
      password: hashedPassword,
      name,
      phone,
      userType,
      location,
      createdAt: new Date(),
    }

    const result = await db.collection("users").insertOne(user)

    // If barber, create barber profile
    if (userType === "barber") {
      const barberProfile = {
        userId: result.insertedId,
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

      await db.collection("barbers").insertOne(barberProfile)
    }

    return NextResponse.json({
      message: "User created successfully",
      userId: result.insertedId,
      userType,
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
