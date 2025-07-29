"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Star, MapPin, Clock, Phone, Calendar, ArrowLeft, Navigation, X } from "lucide-react"
import { useRouter, useParams } from "next/navigation"

interface Service {
  name: string
  price: number
  duration: number
  images?: string[]
}

interface Barber {
  _id: string
  businessName: string
  description: string
  profileImage: string
  location: {
    address: string
    coordinates: number[]
  }
  contactInfo: {
    phone: string
    email: string
  }
  services: Service[]
  workingHours: {
    [key: string]: {
      start: string
      end: string
      closed: boolean
    }
  }
  rating: number
  reviewCount: number
}

export default function BarberDetail() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const barberId = params.id as string

  const [barber, setBarber] = useState<Barber | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [bookingData, setBookingData] = useState({
    date: "",
    time: "",
    notes: ""
  })
  const [bookingLoading, setBookingLoading] = useState(false)
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState("")
  const [showImageGallery, setShowImageGallery] = useState<{show: boolean, service: Service | null}>({show: false, service: null})

  const loadBarberDetails = useCallback(async () => {
    try {
      const response = await fetch(`/api/barbers/${barberId}`)

      if (response.ok) {
        const data = await response.json()
        setBarber(data.barber)
      } else {
        console.error("Failed to load barber details")
      }
    } catch (error) {
      console.error('Error loading barber:', error)
    } finally {
      setLoading(false)
    }
  }, [barberId])

  useEffect(() => {
    if (user?.userType !== "user") {
      router.push("/")
    } else {
      loadBarberDetails()
    }
  }, [user, router, barberId, loadBarberDetails])

  const getDirections = () => {
    if (barber?.location?.address) {
      const encodedAddress = encodeURIComponent(barber.location.address)
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`
      window.open(googleMapsUrl, '_blank')
    }
  }

  const openBookingModal = () => {
    if (selectedService) {
      setShowBookingModal(true)
      // Set minimum date to today if it's before 6 PM, otherwise tomorrow
      const now = new Date()
      const cutoffHour = 18 // 6 PM
      const minDate = now.getHours() < cutoffHour 
        ? now.toISOString().split('T')[0] 
        : new Date(now.getTime() + 86400000).toISOString().split('T')[0]
      setBookingData({ ...bookingData, date: minDate })
      setSelectedDate(minDate)
      loadAvailableSlots(minDate)
    } else {
      alert("Please select a service first")
    }
  }

  const loadAvailableSlots = async (date: string) => {
    if (!barber || !date) return

    try {
      const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
      const workingHours = barber.workingHours[dayOfWeek]

      if (!workingHours || workingHours.closed) {
        setAvailableSlots([])
        return
      }

      // Generate time slots based on working hours
      const slots = []
      const startTime = workingHours.start
      const endTime = workingHours.end
      const serviceDuration = selectedService?.duration || 60

      const start = new Date(`2000-01-01T${startTime}:00`)
      const end = new Date(`2000-01-01T${endTime}:00`)

      while (start < end) {
        const timeString = start.toTimeString().slice(0, 5)
        
        // If booking for today, only show future time slots
        const isToday = new Date(date).toDateString() === new Date().toDateString()
        if (isToday) {
          const now = new Date()
          const slotTime = new Date()
          const [hours, minutes] = timeString.split(':')
          slotTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)
          
          // Only add slot if it's at least 1 hour from now
          if (slotTime.getTime() > now.getTime() + (60 * 60 * 1000)) {
            slots.push(timeString)
          }
        } else {
          slots.push(timeString)
        }
        
        start.setMinutes(start.getMinutes() + serviceDuration)
      }

      // Check for existing appointments on this date
      const response = await fetch(`/api/barbers/${barberId}/availability?date=${date}`)
      if (response.ok) {
        const data = await response.json()
        const bookedSlots = data.bookedSlots || []
        const availableSlots = slots.filter(slot => !bookedSlots.includes(slot))
        setAvailableSlots(availableSlots)
      } else {
        setAvailableSlots(slots)
      }
    } catch (error) {
      console.error('Error loading available slots:', error)
      setAvailableSlots([])
    }
  }

  const handleDateChange = (date: string) => {
    setSelectedDate(date)
    setBookingData({ ...bookingData, date, time: "" })
    loadAvailableSlots(date)
  }

  const bookAppointment = async () => {
    if (!selectedService || !bookingData.date || !bookingData.time) {
      alert("Please fill in all required fields")
      return
    }

    setBookingLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert("Please login to book an appointment")
        return
      }

      const appointmentDateTime = new Date(`${bookingData.date}T${bookingData.time}:00`)

      const response = await fetch('/api/appointments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          barberId,
          service: selectedService.name,
          price: selectedService.price,
          appointmentDate: appointmentDateTime.toISOString(),
          notes: bookingData.notes
        }),
      })

      if (response.ok) {
        alert("Appointment booked successfully!")
        setShowBookingModal(false)
        setBookingData({ date: "", time: "", notes: "" })
        setSelectedService(null)
        router.push("/user/appointments")
      } else {
        const errorData = await response.json()
        alert(`Booking failed: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error booking appointment:', error)
      alert("Error booking appointment. Please try again.")
    } finally {
      setBookingLoading(false)
    }
  }

  const getDayName = (dayKey: string) => {
    const days = {
      monday: "Monday",
      tuesday: "Tuesday", 
      wednesday: "Wednesday",
      thursday: "Thursday",
      friday: "Friday",
      saturday: "Saturday",
      sunday: "Sunday"
    }
    return days[dayKey as keyof typeof days] || dayKey
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#FF6B35] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading barber details...</p>
        </div>
      </div>
    )
  }

  if (!barber) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="card-gradient text-center py-12">
          <CardContent>
            <p className="text-xl text-gray-600">Barber not found</p>
            <Button onClick={() => router.push("/user/dashboard")} className="btn-primary mt-4">
              Back to Search
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="gradient-bg text-white p-6">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.push("/user/dashboard")}
              variant="outline"
              size="icon"
              className="text-white border-white hover:bg-white hover:text-[#FF6B35]"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{barber.businessName}</h1>
              <p className="opacity-90">Barber Details & Booking</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Barber Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card className="card-gradient">
              <CardContent className="p-6">
                <div className="flex items-start gap-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-[#FF6B35] to-[#4ECDC4] rounded-full flex items-center justify-center text-white text-3xl font-bold">
                    {barber.businessName.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-[#2C3E50] mb-2">{barber.businessName}</h2>
                    <div className="flex items-center gap-2 mb-3">
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{barber.rating.toFixed(1)}</span>
                      <span className="text-gray-600">({barber.reviewCount} reviews)</span>
                    </div>
                    <p className="text-gray-600 mb-4">{barber.description}</p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{barber.location.address}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{barber.contactInfo.phone}</span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <Button
                        onClick={getDirections}
                        variant="outline"
                        className="text-[#FF6B35] border-[#FF6B35] hover:bg-[#FF6B35] hover:text-white"
                      >
                        <Navigation className="w-4 h-4 mr-2" />
                        Get Directions
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Services */}
            <Card className="card-gradient">
              <CardHeader>
                <CardTitle className="text-2xl text-[#2C3E50]">Services & Pricing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {barber.services.map((service, index) => (
                    <div
                      key={index}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedService?.name === service.name
                          ? 'border-[#FF6B35] bg-orange-50'
                          : 'border-gray-200 hover:border-[#FF6B35] hover:bg-orange-50'
                      }`}
                      onClick={() => setSelectedService(service)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-[#2C3E50]">{service.name}</h3>
                        <Badge className="bg-[#FF6B35] text-white">₦{service.price}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{service.duration} minutes</span>
                      </div>
                      
                      {/* Portfolio Images Preview */}
                      {service.images && service.images.length > 0 && (
                        <div className="mt-3">
                          <div className="flex gap-2 overflow-x-auto">
                            {service.images.slice(0, 3).map((image, imgIndex) => (
                              <img
                                key={imgIndex}
                                src={image}
                                alt={`${service.name} work ${imgIndex + 1}`}
                                className="w-12 h-12 object-cover rounded border flex-shrink-0 cursor-pointer hover:opacity-80"
                                onClick={() => setShowImageGallery({show: true, service})}
                              />
                            ))}
                            {service.images.length > 3 && (
                              <div 
                                className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center text-xs text-gray-500 flex-shrink-0 cursor-pointer hover:bg-gray-200"
                                onClick={() => setShowImageGallery({show: true, service})}
                              >
                                +{service.images.length - 3}
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Click to view all work samples</p>
                        </div>
                      )}
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
                <div className="space-y-3">
                  {Object.entries(barber.workingHours).map(([day, hours]) => (
                    <div key={day} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <span className="font-medium text-[#2C3E50] capitalize">{getDayName(day)}</span>
                      {hours.closed ? (
                        <Badge variant="secondary">Closed</Badge>
                      ) : (
                        <span className="text-gray-600">
                          {hours.start} - {hours.end}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Booking */}
          <div className="space-y-6">
            <Card className="card-gradient sticky top-6">
              <CardHeader>
                <CardTitle className="text-xl text-[#2C3E50]">Book Appointment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedService ? (
                  <div className="p-4 bg-orange-50 border border-[#FF6B35] rounded-lg">
                    <h4 className="font-semibold text-[#2C3E50] mb-1">{selectedService.name}</h4>
                    <div className="flex justify-between text-sm text-gray-600">
                    <span>{selectedService.duration} minutes</span>
                    <span className="font-semibold">₦{selectedService.price}</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-500">
                    Select a service to book
                  </div>
                )}

                <Button
                  onClick={openBookingModal}
                  disabled={!selectedService}
                  className="w-full btn-primary"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Book Appointment
                </Button>

                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Call directly: {barber.contactInfo.phone}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="w-full max-w-md my-8">
            <Card className="card-gradient max-h-[90vh] overflow-y-auto">
              <CardHeader className="sticky top-0 bg-white z-10 rounded-t-xl">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg sm:text-xl text-[#2C3E50]">Book Appointment</CardTitle>
                  <Button
                    onClick={() => setShowBookingModal(false)}
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pb-6">
              {/* Selected Service */}
              {selectedService && (
                <div className="p-3 bg-orange-50 border border-[#FF6B35] rounded-lg">
                  <h4 className="font-semibold text-[#2C3E50] mb-1">{selectedService.name}</h4>
                  <div className="flex justify-between text-sm text-gray-600">
                  <span>{selectedService.duration} minutes</span>
                  <span className="font-semibold">₦{selectedService.price}</span>
                  </div>
                </div>
              )}

              {/* Date Selection */}
              <div>
                <Label htmlFor="date">Select Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  min={new Date().toISOString().split('T')[0]} // Today
                  className="mt-1"
                />
              </div>

              {/* Time Selection */}
              <div>
                <Label>Select Time</Label>
                {availableSlots.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 max-h-40 overflow-y-auto">
                    {availableSlots.map((slot) => (
                      <Button
                        key={slot}
                        onClick={() => setBookingData({ ...bookingData, time: slot })}
                        variant={bookingData.time === slot ? "default" : "outline"}
                        size="sm"
                        className={`min-h-10 ${bookingData.time === slot ? "bg-[#FF6B35] text-white" : ""}`}
                      >
                        {slot}
                      </Button>
                    ))}
                  </div>
                ) : selectedDate ? (
                  <p className="text-sm text-gray-500 mt-2 p-3 bg-gray-50 rounded">
                    No available slots for this date. Try another date.
                  </p>
                ) : (
                  <p className="text-sm text-gray-500 mt-2 p-3 bg-gray-50 rounded">
                    Please select a date first.
                  </p>
                )}
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={bookingData.notes}
                  onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                  placeholder="Any special requests or notes..."
                  className="mt-1"
                  rows={3}
                />
              </div>

              {/* Booking Summary */}
              {selectedService && bookingData.date && bookingData.time && (
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <h4 className="font-semibold text-[#2C3E50] mb-2">Booking Summary</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Service:</span>
                      <span>{selectedService.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span>{new Date(bookingData.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Time:</span>
                      <span>{bookingData.time}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span>₦{selectedService.price}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Book Button */}
              <div className="flex gap-3 pt-4 sticky bottom-0 bg-white p-4 -m-4 mt-0 rounded-b-xl border-t">
                <Button
                  onClick={() => setShowBookingModal(false)}
                  variant="outline"
                  className="flex-1 btn-touch"
                >
                  Cancel
                </Button>
                <Button
                  onClick={bookAppointment}
                  disabled={bookingLoading || !bookingData.date || !bookingData.time}
                  className="flex-1 btn-primary btn-touch"
                >
                  {bookingLoading ? "Booking..." : "Confirm Booking"}
                </Button>
              </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Image Gallery Modal */}
      {showImageGallery.show && showImageGallery.service && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <Card className="card-gradient">
              <CardHeader className="sticky top-0 bg-white z-10 rounded-t-xl">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg text-[#2C3E50]">
                    {showImageGallery.service.name} - Portfolio
                  </CardTitle>
                  <Button
                    onClick={() => setShowImageGallery({show: false, service: null})}
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {showImageGallery.service.images && showImageGallery.service.images.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {showImageGallery.service.images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image}
                          alt={`${showImageGallery.service?.name} work ${index + 1}`}
                          className="w-full h-48 object-cover rounded-lg border"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No portfolio images available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
