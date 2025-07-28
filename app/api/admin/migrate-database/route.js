import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function POST(request) {
  try {
    const client = await clientPromise
    const db = client.db("bookcut")

    console.log("=== Starting Database Migration ===")

    const usersCollection = db.collection("users")
    const barbersCollection = db.collection("barbers")

    // Get all users from the current mixed users collection
    const allUsers = await usersCollection.find({}).toArray()
    
    let migrationResults = {
      totalUsersFound: allUsers.length,
      regularUsers: 0,
      barbersToMigrate: 0,
      migrated: [],
      errors: [],
      duplicatesSkipped: []
    }

    console.log("Found", allUsers.length, "users to process")

    for (const user of allUsers) {
      try {
        if (user.userType === "barber") {
          console.log(`Processing barber: ${user.email}`)
          migrationResults.barbersToMigrate++

          // Check if barber already exists in barbers collection
          const existingBarber = await barbersCollection.findOne({ email: user.email })
          
          if (existingBarber) {
            console.log(`Barber ${user.email} already exists in barbers collection, skipping`)
            migrationResults.duplicatesSkipped.push(user.email)
            continue
          }

          // Find existing barber profile from old structure
          const barberProfile = await barbersCollection.findOne({ userId: user._id })

          // Create new barber document with all fields
          const newBarber = {
            email: user.email,
            password: user.password,
            name: user.name,
            phone: user.phone || "",
            googleId: user.googleId || null,
            businessName: barberProfile?.businessName || "",
            description: barberProfile?.description || "",
            profileImage: barberProfile?.profileImage || user.profileImage || "",
            portfolioImages: barberProfile?.portfolioImages || [],
            location: barberProfile?.location || user.location || { address: "", coordinates: [0, 0] },
            contactInfo: barberProfile?.contactInfo || { phone: user.phone || "", email: user.email },
            services: barberProfile?.services || [],
            workingHours: barberProfile?.workingHours || {
              monday: { start: "09:00", end: "18:00", closed: false },
              tuesday: { start: "09:00", end: "18:00", closed: false },
              wednesday: { start: "09:00", end: "18:00", closed: false },
              thursday: { start: "09:00", end: "18:00", closed: false },
              friday: { start: "09:00", end: "18:00", closed: false },
              saturday: { start: "09:00", end: "18:00", closed: false },
              sunday: { start: "09:00", end: "18:00", closed: true },
            },
            rating: barberProfile?.rating || 0,
            reviewCount: barberProfile?.reviewCount || 0,
            isProfileComplete: barberProfile?.isProfileComplete || false,
            createdAt: user.createdAt || new Date(),
          }

          // Insert into barbers collection
          const result = await barbersCollection.insertOne(newBarber)
          console.log(`Migrated barber ${user.email} to barbers collection with ID: ${result.insertedId}`)

          // Remove from users collection
          await usersCollection.deleteOne({ _id: user._id })
          console.log(`Removed barber ${user.email} from users collection`)

          // Remove old barber profile if it exists
          if (barberProfile) {
            await barbersCollection.deleteOne({ userId: user._id })
            console.log(`Removed old barber profile for ${user.email}`)
          }

          migrationResults.migrated.push({
            email: user.email,
            newId: result.insertedId.toString(),
            hadProfile: !!barberProfile
          })

        } else {
          // Regular user - remove userType field and ensure they stay in users collection
          if (user.userType) {
            await usersCollection.updateOne(
              { _id: user._id },
              { $unset: { userType: "" } }
            )
            console.log(`Cleaned userType field from user ${user.email}`)
          }
          migrationResults.regularUsers++
        }
      } catch (error) {
        console.error(`Error processing user ${user.email}:`, error)
        migrationResults.errors.push({
          email: user.email,
          error: error.message
        })
      }
    }

    console.log("=== Migration Complete ===")
    console.log("Results:", migrationResults)

    return NextResponse.json({
      message: "Database migration completed",
      results: migrationResults
    })
  } catch (error) {
    console.error("Migration error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET method to analyze current state
export async function GET(request) {
  try {
    const client = await clientPromise
    const db = client.db("bookcut")

    const usersCollection = db.collection("users")
    const barbersCollection = db.collection("barbers")

    // Analyze current state
    const allUsers = await usersCollection.find({}).toArray()
    const allBarbers = await barbersCollection.find({}).toArray()

    let analysis = {
      currentUsers: allUsers.length,
      currentBarbers: allBarbers.length,
      usersWithUserType: allUsers.filter(u => u.userType).length,
      usersMarkedAsBarbers: allUsers.filter(u => u.userType === "barber").length,
      usersMarkedAsUsers: allUsers.filter(u => u.userType === "user").length,
      barbersWithUserId: allBarbers.filter(b => b.userId).length, // Old structure
      barbersWithEmail: allBarbers.filter(b => b.email).length, // New structure
      needsMigration: allUsers.filter(u => u.userType === "barber").length > 0
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
