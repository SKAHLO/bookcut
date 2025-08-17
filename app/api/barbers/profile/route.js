import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// Get barber profile
export async function GET(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret")
    const userId = decoded.userId

    const client = await clientPromise
    const db = client.db("bookcut")

    const barber = await db.collection("barbers").findOne({ 
      _id: new ObjectId(userId) 
    })

    if (!barber) {
      return NextResponse.json({ error: "Barber profile not found" }, { status: 404 })
    }

    return NextResponse.json({ barber })
  } catch (error) {
    console.error("Error fetching barber profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Update barber profile
export async function PUT(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret")
    const userId = decoded.userId

    const profileData = await request.json()

    const client = await clientPromise
    const db = client.db("bookcut")

    // Prepare the update data
    const updateData = {
      businessName: profileData.businessName,
      description: profileData.description,
      profileImage: profileData.profileImage || "",
      location: {
        address: profileData.location.address,
        coordinates: profileData.location.coordinates
      },
      contactInfo: profileData.contactInfo,
      services: profileData.services,
      workingHours: profileData.workingHours,
      isProfileComplete: true,
      updatedAt: new Date()
    }

    const result = await db.collection("barbers").updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Barber profile not found" }, { status: 404 })
    }

    return NextResponse.json({ 
      message: "Profile updated successfully",
      modifiedCount: result.modifiedCount 
    })
  } catch (error) {
    console.error("Error updating barber profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
