import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function POST(request) {
  try {
    const { coordinates, radius = 10 } = await request.json() // radius in km

    console.log("Searching for barbers near:", coordinates, "within", radius, "km")

    const client = await clientPromise
    const db = client.db("bookcut")

    // Check if there are any barbers with location data
    const totalBarbers = await db.collection("barbers").countDocuments({ 
      "location.coordinates": { $exists: true, $ne: [0, 0] },
      isProfileComplete: true 
    })
    console.log("Total barbers with valid coordinates:", totalBarbers)

    // Find nearby barbers using MongoDB geospatial query
    const barbers = await db
      .collection("barbers")
      .aggregate([
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: coordinates, // [longitude, latitude]
            },
            distanceField: "distance",
            maxDistance: radius * 1000, // convert km to meters
            spherical: true,
            query: {
              isProfileComplete: true,
              "location.coordinates": { $exists: true, $ne: [0, 0] }
            }
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $project: {
            businessName: 1,
            description: 1,
            profileImage: 1,
            location: 1,
            services: 1,
            rating: 1,
            reviewCount: 1,
            distance: 1,
            "user.name": 1,
          },
        },
      ])
      .toArray()

    console.log("Found", barbers.length, "nearby barbers")

    return NextResponse.json({ 
      barbers,
      searchInfo: {
        coordinates,
        radius,
        totalBarbers,
        found: barbers.length
      }
    })
  } catch (error) {
    console.error("Nearby barbers search error:", error)
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error.message 
    }, { status: 500 })
  }
}
