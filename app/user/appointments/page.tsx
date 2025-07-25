"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, Phone } from "lucide-react"
import { useRouter } from "next/navigation"

interface Appointment {
  _id: string
  barberId: string
  barberName: string
  businessName: string
  service: string
  appointmentDate: string
  status: string
  location: string
  phone: string
  price: number
}

export default function UserAppointments() {
  const { user } = useAuth()
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])

  useEffect(() => {
    if (user?.userType !== "user") {
      router.push("/")
    }
  }, [user, router])

  // Load user appointments
  useEffect(() => {
    loadAppointments()
  }, [])

  const loadAppointments = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/appointments/user', {
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

  const cancelAppointment = (appointmentId: string) => {
    // API call to cancel appointment would go here
    setAppointments(appointments.map((apt) => (apt._id === appointmentId ? { ...apt, status: "cancelled" } : apt)))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="gradient-bg text-white p-6">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">My Appointments</h1>
            <p className="opacity-90">Manage your upcoming and past appointments</p>
          </div>
          <Button
            onClick={() => router.push("/user/dashboard")}
            variant="outline"
            className="text-white border-white hover:bg-white hover:text-[#FF6B35]"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {appointments.length === 0 ? (
          <Card className="card-gradient text-center py-12">
            <CardContent>
              <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-[#2C3E50] mb-2">No appointments yet</h3>
              <p className="text-gray-600 mb-6">Book your first appointment with a barber in your area</p>
              <Button onClick={() => router.push("/user/dashboard")} className="btn-primary">
                Find Barbers
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {appointments.map((appointment) => (
              <Card 
                key={appointment._id} 
                className="card-gradient hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/user/appointments/${appointment._id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-[#FF6B35] to-[#4ECDC4] rounded-full flex items-center justify-center text-white text-xl font-bold">
                        {appointment.barberName.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-[#2C3E50] mb-1">{appointment.businessName}</h3>
                        <p className="text-gray-600 mb-2">with {appointment.barberName}</p>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {new Date(appointment.appointmentDate).toLocaleDateString()} at{" "}
                              {new Date(appointment.appointmentDate).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span>{appointment.service}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span>{appointment.location}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="w-4 h-4" />
                            <span>{appointment.phone}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold text-[#2C3E50] mb-2">${appointment.price}</div>
                      <Badge className={`mb-3 ${getStatusColor(appointment.status)}`}>{appointment.status}</Badge>

                      <div className="space-y-2">
                        {appointment.status === "pending" || appointment.status === "confirmed" ? (
                          <Button
                            onClick={() => cancelAppointment(appointment._id)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:bg-red-50 w-full"
                          >
                            Cancel
                          </Button>
                        ) : null}

                        {appointment.status === "completed" && (
                          <Button variant="outline" size="sm" className="w-full bg-transparent">
                            Leave Review
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
