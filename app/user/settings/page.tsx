"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin } from "lucide-react"
import { useRouter } from "next/navigation"

export default function UserSettings() {
  const { user } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    location: { address: "", coordinates: [0, 0] },
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [loading, setLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  useEffect(() => {
    if (user?.userType !== "user") {
      router.push("/")
    } else {
      loadProfile()
    }
  }, [user, router])

  const loadProfile = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.user) {
          setProfile({
            name: data.user.name || "",
            email: data.user.email || "",
            phone: data.user.phone || "",
            location: data.user.location || { address: "", coordinates: [0, 0] },
          })
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setInitialLoading(false)
    }
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
      if (!profile.name || !profile.email) {
        alert("Please fill in all required fields (Name, Email)")
        setLoading(false)
        return
      }

      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      })

      if (response.ok) {
        alert("Profile updated successfully!")
      } else {
        const errorData = await response.json()
        alert(`Error updating profile: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      alert("Error updating profile")
    } finally {
      setLoading(false)
    }
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = [position.coords.longitude, position.coords.latitude]
          setProfile({
            ...profile,
            location: {
              ...profile.location,
              coordinates: coords
            }
          })
          alert("Location updated! Please save your profile.")
        },
        (error) => {
          alert("Error getting location. Please ensure location access is enabled.")
        }
      )
    } else {
      alert("Geolocation is not supported by this browser.")
    }
  }

  const changePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New passwords don't match")
      return
    }

    if (passwordData.newPassword.length < 6) {
      alert("Password must be at least 6 characters long")
      return
    }

    setPasswordLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert("Please login again")
        return
      }

      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      if (response.ok) {
        alert("Password updated successfully!")
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error changing password:', error)
      alert("Error changing password")
    } finally {
      setPasswordLoading(false)
    }
  }

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
            <h1 className="text-3xl font-bold">User Settings</h1>
            <p className="opacity-90">Update your profile and preferences</p>
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

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-8">
          {/* Basic Information */}
          <Card className="card-gradient">
            <CardHeader>
              <CardTitle className="text-2xl text-[#2C3E50]">Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="mt-1"
                    disabled
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="address">Home Address</Label>
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
                    onClick={getCurrentLocation}
                    title="Use current location"
                  >
                    <MapPin className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  This helps us find barbers near you
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Password Change */}
          <Card className="card-gradient">
            <CardHeader>
              <CardTitle className="text-2xl text-[#2C3E50]">Change Password</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="mt-1"
                  minLength={6}
                />
              </div>
              
              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="mt-1"
                  minLength={6}
                />
              </div>

              <Button 
                onClick={changePassword} 
                disabled={passwordLoading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                className="btn-primary"
              >
                {passwordLoading ? "Updating..." : "Change Password"}
              </Button>
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
