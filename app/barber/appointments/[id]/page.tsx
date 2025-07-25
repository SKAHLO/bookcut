"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Clock, MapPin, Phone, MessageCircle, Send, ArrowLeft, User, Check, X } from "lucide-react"
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
  userId: string
  customerName: string
  service: string
  appointmentDate: string
  status: string
  price: number
}

export default function BarberAppointmentDetail() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const appointmentId = params.id as string

  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (user?.userType !== "barber") {
      router.push("/")
    } else {
      loadAppointmentDetails()
      loadMessages()
    }
  }, [user, router, appointmentId])

  const loadAppointmentDetails = async () => {
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
  }

  const loadMessages = async () => {
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
  }

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
          senderType: 'barber'
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

  const updateAppointmentStatus = async (newStatus: string) => {
    setUpdating(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`/api/appointments/${appointmentId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        // Reload appointment details to get updated status
        loadAppointmentDetails()
        alert(`Appointment ${newStatus} successfully!`)
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error updating appointment status:', error)
      alert('Error updating appointment status')
    } finally {
      setUpdating(false)
    }
  }

  const acceptAppointment = () => {
    if (window.confirm('Accept this appointment?')) {
      updateAppointmentStatus('confirmed')
    }
  }

  const rejectAppointment = () => {
    if (window.confirm('Are you sure you want to reject this appointment?')) {
      updateAppointmentStatus('cancelled')
    }
  }

  const completeAppointment = () => {
    if (window.confirm('Mark this appointment as completed?')) {
      updateAppointmentStatus('completed')
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
            <Button onClick={() => router.push("/barber/dashboard")} className="btn-primary mt-4">
              Back to Dashboard
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
              onClick={() => router.push("/barber/dashboard")}
              variant="outline"
              size="icon"
              className="text-white border-white hover:bg-white hover:text-[#FF6B35]"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Appointment Details</h1>
              <p className="opacity-90">View details and chat with your customer</p>
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
                  {appointment.customerName.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-[#2C3E50] mb-1">{appointment.customerName}</h3>
                  <p className="text-gray-600 mb-2">Customer</p>
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
              </div>

              {/* Appointment Actions */}
              <div className="mt-6 pt-4 border-t">
                <h4 className="font-semibold text-[#2C3E50] mb-3">Appointment Actions</h4>
                <div className="flex flex-wrap gap-2">
                  {appointment.status === 'pending' && (
                    <>
                      <Button
                        onClick={acceptAppointment}
                        disabled={updating}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        {updating ? "Updating..." : "Accept"}
                      </Button>
                      <Button
                        onClick={rejectAppointment}
                        disabled={updating}
                        variant="outline"
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </>
                  )}
                  
                  {appointment.status === 'confirmed' && (
                    <Button
                      onClick={completeAppointment}
                      disabled={updating}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      {updating ? "Updating..." : "Mark Complete"}
                    </Button>
                  )}

                  {(appointment.status === 'completed' || appointment.status === 'cancelled') && (
                    <div className="text-sm text-gray-500 italic">
                      No actions available for {appointment.status} appointments
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
                Chat with Customer
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
                        className={`flex ${message.senderType === 'barber' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.senderType === 'barber'
                              ? 'bg-[#FF6B35] text-white'
                              : 'bg-white border text-gray-800'
                          }`}
                        >
                          <p className="text-sm">{message.message}</p>
                          <p className={`text-xs mt-1 ${
                            message.senderType === 'barber' ? 'text-orange-100' : 'text-gray-500'
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
