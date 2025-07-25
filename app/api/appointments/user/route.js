import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

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

    // Get user appointments with barber details
    const appointments = await db
      .collection("appointments")
      .aggregate([
        {
          $match: { userId: new ObjectId(userId) }
        },
        {
          $lookup: {
            from: "barbers",
            localField: "barberId",
            foreignField: "_id",
            as: "barber"
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "barber.userId",
            foreignField: "_id",
            as: "barberUser"
          }
        },
        {
          $project: {
            appointmentDate: 1,
            status: 1,
            service: 1,
            price: 1,
            barberId: 1,
            "barber.businessName": 1,
            "barber.location": 1,
            "barber.contactInfo": 1,
            "barberUser.name": 1
          }
        },
        {
          $sort: { appointmentDate: -1 }
        }
      ])
      .toArray()

    // Format the response
    const formattedAppointments = appointments.map(appointment => ({
      _id: appointment._id,
      barberId: appointment.barberId,
      barberName: appointment.barberUser?.[0]?.name || "Unknown",
      businessName: appointment.barber?.[0]?.businessName || "Unknown Business",
      service: appointment.service,
      appointmentDate: appointment.appointmentDate,
      status: appointment.status,
      location: appointment.barber?.[0]?.location?.address || "Address not available",
      phone: appointment.barber?.[0]?.contactInfo?.phone || "Phone not available",
      price: appointment.price
    }))

    return NextResponse.json({ appointments: formattedAppointments })
  } catch (error) {
    console.error("Error fetching user appointments:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
