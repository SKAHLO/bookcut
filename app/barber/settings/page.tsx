"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Plus, X, MapPin } from "lucide-react"
import { useRouter } from "next/navigation"

interface Service {
  name: string
  price: number
  duration: number
}

interface WorkingHours {
  [key: string]: {
    start: string
    end: string
    closed: boolean
  }
}

export default function BarberSettings() {
  const { user } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState({
    businessName: "",
    description: "",
    profileImage: "",
    location: { address: "", coordinates: [0, 0] },
    contactInfo: { phone: "", email: "" },
    services: [] as Service[],
    workingHours: {
      monday: { start: "09:00", end: "18:00", closed: false },
      tuesday: { start: "09:00", end: "18:00", closed: false },
      wednesday: { start: "09:00", end: "18:00", closed: false },
      thursday: { start: "09:00", end: "18:00", closed: false },
      friday: { start: "09:00", end: "18:00", closed: false },
      saturday: { start: "09:00", end: "18:00", closed: false },
      sunday: { start: "09:00", end: "18:00", closed: true },
    } as WorkingHours,
  })
  const [newService, setNewService] = useState({ name: "", price: 0, duration: 30 })
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  useEffect(() => {
    if (user?.userType !== "barber") {
      router.push("/")
    } else {
      loadProfile()
    }
  }, [user, router])

  const loadProfile = async () => {
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
        if (data.barber) {
          setProfile({
            businessName: data.barber.businessName || "",
            description: data.barber.description || "",
            profileImage: data.barber.profileImage || "",
            location: data.barber.location || { address: "", coordinates: [0, 0] },
            contactInfo: data.barber.contactInfo || { phone: "", email: "" },
            services: data.barber.services || [],
            workingHours: data.barber.workingHours || {
              monday: { start: "09:00", end: "18:00", closed: false },
              tuesday: { start: "09:00", end: "18:00", closed: false },
              wednesday: { start: "09:00", end: "18:00", closed: false },
              thursday: { start: "09:00", end: "18:00", closed: false },
              friday: { start: "09:00", end: "18:00", closed: false },
              saturday: { start: "09:00", end: "18:00", closed: false },
              sunday: { start: "09:00", end: "18:00", closed: true },
            },
          })
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setInitialLoading(false)
    }
  }

  const addService = () => {
    if (newService.name && newService.price > 0) {
      setProfile({
        ...profile,
        services: [...profile.services, newService],
      })
      setNewService({ name: "", price: 0, duration: 30 })
    }
  }

  const removeService = (index: number) => {
    setProfile({
      ...profile,
      services: profile.services.filter((_, i) => i !== index),
    })
  }

  const updateWorkingHours = (day: string, field: string, value: string | boolean) => {
    setProfile({
      ...profile,
      workingHours: {
        ...profile.workingHours,
        [day]: {
          ...profile.workingHours[day],
          [field]: value,
        },
      },
    })
  }

  const saveProfile = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert("Please login again")
        return
      }

      // Validate required fields
      if (!profile.businessName || !profile.description || !profile.location.address) {
        alert("Please fill in all required fields (Business Name, Description, Address)")
        setLoading(false)
        return
      }

      const response = await fetch('/api/barbers/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      })

      if (response.ok) {
        alert("Profile saved successfully!")
      } else {
        const errorData = await response.json()
        alert(`Error saving profile: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      alert("Error saving profile")
    } finally {
      setLoading(false)
    }
  }

  const geocodeAddress = async () => {
    if (!profile.location.address.trim()) {
      alert("Please enter an address first")
      return
    }

    try {
      // Use a simple geocoding approach - in production, you'd use Google Geocoding API
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(profile.location.address)}&limit=1`)
      const data = await response.json()
      
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat)
        const lon = parseFloat(data[0].lon)
        
        setProfile({
          ...profile,
          location: {
            ...profile.location,
            coordinates: [lon, lat] // MongoDB expects [longitude, latitude]
          }
        })
        
        alert("Coordinates updated! Please save your profile.")
      } else {
        alert("Could not find coordinates for this address. Please check the address and try again.")
      }
    } catch (error) {
      console.error('Geocoding error:', error)
      alert("Error getting coordinates. Please try again.")
    }
  }

  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#FF6B35] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
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
            <h1 className="text-3xl font-bold">Barber Settings</h1>
            <p className="opacity-90">Complete your profile to start receiving bookings</p>
          </div>
          <Button
            onClick={() => router.push("/barber/dashboard")}
            variant="outline"
            className="text-white border-white hover:bg-white hover:text-[#FF6B35]"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          {/* Basic Information */}
          <Card className="card-gradient">
            <CardHeader>
              <CardTitle className="text-2xl text-[#2C3E50]">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    value={profile.businessName}
                    onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
                    placeholder="e.g., Mike's Barbershop"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={profile.contactInfo.phone}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        contactInfo: { ...profile.contactInfo, phone: e.target.value },
                      })
                    }
                    placeholder="+1 (555) 123-4567"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={profile.description}
                  onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                  placeholder="Tell customers about your experience, specialties, and what makes you unique..."
                  className="mt-1 min-h-[100px]"
                />
              </div>

              <div>
                <Label htmlFor="address">Business Address *</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="address"
                    value={profile.location.address}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        location: { ...profile.location, address: e.target.value },
                      })
                    }
                    placeholder="123 Main St, City, State 12345"
                    className="flex-1"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={geocodeAddress}
                    type="button"
                    title="Get coordinates for this address"
                  >
                    <MapPin className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Services */}
          <Card className="card-gradient">
            <CardHeader>
              <CardTitle className="text-2xl text-[#2C3E50]">Services & Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add New Service */}
              <div className="grid md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <Input
                  placeholder="Service name"
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Price (₦)"
                  value={newService.price || ""}
                  onChange={(e) => setNewService({ ...newService, price: Number(e.target.value) })}
                />
                <Input
                  type="number"
                  placeholder="Duration (min)"
                  value={newService.duration}
                  onChange={(e) => setNewService({ ...newService, duration: Number(e.target.value) })}
                />
                <Button onClick={addService} className="btn-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>

              {/* Services List */}
              <div className="space-y-3">
                {profile.services.map((service, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-white rounded-lg border">
                    <div>
                      <h3 className="font-semibold text-[#2C3E50]">{service.name}</h3>
                      <p className="text-sm text-gray-600">
                        ₦{service.price} • {service.duration} minutes
                      </p>
                    </div>
                    <Button
                      onClick={() => removeService(index)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Working Hours */}
          <Card className="card-gradient">
            <CardHeader>
              <CardTitle className="text-2xl text-[#2C3E50]">Working Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {days.map((day) => (
                  <div key={day} className="flex items-center gap-4 p-4 bg-white rounded-lg border">
                    <div className="w-24 font-medium text-[#2C3E50] capitalize">{day}</div>
                    <Switch
                      checked={!profile.workingHours[day].closed}
                      onCheckedChange={(checked) => updateWorkingHours(day, "closed", !checked)}
                    />
                    {!profile.workingHours[day].closed && (
                      <>
                        <Input
                          type="time"
                          value={profile.workingHours[day].start}
                          onChange={(e) => updateWorkingHours(day, "start", e.target.value)}
                          className="w-32"
                        />
                        <span className="text-gray-500">to</span>
                        <Input
                          type="time"
                          value={profile.workingHours[day].end}
                          onChange={(e) => updateWorkingHours(day, "end", e.target.value)}
                          className="w-32"
                        />
                      </>
                    )}
                    {profile.workingHours[day].closed && <Badge variant="secondary">Closed</Badge>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              onClick={saveProfile} 
              disabled={loading}
              className="btn-primary text-lg px-8 py-3"
            >
              {loading ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
