import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET(request) {
  try {
    const client = await clientPromise
    const db = client.db("bookcut")

    // Get all users with their basic data
    const users = await db.collection("users").find({}, {
      projection: {
        email: 1,
        name: 1,
        userType: 1,
        googleId: 1,
        createdAt: 1
      }
    }).toArray()

    // Group by user type
    const usersByType = users.reduce((acc, user) => {
      const type = user.userType || 'undefined'
      if (!acc[type]) acc[type] = []
      acc[type].push(user)
      return acc
    }, {})

    return NextResponse.json({ 
      totalUsers: users.length,
      usersByType: Object.keys(usersByType).map(type => ({
        type,
        count: usersByType[type].length,
        users: usersByType[type].slice(0, 3) // Sample of first 3 users
      })),
      allUsers: users // For debugging
    })
  } catch (error) {
    console.error("Debug error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
