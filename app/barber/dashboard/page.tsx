"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, User, Settings, DollarSign } from "lucide-react"
import { useRouter } from "next/navigation"

interface Appointment {
  _id: string
  userId: string
  appointmentDate: string
  status: string
  service: string
  customerName: string
  customerPhone: string
}

export default function BarberDashboard() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [stats, setStats] = useState({
    todayAppointments: 0,
    weeklyRevenue: 0,
    totalCustomers: 0,
    rating: 0,
  })

  useEffect(() => {
    if (user?.userType !== "barber") {
      router.push("/")
    }
  }, [user, router])

  // Mock data for demo
  useEffect(() => {
    setAppointments([
      {
        _id: "1",
        userId: "user1",
        appointmentDate: "2024-01-20T10:00:00Z",
        status: "confirmed",
        service: "Haircut & Beard Trim",
        customerName: "John Doe",
        customerPhone: "+1234567890",
      },
      {
        _id: "2",
        userId: "user2",
        appointmentDate: "2024-01-20T14:00:00Z",
        status: "pending",
        service: "Premium Haircut",
        customerName: "Mike Smith",
        customerPhone: "+1234567891",
      },
    ])

    setStats({
      todayAppointments: 5,
      weeklyRevenue: 850,
      totalCustomers: 127,
      rating: 4.8,
    })
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="gradient-bg text-white p-6">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Barber Dashboard</h1>
            <p className="opacity-90">Manage your appointments and business</p>
          </div>
          <div className="flex gap-4">
            <Button
              onClick={() => router.push("/barber/settings")}
              variant="outline"
              className="text-white border-white hover:bg-white hover:text-[#FF6B35]"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button
              onClick={logout}
              variant="outline"
              className="text-white border-white hover:bg-white hover:text-[#FF6B35] bg-transparent"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="card-gradient">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Today's Appointments</p>
                  <p className="text-3xl font-bold text-[#2C3E50]">{stats.todayAppointments}</p>
                </div>
                <Calendar className="w-8 h-8 text-[#FF6B35]" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-gradient">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Weekly Revenue</p>
                  <p className="text-3xl font-bold text-[#2C3E50]">${stats.weeklyRevenue}</p>
                </div>
                <DollarSign className="w-8 h-8 text-[#4ECDC4]" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-gradient">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Customers</p>
                  <p className="text-3xl font-bold text-[#2C3E50]">{stats.totalCustomers}</p>
                </div>
                <User className="w-8 h-8 text-[#45B7D1]" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-gradient">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Rating</p>
                  <p className="text-3xl font-bold text-[#2C3E50]">{stats.rating}</p>
                </div>
                <div className="text-yellow-400 text-2xl">⭐</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Appointments */}
        <Card className="card-gradient">
          <CardHeader>
            <CardTitle className="text-2xl text-[#2C3E50] flex items-center gap-2">
              <Clock className="w-6 h-6" />
              Today's Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <div
                  key={appointment._id}
                  className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#FF6B35] to-[#4ECDC4] rounded-full flex items-center justify-center text-white font-bold">
                      {appointment.customerName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#2C3E50]">{appointment.customerName}</h3>
                      <p className="text-sm text-gray-600">{appointment.service}</p>
                      <p className="text-sm text-gray-500">{appointment.customerPhone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[#2C3E50]">
                      {new Date(appointment.appointmentDate).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <Badge className={getStatusColor(appointment.status)}>{appointment.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
