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

  // Load barber data
  useEffect(() => {
    loadAppointments()
    loadStats()
  }, [])

  const loadAppointments = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/appointments/barber', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setAppointments(data.appointments || [])
      }
    } catch (error) {
      console.error('Error loading appointments:', error)
    }
  }

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/barbers/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data.stats || {
          todayAppointments: 0,
          weeklyRevenue: 0,
          totalCustomers: 0,
          rating: 0,
        })
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

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
      <div className="gradient-bg text-white p-4 sm:p-6">
        <div className="container mx-auto">
          {/* Mobile Layout */}
          <div className="flex flex-col space-y-4 sm:hidden">
            <div className="text-center">
              <h1 className="text-xl font-bold">Barber Dashboard</h1>
              <p className="opacity-90 text-sm">Manage your appointments</p>
            </div>
            <div className="flex flex-col space-y-2">
              <Button
                onClick={() => router.push("/barber/services")}
                variant="outline"
                size="sm"
                className="text-white border-white hover:bg-white hover:text-[#FF6B35]"
              >
                My Services
              </Button>
              <div className="flex space-x-2">
                <Button
                  onClick={() => router.push("/barber/settings")}
                  variant="outline"
                  size="sm"
                  className="flex-1 text-white border-white hover:bg-white hover:text-[#FF6B35]"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
                <Button
                  onClick={logout}
                  variant="outline"
                  size="sm"
                  className="flex-1 text-white border-white hover:bg-white hover:text-[#FF6B35] bg-transparent"
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>
          
          {/* Desktop Layout */}
          <div className="hidden sm:flex justify-between items-center">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold">Barber Dashboard</h1>
              <p className="opacity-90">Manage your appointments and business</p>
            </div>
            <div className="flex gap-2 lg:gap-4">
              <Button
                onClick={() => router.push("/barber/services")}
                variant="outline"
                className="text-white border-white hover:bg-white hover:text-[#FF6B35] text-sm lg:text-base"
              >
                My Services
              </Button>
              <Button
                onClick={() => router.push("/barber/settings")}
                variant="outline"
                className="text-white border-white hover:bg-white hover:text-[#FF6B35] text-sm lg:text-base"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button
                onClick={logout}
                variant="outline"
                className="text-white border-white hover:bg-white hover:text-[#FF6B35] bg-transparent text-sm lg:text-base"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <Card className="card-gradient">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Today&apos;s</p>
                  <p className="text-lg sm:text-3xl font-bold text-[#2C3E50]">{stats.todayAppointments}</p>
                </div>
                <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-[#FF6B35]" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-gradient">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Weekly</p>
                  <p className="text-lg sm:text-3xl font-bold text-[#2C3E50]">₦{stats.weeklyRevenue}</p>
                </div>
                <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-[#4ECDC4]" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-gradient">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Customers</p>
                  <p className="text-lg sm:text-3xl font-bold text-[#2C3E50]">{stats.totalCustomers}</p>
                </div>
                <User className="w-6 h-6 sm:w-8 sm:h-8 text-[#45B7D1]" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-gradient">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Rating</p>
                  <p className="text-lg sm:text-3xl font-bold text-[#2C3E50]">{stats.rating}</p>
                </div>
                <div className="text-yellow-400 text-xl sm:text-2xl">⭐</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Appointments */}
        <Card className="card-gradient mx-2 sm:mx-0">
          <CardHeader className="pb-3 p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-2xl text-[#2C3E50] flex items-center gap-2">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
              Upcoming Appointments
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="space-y-3 sm:space-y-4">
              {appointments.map((appointment) => (
                <div
                  key={appointment._id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer gap-3 sm:gap-4"
                  onClick={() => router.push(`/barber/appointments/${appointment._id}`)}
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#FF6B35] to-[#4ECDC4] rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base">
                      {appointment.customerName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[#2C3E50] text-sm sm:text-base truncate">{appointment.customerName}</h3>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">{appointment.service}</p>
                      <p className="text-xs sm:text-sm text-gray-500 truncate">{appointment.customerPhone}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:flex-col sm:text-right">
                    <p className="font-semibold text-[#2C3E50] text-sm sm:text-base">
                      {new Date(appointment.appointmentDate).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <Badge className={getStatusColor(appointment.status)}>{appointment.status}</Badge>
                  </div>
                </div>
              ))}
              
              {appointments.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm sm:text-base">No appointments scheduled</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
