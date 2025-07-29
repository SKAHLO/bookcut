import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'
import jwt from 'jsonwebtoken'

const uri = process.env.MONGODB_URI as string
const JWT_SECRET = process.env.JWT_SECRET as string

export async function DELETE(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let decoded: any

    try {
      decoded = jwt.verify(token, JWT_SECRET)
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
    const client = new MongoClient(uri)
    await client.connect()
    const db = client.db("bookcut")
    const barbersCollection = db.collection("barbers")

    // Get barber's data
    const barber = await barbersCollection.findOne({ userId: decoded.userId })
    
    if (!barber) {
      await client.close()
      return NextResponse.json({ error: 'Barber not found' }, { status: 404 })
    }

    // Find the service and remove the image
    const updatedServices = barber.services.map((service: any) => {
      if (service.name === serviceName) {
        return {
          ...service,
          images: (service.images || []).filter((img: string) => img !== imageUrl)
        }
      }
      return service
    })

    // Update the barber document
    await barbersCollection.updateOne(
      { userId: decoded.userId },
      { $set: { services: updatedServices } }
    )

    await client.close()

    return NextResponse.json({ message: 'Image removed successfully' })

  } catch (error) {
    console.error('Remove image error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
