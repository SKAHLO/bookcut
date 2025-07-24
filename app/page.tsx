"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Scissors, MapPin, Clock, Star } from "lucide-react"
import Loading from "@/components/loading"
import GoogleSignInButton from "@/components/google-signin-button"

export default function HomePage() {
  const { user, login, signup, googleSignIn, loading } = useAuth()
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    userType: "user",
    location: { address: "", coordinates: [0, 0] },
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && user) {
      if (user.userType === "barber") {
        router.push("/barber/dashboard")
      } else {
        router.push("/user/dashboard")
      }
    }
  }, [user, loading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (isLogin) {
        const success = await login(formData.email, formData.password)
        if (success) {
          // Redirect handled by useEffect
        } else {
          alert("Login failed. Please check your credentials.")
        }
      } else {
        const success = await signup(formData)
        if (success) {
          alert("Account created successfully! Please login.")
          setIsLogin(true)
          setFormData({ ...formData, password: "" })
        } else {
          alert("Signup failed. Please try again.")
        }
      }
    } catch (error) {
      console.error("Form submission error:", error)
      alert("An error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleSuccess = async (credential: string, userType: "user" | "barber") => {
    setIsSubmitting(true)
    try {
      const success = await googleSignIn(credential, userType)
      if (success) {
        // Redirect handled by useEffect
      } else {
        alert("Google sign-in failed. Please try again.")
      }
    } catch (error) {
      console.error("Google sign-in error:", error)
      alert("Google sign-in failed. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleError = (error: any) => {
    console.error("Google sign-in error:", error)
    alert("Google sign-in failed. Please try again.")
  }

  if (loading) {
    return <Loading />
  }

  if (user) {
    return <Loading />
  }

  return (
    <div className="min-h-screen gradient-bg">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center text-white mb-12">
          <div className="flex items-center justify-center mb-6">
            <Scissors className="w-12 h-12 mr-3" />
            <h1 className="text-5xl font-bold">BookCut</h1>
          </div>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Find and book appointments with the best barbers in your area. Get the perfect cut, every time.
          </p>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <MapPin className="w-8 h-8 mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-2">Find Nearby</h3>
              <p className="text-sm opacity-90">Discover skilled barbers in your area</p>
            </div>
            <div className="text-center">
              <Clock className="w-8 h-8 mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-2">Easy Booking</h3>
              <p className="text-sm opacity-90">Book appointments in just a few clicks</p>
            </div>
            <div className="text-center">
              <Star className="w-8 h-8 mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-2">Quality Service</h3>
              <p className="text-sm opacity-90">Rated barbers with proven expertise</p>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto">
          <Card className="card-gradient">
            <CardHeader>
              <CardTitle className="text-center text-2xl text-[#2C3E50]">
                {isLogin ? "Welcome Back" : "Join BookCut"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Google Sign-In Buttons */}
              {!isLogin && (
                <div className="space-y-3 mb-6">
                  <GoogleSignInButton
                    userType="user"
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    disabled={isSubmitting}
                  />

                  <GoogleSignInButton
                    userType="barber"
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    disabled={isSubmitting}
                  />

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">Or continue with email</span>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <>
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="mt-1"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                        className="mt-1"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <Label>Account Type</Label>
                      <Tabs
                        value={formData.userType}
                        onValueChange={(value) => setFormData({ ...formData, userType: value })}
                        className="mt-1"
                      >
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="user" disabled={isSubmitting}>
                            Customer
                          </TabsTrigger>
                          <TabsTrigger value="barber" disabled={isSubmitting}>
                            Barber
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>
                  </>
                )}

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="mt-1"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    className="mt-1"
                    disabled={isSubmitting}
                  />
                </div>

                <Button type="submit" className="w-full btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
                </Button>
              </form>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-[#FF6B35] hover:underline"
                  disabled={isSubmitting}
                >
                  {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
