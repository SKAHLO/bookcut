"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Clock, MapPin, Phone, MessageCircle, Send, ArrowLeft } from "lucide-react"
import { useRouter, useParams } from "next/navigation"

interface Message {
  _id: string
  senderId: string
  senderName: string
  senderType: 'user' | 'barber'
  message: string
  timestamp: Date
}

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

export default function AppointmentDetail() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const appointmentId = params.id as string

  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const loadAppointmentDetails = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`/api/appointments/${appointmentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setAppointment(data.appointment)
      }
    } catch (error) {
      console.error('Error loading appointment:', error)
    } finally {
      setLoading(false)
    }
  }, [appointmentId])

  const loadMessages = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`/api/appointments/${appointmentId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }, [appointmentId])

  useEffect(() => {
    if (user?.userType !== "user") {
      router.push("/")
    } else {
      loadAppointmentDetails()
      loadMessages()
    }
  }, [user, router, appointmentId, loadAppointmentDetails, loadMessages])

  const sendMessage = async () => {
    if (!newMessage.trim()) return

    setSending(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`/api/appointments/${appointmentId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: newMessage,
          senderType: 'user'
        }),
      })

      if (response.ok) {
        setNewMessage("")
        loadMessages() // Reload messages
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#FF6B35] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading appointment...</p>
        </div>
      </div>
    )
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="card-gradient text-center py-12">
          <CardContent>
            <p className="text-xl text-gray-600">Appointment not found</p>
            <Button onClick={() => router.push("/user/appointments")} className="btn-primary mt-4">
              Back to Appointments
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
              onClick={() => router.push("/user/appointments")}
              variant="outline"
              size="icon"
              className="text-white border-white hover:bg-white hover:text-[#FF6B35]"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Appointment Details</h1>
              <p className="opacity-90">View details and chat with your barber</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Appointment Details */}
          <Card className="card-gradient">
            <CardHeader>
              <CardTitle className="text-2xl text-[#2C3E50] flex items-center gap-2">
                <Calendar className="w-6 h-6" />
                Appointment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-[#FF6B35] to-[#4ECDC4] rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {appointment.barberName.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-[#2C3E50] mb-1">{appointment.businessName}</h3>
                  <p className="text-gray-600 mb-2">with {appointment.barberName}</p>
                  <Badge className={getStatusColor(appointment.status)}>{appointment.status}</Badge>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-[#2C3E50]">${appointment.price}</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-gray-600">
                  <Calendar className="w-5 h-5" />
                  <span className="font-medium">
                    {new Date(appointment.appointmentDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Clock className="w-5 h-5" />
                  <span className="font-medium">
                    {new Date(appointment.appointmentDate).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-medium">{appointment.service}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <MapPin className="w-5 h-5" />
                  <span className="font-medium">{appointment.location}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Phone className="w-5 h-5" />
                  <span className="font-medium">{appointment.phone}</span>
                </div>
              </div>

              {/* Appointment Status Info */}
              <div className="mt-6 pt-4 border-t">
                <h4 className="font-semibold text-[#2C3E50] mb-3">Appointment Status</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Current Status:</span>
                    <Badge className={getStatusColor(appointment.status)}>{appointment.status}</Badge>
                  </div>
                  
                  {appointment.status === 'pending' && (
                    <div className="text-sm text-gray-500 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                      <p className="font-medium mb-1">⏳ Waiting for confirmation</p>
                      <p>Your appointment request has been sent to the barber. You&apos;ll be notified once they accept it.</p>
                    </div>
                  )}
                  
                  {appointment.status === 'confirmed' && (
                    <div className="text-sm text-gray-500 bg-green-50 p-3 rounded-lg border border-green-200">
                      <p className="font-medium mb-1">✅ Appointment Confirmed</p>
                      <p>Your appointment has been confirmed! Don&apos;t forget to arrive on time.</p>
                    </div>
                  )}
                  
                  {appointment.status === 'completed' && (
                    <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <p className="font-medium mb-1">🎉 Appointment Completed</p>
                      <p>Hope you enjoyed your service! Consider leaving a review.</p>
                    </div>
                  )}
                  
                  {appointment.status === 'cancelled' && (
                    <div className="text-sm text-gray-500 bg-red-50 p-3 rounded-lg border border-red-200">
                      <p className="font-medium mb-1">❌ Appointment Cancelled</p>
                      <p>This appointment has been cancelled. You can book a new one anytime.</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chat */}
          <Card className="card-gradient">
            <CardHeader>
              <CardTitle className="text-2xl text-[#2C3E50] flex items-center gap-2">
                <MessageCircle className="w-6 h-6" />
                Chat with Barber
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Messages */}
              <div className="h-96 overflow-y-auto border rounded-lg p-4 mb-4 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No messages yet. Start a conversation!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message._id}
                        className={`flex ${message.senderType === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.senderType === 'user'
                              ? 'bg-[#FF6B35] text-white'
                              : 'bg-white border text-gray-800'
                          }`}
                        >
                          <p className="text-sm">{message.message}</p>
                          <p className={`text-xs mt-1 ${
                            message.senderType === 'user' ? 'text-orange-100' : 'text-gray-500'
                          }`}>
                            {new Date(message.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="flex gap-2">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 min-h-[60px] resize-none"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                />
                <Button
                  onClick={sendMessage}
                  disabled={sending || !newMessage.trim()}
                  className="btn-primary"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
