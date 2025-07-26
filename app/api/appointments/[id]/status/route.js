import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function PUT(request, { params }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret")
    const userId = decoded.userId
    const { id: appointmentId } = await params

    const { status } = await request.json()

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled']
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("bookcut")

    // Get the appointment
    const appointment = await db.collection("appointments").findOne({
      _id: new ObjectId(appointmentId)
    })

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    // Check if user is the barber for this appointment OR the customer cancelling their own appointment
    const barber = await db.collection("barbers").findOne({
      _id: appointment.barberId
    })

    const isBarber = barber && barber.userId.toString() === userId
    const isCustomer = appointment.userId.toString() === userId
    const isCustomerCancelling = isCustomer && status === 'cancelled'

    if (!isBarber && !isCustomerCancelling) {
      return NextResponse.json({ 
        error: "Access denied. Only the barber can update appointment status, or customers can cancel their own appointments." 
      }, { status: 403 })
    }

    // Validate status transitions
    const currentStatus = appointment.status
    let isValidTransition = false

    if (isCustomerCancelling) {
      // Customers can cancel from pending or confirmed states
      isValidTransition = ['pending', 'confirmed'].includes(currentStatus)
    } else {
      // Barber status transitions
      switch (currentStatus) {
        case 'pending':
          isValidTransition = ['confirmed', 'cancelled'].includes(status)
          break
        case 'confirmed':
          isValidTransition = ['completed', 'cancelled'].includes(status)
          break
        case 'completed':
        case 'cancelled':
          isValidTransition = false // Final states
          break
        default:
          isValidTransition = false
      }
    }

    if (!isValidTransition) {
      return NextResponse.json({ 
        error: `Cannot change status from ${currentStatus} to ${status}` 
      }, { status: 400 })
    }

    // Update the appointment status
    const result = await db.collection("appointments").updateOne(
      { _id: new ObjectId(appointmentId) },
      { 
        $set: { 
          status,
          updatedAt: new Date()
        }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    return NextResponse.json({ 
      message: "Appointment status updated successfully",
      newStatus: status,
      previousStatus: currentStatus
    })
  } catch (error) {
    console.error("Error updating appointment status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
