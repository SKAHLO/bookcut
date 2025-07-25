"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MapPin, Star, Search, Navigation } from "lucide-react"
import { useRouter } from "next/navigation"

interface Barber {
  _id: string
  businessName: string
  description: string
  profileImage: string
  location: {
    address: string
  }
  services: Array<{
    name: string
    price: number
    duration: number
  }>
  rating: number
  reviewCount: number
  distance: number
}

export default function UserDashboard() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [searchLocation, setSearchLocation] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user?.userType !== "user") {
      router.push("/")
    }
  }, [user, router])

  const searchBarbers = async (userLocation: [number, number] | null = null) => {
    setLoading(true)
    try {
      let coordinates: [number, number] | null = userLocation

      // Get user's current location if not provided
      if (!coordinates) {
        if (navigator.geolocation) {
          try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 10000,
                enableHighAccuracy: true
              })
            })
            coordinates = [position.coords.longitude, position.coords.latitude]
            console.log("User location:", coordinates)
          } catch (geoError) {
            console.error("Geolocation error:", geoError)
            alert("Could not get your location. Using default location for search.")
            coordinates = [-74.006, 40.7128] // NYC coordinates as fallback
          }
        } else {
          alert("Geolocation not supported. Using default location for search.")
          coordinates = [-74.006, 40.7128] // NYC coordinates as fallback
        }
      }

      console.log("Searching with coordinates:", coordinates)

      const requestBody = {
        coordinates,
        radius: 25, // Increased radius to 25km
      }

      console.log("Request body:", requestBody)

      const response = await fetch("/api/barbers/nearby", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      console.log("Response status:", response.status)
      console.log("Response headers:", Object.fromEntries(response.headers.entries()))

      if (response.ok) {
        const data = await response.json()
        console.log("Search response:", data)
        setBarbers(data.barbers || [])
        if ((data.barbers || []).length === 0) {
          const message = data.searchInfo 
            ? `No barbers found within ${data.searchInfo.radius}km. Found ${data.searchInfo.totalBarbers} total barbers with valid locations.`
            : "No barbers found in your area. Try expanding your search radius."
          alert(message)
        }
      } else {
        const responseText = await response.text()
        console.error("Raw error response:", responseText)
        
        try {
          const errorData = JSON.parse(responseText)
          console.error("Parsed error:", errorData)
          alert(`Search failed: ${errorData.error || 'Unknown error'}`)
        } catch (parseError) {
          console.error("Could not parse error response as JSON:", parseError)
          alert(`Search failed with status ${response.status}. Check console for details.`)
        }
      }
    } catch (error) {
      console.error("Network or other error:", error)
      alert("Network error. Please check your connection and try again.")
    }
    setLoading(false)
  }

  useEffect(() => {
    searchBarbers()
  }, [])

  const handleBarberClick = (barberId: string) => {
    router.push(`/user/barber/${barberId}`)
  }

  const getDirections = (address: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    const encodedAddress = encodeURIComponent(address)
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`
    window.open(googleMapsUrl, '_blank')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="gradient-bg text-white p-6">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {user?.name}!</h1>
            <p className="opacity-90">Find your perfect barber</p>
          </div>
          <div className="flex gap-4">
            <Button
              onClick={() => router.push("/user/appointments")}
              variant="outline"
              className="text-white border-white hover:bg-white hover:text-[#FF6B35]"
            >
              My Appointments
            </Button>
            <Button
              onClick={() => router.push("/user/settings")}
              variant="outline"
              className="text-white border-white hover:bg-white hover:text-[#FF6B35]"
            >
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
        {/* Search Section */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Enter your location..."
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  className="text-lg"
                />
              </div>
              <Button onClick={() => searchBarbers()} className="btn-primary" disabled={loading}>
                <Search className="w-5 h-5 mr-2" />
                {loading ? "Searching..." : "Search"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Barbers Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {barbers.map((barber) => (
            <Card
              key={barber._id}
              className="card-gradient hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
              onClick={() => handleBarberClick(barber._id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#FF6B35] to-[#4ECDC4] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {barber.businessName.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg text-[#2C3E50]">{barber.businessName}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span>{barber.rating.toFixed(1)}</span>
                      <span>({barber.reviewCount} reviews)</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-3 line-clamp-2">{barber.description}</p>

                <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                  <MapPin className="w-4 h-4" />
                  <span>{barber.location.address}</span>
                  <Badge variant="secondary" className="ml-auto">
                    {(barber.distance / 1000).toFixed(1)}km away
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-[#2C3E50]">Services:</p>
                    <div className="flex flex-wrap gap-2">
                      {barber.services.slice(0, 3).map((service, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {service.name} - ₦{service.price}
                        </Badge>
                      ))}
                      {barber.services.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{barber.services.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    onClick={(e) => getDirections(barber.location.address, e)}
                    variant="outline"
                    size="sm"
                    className="w-full text-[#FF6B35] border-[#FF6B35] hover:bg-[#FF6B35] hover:text-white"
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    Get Directions
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {barbers.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No barbers found in your area</div>
            <p className="text-gray-400 mt-2">Try searching in a different location</p>
          </div>
        )}
      </div>
    </div>
  )
}
