import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'
import jwt from 'jsonwebtoken'

const uri = process.env.MONGODB_URI as string
const JWT_SECRET = process.env.JWT_SECRET as string

// Simple in-memory storage for now - in production, use cloud storage like Cloudinary, AWS S3, etc.
const uploadedImages: { [key: string]: string[] } = {}

export async function POST(request: NextRequest) {
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
      return NextResponse.json({ error: 'Only barbers can upload images' }, { status: 403 })
    }

    // Parse form data
    const formData = await request.formData()
    const serviceName = formData.get('serviceName') as string
    const images = formData.getAll('images') as File[]

    if (!serviceName) {
      return NextResponse.json({ error: 'Service name is required' }, { status: 400 })
    }

    if (!images || images.length === 0) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 })
    }

    // Validate image files
    for (const image of images) {
      if (!image.type.startsWith('image/')) {
        return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 })
      }
      
      // Check file size (max 5MB per image)
      if (image.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: 'Image size must be less than 5MB' }, { status: 400 })
      }
    }

    // Convert images to base64 for storage (in production, upload to cloud storage)
    const imageUrls: string[] = []
    
    for (const image of images) {
      const arrayBuffer = await image.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const base64 = buffer.toString('base64')
      const dataUrl = `data:${image.type};base64,${base64}`
      imageUrls.push(dataUrl)
    }

    // Connect to MongoDB
    const client = new MongoClient(uri)
    await client.connect()
    const db = client.db("bookcut")
    const barbersCollection = db.collection("barbers")

    // Update barber's service with new images
    const barber = await barbersCollection.findOne({ userId: decoded.userId })
    
    if (!barber) {
      await client.close()
      return NextResponse.json({ error: 'Barber not found' }, { status: 404 })
    }

    // Find the service and add images
    const updatedServices = barber.services.map((service: any) => {
      if (service.name === serviceName) {
        return {
          ...service,
          images: [...(service.images || []), ...imageUrls]
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

    return NextResponse.json({ 
      message: 'Images uploaded successfully',
      imageUrls: imageUrls
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
