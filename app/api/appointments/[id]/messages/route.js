import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// Get messages for an appointment
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

    // First verify user has access to this appointment
    const appointment = await db.collection("appointments").findOne({
      _id: new ObjectId(appointmentId)
    })

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    // Check if user is either the customer or the barber
    const barber = await db.collection("barbers").findOne({
      _id: appointment.barberId
    })

    const hasAccess = appointment.userId.toString() === userId || 
                     (barber && barber.userId.toString() === userId)

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get messages for this appointment
    const messages = await db
      .collection("appointment_messages")
      .find({ appointmentId: new ObjectId(appointmentId) })
      .sort({ timestamp: 1 })
      .toArray()

    return NextResponse.json({ messages })
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Send a message
export async function POST(request, { params }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret")
    const userId = decoded.userId
    const { id: appointmentId } = await params

    const { message, senderType } = await request.json()

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("bookcut")

    // Verify user has access to this appointment
    const appointment = await db.collection("appointments").findOne({
      _id: new ObjectId(appointmentId)
    })

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    // Check if user is either the customer or the barber
    const barber = await db.collection("barbers").findOne({
      _id: appointment.barberId
    })

    const hasAccess = appointment.userId.toString() === userId || 
                     (barber && barber.userId.toString() === userId)

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get sender name
    let senderName = "Unknown"
    if (senderType === 'user') {
      const user = await db.collection("users").findOne({ _id: new ObjectId(userId) })
      senderName = user?.name || "User"
    } else {
      const barberUser = await db.collection("users").findOne({ _id: barber.userId })
      senderName = barberUser?.name || "Barber"
    }

    // Create message
    const messageData = {
      appointmentId: new ObjectId(appointmentId),
      senderId: new ObjectId(userId),
      senderName,
      senderType,
      message: message.trim(),
      timestamp: new Date()
    }

    const result = await db.collection("appointment_messages").insertOne(messageData)

    return NextResponse.json({ 
      message: "Message sent successfully",
      messageId: result.insertedId 
    })
  } catch (error) {
    console.error("Error sending message:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
