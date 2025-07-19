import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function POST(request) {
  try {
    const { coordinates, radius = 10 } = await request.json() // radius in km

    const client = await clientPromise
    const db = client.db("bookcut")

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
          $match: {
            isProfileComplete: true,
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

    return NextResponse.json({ barbers })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
