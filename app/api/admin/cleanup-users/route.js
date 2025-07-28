import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function POST(request) {
  try {
    const client = await clientPromise
    const db = client.db("bookcut")

    console.log("=== Starting User Database Cleanup ===")

    // Find users that have barber profiles but userType is "user"
    const usersCollection = db.collection("users")
    const barbersCollection = db.collection("barbers")

    // Get all users
    const allUsers = await usersCollection.find({}).toArray()
    
    console.log("Total users found:", allUsers.length)

    let cleanupResults = {
      usersChecked: 0,
      incorrectBarberProfiles: 0,
      deletedBarberProfiles: [],
      errors: []
    }

    for (const user of allUsers) {
      cleanupResults.usersChecked++
      
      console.log(`Checking user: ${user.email} (userType: ${user.userType})`)
      
      // If user has userType "user" but has a barber profile, delete the barber profile
      if (user.userType === "user") {
        const barberProfile = await barbersCollection.findOne({ userId: user._id })
        
        if (barberProfile) {
          console.log(`Found incorrect barber profile for user ${user.email}`)
          cleanupResults.incorrectBarberProfiles++
          
          try {
            await barbersCollection.deleteOne({ userId: user._id })
            cleanupResults.deletedBarberProfiles.push({
              userEmail: user.email,
              barberId: barberProfile._id.toString()
            })
            console.log(`Deleted barber profile for user ${user.email}`)
          } catch (error) {
            console.error(`Error deleting barber profile for ${user.email}:`, error)
            cleanupResults.errors.push({
              userEmail: user.email,
              error: error.message
            })
          }
        }
      }
    }

    console.log("=== Cleanup Complete ===")
    console.log("Results:", cleanupResults)

    return NextResponse.json({
      message: "Database cleanup completed",
      results: cleanupResults
    })
  } catch (error) {
    console.error("Cleanup error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Also provide a GET method to just check without cleaning
export async function GET(request) {
  try {
    const client = await clientPromise
    const db = client.db("bookcut")

    const usersCollection = db.collection("users")
    const barbersCollection = db.collection("barbers")

    // Get all users and their corresponding barber profiles
    const allUsers = await usersCollection.find({}).toArray()
    
    let analysis = {
      totalUsers: allUsers.length,
      userTypeDistribution: {},
      problemUsers: []
    }

    for (const user of allUsers) {
      // Count user types
      const userType = user.userType || 'undefined'
      analysis.userTypeDistribution[userType] = (analysis.userTypeDistribution[userType] || 0) + 1
      
      // Check for problems
      if (user.userType === "user") {
        const barberProfile = await barbersCollection.findOne({ userId: user._id })
        if (barberProfile) {
          analysis.problemUsers.push({
            email: user.email,
            userType: user.userType,
            hasBarberProfile: true,
            barberId: barberProfile._id.toString()
          })
        }
      }
    }

    return NextResponse.json({
      message: "Database analysis complete",
      analysis
    })
  } catch (error) {
    console.error("Analysis error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
