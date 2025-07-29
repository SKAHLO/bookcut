import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import jwt from 'jsonwebtoken'
import clientPromise from '@/lib/mongodb.js'

export async function DELETE(request) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let decoded

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret')
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    if (decoded.userType !== 'barber') {
      return NextResponse.json({ error: 'Only barbers can remove images' }, { status: 403 })
    }

    const { serviceName, imageUrl } = await request.json()

    if (!serviceName || !imageUrl) {
      return NextResponse.json({ error: 'Service name and image URL are required' }, { status: 400 })
    }

    // Connect to MongoDB
    const client = await clientPromise
    const db = client.db("bookcut")
    const barbersCollection = db.collection("barbers")

    // Get barber's data
    const barber = await barbersCollection.findOne({ userId: new ObjectId(decoded.userId) })
    
    if (!barber) {
      return NextResponse.json({ error: 'Barber not found' }, { status: 404 })
    }

    // Find the service and remove the image
    const updatedServices = barber.services.map((service) => {
      if (service.name === serviceName) {
        return {
          ...service,
          images: (service.images || []).filter((img) => img !== imageUrl)
        }
      }
      return service
    })

    // Update the barber document
    await barbersCollection.updateOne(
      { userId: new ObjectId(decoded.userId) },
      { $set: { services: updatedServices } }
    )

    return NextResponse.json({ message: 'Image removed successfully' })

  } catch (error) {
    console.error('Remove image error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
