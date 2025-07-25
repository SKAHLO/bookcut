"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, DollarSign, Edit } from "lucide-react"
import { useRouter } from "next/navigation"

interface Service {
  name: string
  price: number
  duration: number
}

export default function BarberServices() {
  const { user } = useAuth()
  const router = useRouter()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.userType !== "barber") {
      router.push("/")
    } else {
      loadServices()
    }
  }, [user, router])

  const loadServices = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/barbers/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.barber && data.barber.services) {
          setServices(data.barber.services)
        }
      }
    } catch (error) {
      console.error('Error loading services:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#FF6B35] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading services...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="gradient-bg text-white p-6">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">My Services</h1>
            <p className="opacity-90">View and manage your service offerings</p>
          </div>
          <div className="flex gap-4">
            <Button
              onClick={() => router.push("/barber/settings")}
              variant="outline"
              className="text-white border-white hover:bg-white hover:text-[#FF6B35]"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Services
            </Button>
            <Button
              onClick={() => router.push("/barber/dashboard")}
              variant="outline"
              className="text-white border-white hover:bg-white hover:text-[#FF6B35]"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {services.length === 0 ? (
          <Card className="card-gradient text-center py-12">
            <CardContent>
              <DollarSign className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-[#2C3E50] mb-2">No services added yet</h3>
              <p className="text-gray-600 mb-6">Add services to your profile to start receiving bookings</p>
              <Button 
                onClick={() => router.push("/barber/settings")} 
                className="btn-primary"
              >
                Add Services
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <Card key={index} className="card-gradient hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-xl text-[#2C3E50] flex items-center justify-between">
                    {service.name}
                    <Badge className="bg-[#FF6B35] text-white">${service.price}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-gray-600">
                      <DollarSign className="w-4 h-4" />
                      <span className="font-medium">${service.price}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{service.duration} minutes</span>
                    </div>
                    <div className="pt-2">
                      <div className="text-sm text-gray-500">
                        Rate: ${(service.price / (service.duration / 60)).toFixed(2)}/hour
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {services.length > 0 && (
          <div className="mt-8 text-center">
            <Button 
              onClick={() => router.push("/barber/settings")} 
              className="btn-primary"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Services
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
