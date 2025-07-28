"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Calendar, Clock, MapPin, Phone, Star } from "lucide-react"
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
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [reviewData, setReviewData] = useState({
    rating: 0,
    comment: ""
  })
  const [submittingReview, setSubmittingReview] = useState(false)

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

  const openReviewModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setReviewData({ rating: 0, comment: "" })
    setShowReviewModal(true)
  }

  const closeReviewModal = () => {
    setShowReviewModal(false)
    setSelectedAppointment(null)
    setReviewData({ rating: 0, comment: "" })
  }

  const submitReview = async () => {
    if (!selectedAppointment || reviewData.rating === 0) {
      alert("Please provide a rating")
      return
    }

    setSubmittingReview(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/reviews/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating: reviewData.rating,
          comment: reviewData.comment,
          barberId: selectedAppointment.barberId,
          appointmentId: selectedAppointment._id
        })
      })

      if (response.ok) {
        alert("Review submitted successfully!")
        closeReviewModal()
        loadAppointments() // Refresh appointments
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      alert("Error submitting review")
    } finally {
      setSubmittingReview(false)
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

  const cancelAppointment = async (appointmentId: string) => {
    if (!confirm("Are you sure you want to cancel this appointment?")) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`/api/appointments/${appointmentId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'cancelled' })
      })

      if (response.ok) {
        // Update local state
        setAppointments(appointments.map((apt) => 
          apt._id === appointmentId ? { ...apt, status: "cancelled" } : apt
        ))
        alert("Appointment cancelled successfully!")
      } else {
        const errorData = await response.json()
        alert(`Error cancelling appointment: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error)
      alert("Error cancelling appointment")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="gradient-bg text-white p-4 sm:p-6">
        <div className="container mx-auto">
          {/* Mobile Layout */}
          <div className="flex flex-col space-y-3 sm:hidden">
            <div className="text-center">
              <h1 className="text-xl font-bold">My Appointments</h1>
              <p className="opacity-90 text-sm">Manage your appointments</p>
            </div>
            <Button
              onClick={() => router.push("/user/dashboard")}
              variant="outline"
              size="sm"
              className="text-white border-white hover:bg-white hover:text-[#FF6B35]"
            >
              Back to Dashboard
            </Button>
          </div>
          
          {/* Desktop Layout */}
          <div className="hidden sm:flex justify-between items-center">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold">My Appointments</h1>
              <p className="opacity-90">Manage your upcoming and past appointments</p>
            </div>
            <Button
              onClick={() => router.push("/user/dashboard")}
              variant="outline"
              className="text-white border-white hover:bg-white hover:text-[#FF6B35] text-sm lg:text-base"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        {appointments.length === 0 ? (
          <Card className="card-gradient text-center py-8 sm:py-12 mx-2 sm:mx-0">
            <CardContent>
              <Calendar className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-[#2C3E50] mb-2">No appointments yet</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-6">Book your first appointment with a barber in your area</p>
              <Button onClick={() => router.push("/user/dashboard")} className="btn-primary">
                Find Barbers
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {appointments.map((appointment) => (
              <Card 
                key={appointment._id} 
                className="card-gradient hover:shadow-lg transition-shadow cursor-pointer mx-2 sm:mx-0"
                onClick={() => router.push(`/user/appointments/${appointment._id}`)}
              >
                <CardContent className="p-4 sm:p-6">
                  {/* Mobile Layout */}
                  <div className="flex flex-col space-y-4 sm:hidden">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#FF6B35] to-[#4ECDC4] rounded-full flex items-center justify-center text-white text-lg font-bold">
                        {appointment.barberName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-[#2C3E50] mb-1 truncate">{appointment.businessName}</h3>
                        <p className="text-sm text-gray-600 mb-2 truncate">with {appointment.barberName}</p>
                        <div className="text-lg font-bold text-[#2C3E50] mb-2">₦{appointment.price}</div>
                        <Badge className={getStatusColor(appointment.status)}>{appointment.status}</Badge>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">
                          {new Date(appointment.appointmentDate).toLocaleDateString()} at{" "}
                          {new Date(appointment.appointmentDate).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{appointment.service}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{appointment.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{appointment.phone}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {appointment.status === "pending" || appointment.status === "confirmed" ? (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            cancelAppointment(appointment._id)
                          }}
                          variant="outline"
                          size="sm"
                          className="flex-1 text-red-600 hover:bg-red-50"
                        >
                          Cancel
                        </Button>
                      ) : null}

                      {appointment.status === "completed" && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 bg-transparent"
                          onClick={(e) => {
                            e.stopPropagation()
                            openReviewModal(appointment)
                          }}
                        >
                          Leave Review
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden sm:flex items-start justify-between">
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
                      <div className="text-2xl font-bold text-[#2C3E50] mb-2">₦{appointment.price}</div>
                      <Badge className={`mb-3 ${getStatusColor(appointment.status)}`}>{appointment.status}</Badge>

                      <div className="space-y-2">
                        {appointment.status === "pending" || appointment.status === "confirmed" ? (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation()
                              cancelAppointment(appointment._id)
                            }}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:bg-red-50 w-full"
                          >
                            Cancel
                          </Button>
                        ) : null}

                        {appointment.status === "completed" && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full bg-transparent"
                            onClick={(e) => {
                              e.stopPropagation()
                              openReviewModal(appointment)
                            }}
                          >
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

      {/* Review Modal */}
      {showReviewModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-[#2C3E50] mb-4">
              Leave a Review
            </h2>
            <p className="text-gray-600 mb-4">
              How was your experience with {selectedAppointment.barberName}?
            </p>

            {/* Star Rating */}
            <div className="mb-4">
              <Label className="block text-sm font-medium mb-2">Rating</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewData({ ...reviewData, rating: star })}
                    className={`p-1 ${
                      star <= reviewData.rating 
                        ? 'text-yellow-400' 
                        : 'text-gray-300'
                    }`}
                  >
                    <Star className="w-6 h-6 fill-current" />
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div className="mb-6">
              <Label htmlFor="comment" className="block text-sm font-medium mb-2">
                Comment (optional)
              </Label>
              <Textarea
                id="comment"
                placeholder="Tell others about your experience..."
                value={reviewData.comment}
                onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                rows={3}
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={closeReviewModal}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={submitReview}
                disabled={submittingReview || reviewData.rating === 0}
                className="flex-1 btn-primary"
              >
                {submittingReview ? "Submitting..." : "Submit Review"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
