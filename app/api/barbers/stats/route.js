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

    // Get date ranges
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
    
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    // Get today's appointments count
    const todayAppointments = await db.collection("appointments").countDocuments({
      barberId: barber._id,
      appointmentDate: {
        $gte: startOfDay,
        $lt: endOfDay
      },
      status: { $ne: "cancelled" }
    })

    // Get weekly revenue
    const weeklyRevenueResult = await db.collection("appointments").aggregate([
      {
        $match: {
          barberId: barber._id,
          appointmentDate: { $gte: startOfWeek },
          status: "completed"
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$price" }
        }
      }
    ]).toArray()

    const weeklyRevenue = weeklyRevenueResult.length > 0 ? weeklyRevenueResult[0].totalRevenue : 0

    // Get total unique customers
    const totalCustomersResult = await db.collection("appointments").aggregate([
      {
        $match: {
          barberId: barber._id
        }
      },
      {
        $group: {
          _id: "$userId"
        }
      },
      {
        $count: "totalCustomers"
      }
    ]).toArray()

    const totalCustomers = totalCustomersResult.length > 0 ? totalCustomersResult[0].totalCustomers : 0

    // Get rating from barber profile
    const rating = barber.rating || 0

    const stats = {
      todayAppointments,
      weeklyRevenue,
      totalCustomers,
      rating: parseFloat(rating.toFixed(1))
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error("Error fetching barber stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
