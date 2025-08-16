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
import GoogleAuthSimple from "@/components/GoogleAuthSimple"

export default function HomePage() {
  const { user, login, signup, googleSignIn, googleSignInLogin, loading } = useAuth()
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
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [resetToken, setResetToken] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("")

  useEffect(() => {
    if (!loading && user) {
      console.log("User authenticated, redirecting based on userType:", user.userType)
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

  const handleGoogleSuccess = async (credential: string, userType?: "user" | "barber") => {
    console.log("Google success:", { credential, userType })
    setIsSubmitting(true)
    try {
      if (isLogin) {
        const success = await googleSignInLogin(credential)
        if (!success) {
          alert("Google sign-in failed. Please try again.")
        }
      } else {
        const finalUserType = userType || formData.userType
        const success = await googleSignIn(credential, finalUserType as "user" | "barber")
        if (!success) {
          alert("Google sign-up failed. Please try again.")
        }
      }
    } catch (error) {
      console.error("Google auth error:", error)
      alert("Google authentication failed. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleError = (error: any) => {
    console.error("Google auth error:", error)
    alert("Google authentication failed. Please try again.")
    setIsSubmitting(false)
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotPasswordEmail }),
      })

      const data = await response.json()
      
      if (response.ok) {
        alert(data.message)
        setShowForgotPassword(false)
      } else {
        alert(data.error || "Failed to send reset email")
      }
    } catch (error) {
      console.error("Forgot password error:", error)
      alert("An error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, password: newPassword }),
      })

      const data = await response.json()
      
      if (response.ok) {
        alert("Password reset successfully! Please login with your new password.")
        setShowResetPassword(false)
        setShowForgotPassword(false)
        setResetToken("")
        setNewPassword("")
        setForgotPasswordEmail("")
        setIsLogin(true)
      } else {
        alert(data.error || "Failed to reset password")
      }
    } catch (error) {
      console.error("Reset password error:", error)
      alert("An error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return <Loading />
  }

  if (user) {
    return <Loading />
  }

  return (
    <div className="min-h-screen gradient-bg">
      <div className="container mx-auto px-4 py-6 sm:py-12">
        <div className="text-center text-white mb-8 sm:mb-12">
          <div className="flex items-center justify-center mb-4 sm:mb-6">
            <Scissors className="w-8 h-8 sm:w-12 sm:h-12 mr-2 sm:mr-3" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">BookCut</h1>
          </div>
          <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            Find and book appointments with the best barbers in your area. Get the perfect cut, every time.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-12">
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
          <Card className="card-gradient mx-4 sm:mx-0 card-touch">
            <CardHeader>
              <CardTitle className="text-center text-xl sm:text-2xl text-[#2C3E50]">
                {showForgotPassword ? "Reset Password" : showResetPassword ? "Set New Password" : isLogin ? "Welcome Back" : "Join BookCut"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Forgot Password Form */}
              {showForgotPassword && (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <Label htmlFor="forgotEmail">Email Address</Label>
                    <Input
                      id="forgotEmail"
                      type="email"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      required
                      className="mt-1"
                      disabled={isSubmitting}
                      placeholder="Enter your email address"
                    />
                  </div>

                  <Button type="submit" className="w-full btn-primary btn-touch" disabled={isSubmitting}>
                    {isSubmitting ? "Sending..." : "Send Reset Link"}
                  </Button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(false)
                        setForgotPasswordEmail("")
                      }}
                      className="text-[#FF6B35] hover:underline"
                      disabled={isSubmitting}
                    >
                      Back to Sign In
                    </button>
                  </div>
                </form>
              )}

              {/* Reset Password Form */}
              {showResetPassword && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <Label htmlFor="resetToken">Reset Token</Label>
                    <Input
                      id="resetToken"
                      type="text"
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      required
                      className="mt-1"
                      disabled={isSubmitting}
                      placeholder="Enter reset token"
                    />
                  </div>

                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="mt-1"
                      disabled={isSubmitting}
                      placeholder="Enter new password"
                      minLength={6}
                    />
                  </div>

                  <Button type="submit" className="w-full btn-primary btn-touch" disabled={isSubmitting}>
                    {isSubmitting ? "Resetting..." : "Reset Password"}
                  </Button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setShowResetPassword(false)
                        setResetToken("")
                        setNewPassword("")
                      }}
                      className="text-[#FF6B35] hover:underline"
                      disabled={isSubmitting}
                    >
                      Back to Sign In
                    </button>
                  </div>
                </form>
              )}

              {!showForgotPassword && !showResetPassword && (
                <>
                  {/* NUCLEAR GOOGLE AUTH - NO MORE CACHING ISSUES! */}
                  <div className="space-y-3 mb-6">
                    {!isLogin && (
                      <div>
                        <Label>Account Type</Label>
                        <Tabs
                          value={formData.userType}
                          onValueChange={(value) => setFormData({ ...formData, userType: value })}
                          className="mt-1"
                        >
                          <TabsList className="grid w-full grid-cols-2 bg-gray-100">
                            <TabsTrigger 
                              value="user" 
                              disabled={isSubmitting}
                              className="data-[state=active]:bg-[#FF6B35] data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
                            >
                              Customer
                            </TabsTrigger>
                            <TabsTrigger 
                              value="barber" 
                              disabled={isSubmitting}
                              className="data-[state=active]:bg-[#FF6B35] data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
                            >
                              Barber
                            </TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </div>
                    )}

                    {/* SIMPLE GOOGLE AUTH BUTTON - NO 404 ERRORS */}
                    <GoogleAuthSimple
                      userType={!isLogin ? formData.userType as "user" | "barber" : undefined}
                      onSuccess={handleGoogleSuccess}
                      onError={handleGoogleError}
                      disabled={isSubmitting}
                      isSignup={!isLogin}
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

                    <Button type="submit" className="w-full btn-primary btn-touch" disabled={isSubmitting}>
                      {isSubmitting ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
                    </Button>
                  </form>

                  <div className="text-center mt-4 space-y-2">
                    {isLogin && (
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-[#FF6B35] hover:underline block w-full"
                        disabled={isSubmitting}
                      >
                        Forgot Password?
                      </button>
                    )}
                    
                    <button
                      type="button"
                      onClick={() => setIsLogin(!isLogin)}
                      className="text-[#FF6B35] hover:underline"
                      disabled={isSubmitting}
                    >
                      {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                    </button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Success Indicator */}
      <div className="fixed bottom-4 right-4 bg-green-600 text-white p-2 rounded text-xs">
        ✅ No Cache Issues - Nuclear Fix Active!
      </div>
    </div>
  )
}
