import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// Get user profile
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

    const user = await db.collection("users").findOne({ 
      _id: new ObjectId(userId) 
    }, {
      projection: { password: 0 } // Exclude password from response
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Update user profile
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

    // Prepare the update data (exclude email and password changes)
    const updateData = {
      name: profileData.name,
      phone: profileData.phone || "",
      location: {
        address: profileData.location.address || "",
        coordinates: profileData.location.coordinates || [0, 0]
      },
      updatedAt: new Date()
    }

    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ 
      message: "Profile updated successfully",
      modifiedCount: result.modifiedCount 
    })
  } catch (error) {
    console.error("Error updating user profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
