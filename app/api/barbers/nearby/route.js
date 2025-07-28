import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function POST(request) {
  try {
    const { coordinates, radius = 10, searchQuery } = await request.json() // radius in km

    console.log("Search parameters:", { coordinates, radius, searchQuery })

    const client = await clientPromise
    const db = client.db("bookcut")

    let barbers = []
    let searchInfo = {}

    // If there's a search query (address search), perform text-based search
    if (searchQuery && searchQuery.trim()) {
      console.log("Performing address-based search for:", searchQuery)
      
      const totalBarbers = await db.collection("barbers").countDocuments({ 
        isProfileComplete: true 
      })
      
      barbers = await db
        .collection("barbers")
        .aggregate([
          {
            $match: {
              isProfileComplete: true,
              $or: [
                { "location.address": { $regex: searchQuery.trim(), $options: "i" } },
                { businessName: { $regex: searchQuery.trim(), $options: "i" } },
                { description: { $regex: searchQuery.trim(), $options: "i" } }
              ]
            }
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
            $addFields: {
              distance: null // No distance calculation for address search
            }
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

      searchInfo = {
        searchType: "address",
        searchQuery,
        totalBarbers,
        found: barbers.length
      }
      
      console.log("Found", barbers.length, "barbers matching address search")
    } 
    // Otherwise, perform location-based search (existing functionality)
    else if (coordinates) {
      console.log("Performing location-based search near:", coordinates, "within", radius, "km")
      
      const totalBarbers = await db.collection("barbers").countDocuments({ 
        "location.coordinates": { $exists: true, $ne: [0, 0] },
        isProfileComplete: true 
      })
      
      barbers = await db
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

      searchInfo = {
        searchType: "location",
        coordinates,
        radius,
        totalBarbers,
        found: barbers.length
      }
      
      console.log("Found", barbers.length, "nearby barbers")
    } else {
      return NextResponse.json({ 
        error: "Either coordinates or search query must be provided" 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      barbers,
      searchInfo
    })
  } catch (error) {
    console.error("Barber search error:", error)
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error.message 
    }, { status: 500 })
  }
}
