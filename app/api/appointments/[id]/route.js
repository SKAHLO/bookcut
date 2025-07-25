import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request, { params }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret")
    const userId = decoded.userId
    const { id: appointmentId } = await params

    const client = await clientPromise
    const db = client.db("bookcut")

    // First, get the appointment to check access
    const appointment = await db.collection("appointments").findOne({
      _id: new ObjectId(appointmentId)
    })

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    // Check if user has access (either as customer or as barber)
    let hasAccess = false
    
    // Check if user is the customer
    if (appointment.userId.toString() === userId) {
      hasAccess = true
    } else {
      // Check if user is the barber
      const barber = await db.collection("barbers").findOne({
        _id: appointment.barberId
      })
      
      if (barber && barber.userId.toString() === userId) {
        hasAccess = true
      }
    }

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get appointment with all details
    const appointmentWithDetails = await db
      .collection("appointments")
      .aggregate([
        {
          $match: { _id: new ObjectId(appointmentId) }
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
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "customer"
          }
        }
      ])
      .toArray()

    if (appointmentWithDetails.length === 0) {
      return NextResponse.json({ error: "Appointment details not found" }, { status: 404 })
    }

    const appointmentData = appointmentWithDetails[0]

    // Format the response
    const formattedAppointment = {
      _id: appointmentData._id,
      barberId: appointmentData.barberId,
      userId: appointmentData.userId,
      barberName: appointmentData.barberUser?.[0]?.name || "Unknown",
      customerName: appointmentData.customer?.[0]?.name || "Unknown",
      businessName: appointmentData.barber?.[0]?.businessName || "Unknown Business",
      service: appointmentData.service,
      appointmentDate: appointmentData.appointmentDate,
      status: appointmentData.status,
      location: appointmentData.barber?.[0]?.location?.address || "Address not available",
      phone: appointmentData.barber?.[0]?.contactInfo?.phone || "Phone not available",
      price: appointmentData.price
    }

    return NextResponse.json({ appointment: formattedAppointment })
  } catch (error) {
    console.error("Error fetching appointment details:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
