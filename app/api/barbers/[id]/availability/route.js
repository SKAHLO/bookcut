import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request, { params }) {
  try {
    const { id: barberId } = await params
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    if (!date) {
      return NextResponse.json({ error: "Date parameter is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("bookcut")

    // Get the date range for the selected day
    const selectedDate = new Date(date)
    const startOfDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate())
    const endOfDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() + 1)

    // Get all appointments for this barber on this date
    const appointments = await db.collection("appointments").find({
      barberId: new ObjectId(barberId),
      appointmentDate: {
        $gte: startOfDay,
        $lt: endOfDay
      },
      status: { $nin: ["cancelled"] }
    }).toArray()

    // Extract booked time slots
    const bookedSlots = appointments.map(appointment => {
      const appointmentTime = new Date(appointment.appointmentDate)
      return appointmentTime.toTimeString().slice(0, 5) // Get HH:MM format
    })

    return NextResponse.json({ 
      date,
      bookedSlots,
      totalAppointments: appointments.length
    })
  } catch (error) {
    console.error("Error checking availability:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
