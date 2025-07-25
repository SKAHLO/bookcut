import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request, { params }) {
  try {
    const { id: barberId } = await params

    const client = await clientPromise
    const db = client.db("bookcut")

    // Get barber details with user information
    const barber = await db
      .collection("barbers")
      .aggregate([
        {
          $match: { _id: new ObjectId(barberId) }
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user"
          }
        },
        {
          $project: {
            businessName: 1,
            description: 1,
            profileImage: 1,
            location: 1,
            contactInfo: 1,
            services: 1,
            workingHours: 1,
            rating: 1,
            reviewCount: 1,
            isProfileComplete: 1,
            "user.name": 1
          }
        }
      ])
      .toArray()

    if (barber.length === 0) {
      return NextResponse.json({ error: "Barber not found" }, { status: 404 })
    }

    const barberData = barber[0]

    // Format the response
    const formattedBarber = {
      _id: barberData._id,
      businessName: barberData.businessName || "Unknown Business",
      description: barberData.description || "No description available",
      profileImage: barberData.profileImage || "",
      location: {
        address: barberData.location?.address || "Address not available",
        coordinates: barberData.location?.coordinates || [0, 0]
      },
      contactInfo: {
        phone: barberData.contactInfo?.phone || "Phone not available",
        email: barberData.contactInfo?.email || "Email not available"
      },
      services: barberData.services || [],
      workingHours: barberData.workingHours || {
        monday: { start: "09:00", end: "18:00", closed: false },
        tuesday: { start: "09:00", end: "18:00", closed: false },
        wednesday: { start: "09:00", end: "18:00", closed: false },
        thursday: { start: "09:00", end: "18:00", closed: false },
        friday: { start: "09:00", end: "18:00", closed: false },
        saturday: { start: "09:00", end: "18:00", closed: false },
        sunday: { start: "09:00", end: "18:00", closed: true }
      },
      rating: barberData.rating || 0,
      reviewCount: barberData.reviewCount || 0,
      barberName: barberData.user?.[0]?.name || "Unknown"
    }

    return NextResponse.json({ barber: formattedBarber })
  } catch (error) {
    console.error("Error fetching barber details:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
