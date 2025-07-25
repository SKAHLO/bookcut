import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET(request) {
  try {
    const client = await clientPromise
    const db = client.db("bookcut")

    // Get all barbers with their location data
    const barbers = await db.collection("barbers").find({}, {
      projection: {
        businessName: 1,
        location: 1,
        isProfileComplete: 1,
        services: 1
      }
    }).toArray()

    // Get indexes
    const indexes = await db.collection("barbers").indexes()

    return NextResponse.json({ 
      totalBarbers: barbers.length,
      barbersWithLocation: barbers.filter(b => b.location && b.location.coordinates && b.location.coordinates[0] !== 0).length,
      completedProfiles: barbers.filter(b => b.isProfileComplete).length,
      barbersWithServices: barbers.filter(b => b.services && b.services.length > 0).length,
      indexes: indexes.map(idx => ({ name: idx.name, key: idx.key })),
      sampleBarbers: barbers.slice(0, 3).map(b => ({
        businessName: b.businessName,
        location: b.location,
        isProfileComplete: b.isProfileComplete,
        servicesCount: b.services ? b.services.length : 0
      }))
    })
  } catch (error) {
    console.error("Debug error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
