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

    // Find the barber profile
    const barber = await db.collection("barbers").findOne({ 
      userId: new ObjectId(userId) 
    })

    if (!barber) {
      return NextResponse.json({ error: "Barber profile not found" }, { status: 404 })
    }

    // Get today's date range
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

    // Get barber appointments with customer details
    const appointments = await db
      .collection("appointments")
      .aggregate([
        {
          $match: { 
            barberId: barber._id,
            appointmentDate: {
              $gte: startOfDay,
              $lt: endOfDay
            }
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "customer"
          }
        },
        {
          $project: {
            appointmentDate: 1,
            status: 1,
            service: 1,
            price: 1,
            userId: 1,
            "customer.name": 1,
            "customer.phone": 1
          }
        },
        {
          $sort: { appointmentDate: 1 }
        }
      ])
      .toArray()

    // Format the response
    const formattedAppointments = appointments.map(appointment => ({
      _id: appointment._id,
      userId: appointment.userId,
      appointmentDate: appointment.appointmentDate,
      status: appointment.status,
      service: appointment.service,
      customerName: appointment.customer?.[0]?.name || "Unknown Customer",
      customerPhone: appointment.customer?.[0]?.phone || "Phone not available"
    }))

    return NextResponse.json({ appointments: formattedAppointments })
  } catch (error) {
    console.error("Error fetching barber appointments:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
