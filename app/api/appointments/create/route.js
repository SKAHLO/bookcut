import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret")
    const userId = decoded.userId

    const { barberId, service, price, appointmentDate, notes } = await request.json()

    // Validate required fields
    if (!barberId || !service || !price || !appointmentDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate appointment date is in the future
    const appointmentDateTime = new Date(appointmentDate)
    const now = new Date()
    
    if (appointmentDateTime <= now) {
      return NextResponse.json({ error: "Appointment date must be in the future" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("bookcut")

    // Verify barber exists
    const barber = await db.collection("barbers").findOne({ 
      _id: new ObjectId(barberId) 
    })

    if (!barber) {
      return NextResponse.json({ error: "Barber not found" }, { status: 404 })
    }

    // Check if the time slot is already booked
    const existingAppointment = await db.collection("appointments").findOne({
      barberId: new ObjectId(barberId),
      appointmentDate: appointmentDateTime,
      status: { $nin: ["cancelled"] }
    })

    if (existingAppointment) {
      return NextResponse.json({ error: "This time slot is already booked" }, { status: 409 })
    }

    // Create the appointment
    const appointment = {
      userId: new ObjectId(userId),
      barberId: new ObjectId(barberId),
      service,
      price: parseFloat(price),
      appointmentDate: appointmentDateTime,
      notes: notes || "",
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection("appointments").insertOne(appointment)

    return NextResponse.json({
      message: "Appointment created successfully",
      appointmentId: result.insertedId,
      appointment: {
        ...appointment,
        _id: result.insertedId
      }
    })
  } catch (error) {
    console.error("Error creating appointment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
