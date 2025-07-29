"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Clock, DollarSign, Edit, Upload, X, Image as ImageIcon, Plus } from "lucide-react"
import { useRouter } from "next/navigation"

interface Service {
  name: string
  price: number
  duration: number
  images?: string[]
}

export default function BarberServices() {
  const { user } = useAuth()
  const router = useRouter()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadingImages, setUploadingImages] = useState<{[key: number]: boolean}>({})
  const [showImageModal, setShowImageModal] = useState<{show: boolean, serviceIndex: number}>({show: false, serviceIndex: -1})

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

  const handleImageUpload = async (serviceIndex: number, files: FileList | null) => {
    if (!files || files.length === 0) return

    setUploadingImages(prev => ({ ...prev, [serviceIndex]: true }))

    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const formData = new FormData()
      formData.append('serviceName', services[serviceIndex].name)
      
      // Upload multiple files
      Array.from(files).forEach((file, index) => {
        formData.append(`images`, file)
      })

      const response = await fetch('/api/barbers/upload-images', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        // Refresh services to get updated images
        loadServices()
        alert('Images uploaded successfully!')
      } else {
        const errorData = await response.json()
        alert(`Upload failed: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error uploading images:', error)
      alert('Error uploading images. Please try again.')
    } finally {
      setUploadingImages(prev => ({ ...prev, [serviceIndex]: false }))
    }
  }

  const removeImage = async (serviceIndex: number, imageUrl: string) => {
    if (!confirm('Are you sure you want to remove this image?')) return

    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/barbers/remove-image', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceName: services[serviceIndex].name,
          imageUrl: imageUrl
        }),
      })

      if (response.ok) {
        // Refresh services to get updated images
        loadServices()
        alert('Image removed successfully!')
      } else {
        const errorData = await response.json()
        alert(`Remove failed: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error removing image:', error)
      alert('Error removing image. Please try again.')
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
                    <Badge className="bg-[#FF6B35] text-white">₦{service.price}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-600">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-medium">₦{service.price}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{service.duration} minutes</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        Rate: ₦{(service.price / (service.duration / 60)).toFixed(2)}/hour
                      </div>
                    </div>

                    {/* Portfolio Images */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium text-gray-700">Portfolio Images</Label>
                        <Button
                          onClick={() => setShowImageModal({show: true, serviceIndex: index})}
                          size="sm"
                          variant="outline"
                          className="text-xs"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Images
                        </Button>
                      </div>
                      
                      {service.images && service.images.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                          {service.images.slice(0, 4).map((image, imgIndex) => (
                            <div key={imgIndex} className="relative group">
                              <img
                                src={image}
                                alt={`${service.name} work ${imgIndex + 1}`}
                                className="w-full h-20 object-cover rounded-lg border"
                              />
                              <Button
                                onClick={() => removeImage(index, image)}
                                size="sm"
                                variant="destructive"
                                className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                          {service.images.length > 4 && (
                            <div className="flex items-center justify-center h-20 bg-gray-100 rounded-lg border text-xs text-gray-500">
                              +{service.images.length - 4} more
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-20 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 text-gray-500">
                          <div className="text-center">
                            <ImageIcon className="w-6 h-6 mx-auto mb-1" />
                            <p className="text-xs">No images yet</p>
                          </div>
                        </div>
                      )}
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

      {/* Image Upload Modal */}
      {showImageModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md card-gradient">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg text-[#2C3E50]">
                  Add Images for {services[showImageModal.serviceIndex]?.name}
                </CardTitle>
                <Button
                  onClick={() => setShowImageModal({show: false, serviceIndex: -1})}
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="images">Select Images</Label>
                <Input
                  id="images"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleImageUpload(showImageModal.serviceIndex, e.target.files)}
                  disabled={uploadingImages[showImageModal.serviceIndex]}
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  You can select multiple images at once. Supported formats: JPG, PNG, WebP
                </p>
              </div>

              {uploadingImages[showImageModal.serviceIndex] && (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B35]"></div>
                  <span className="ml-2 text-sm text-gray-600">Uploading images...</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => setShowImageModal({show: false, serviceIndex: -1})}
                  variant="outline"
                  className="flex-1"
                  disabled={uploadingImages[showImageModal.serviceIndex]}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
