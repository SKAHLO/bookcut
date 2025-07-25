import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function POST(request) {
  try {
    const client = await clientPromise
    const db = client.db("bookcut")
    
    // Create geospatial index on barbers collection
    await db.collection("barbers").createIndex({ 
      "location.coordinates": "2dsphere" 
    })
    
    console.log("Created 2dsphere index on barbers.location.coordinates")
    
    return NextResponse.json({ 
      message: "Database setup completed successfully",
      indexes: "Created geospatial index on barbers collection"
    })
  } catch (error) {
    console.error("Database setup error:", error)
    return NextResponse.json({ error: "Database setup failed" }, { status: 500 })
  }
}
