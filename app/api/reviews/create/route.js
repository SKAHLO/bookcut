import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import jwt from 'jsonwebtoken'

export async function POST(request) {
  try {
    const { rating, comment, barberId, appointmentId } = await request.json()

    // Verify authentication
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    let decoded
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET)
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    if (decoded.userType !== 'user') {
      return NextResponse.json({ error: 'Only customers can leave reviews' }, { status: 403 })
    }

    const userId = decoded.userId

    // Validate required fields
    if (!rating || !barberId || !appointmentId) {
      return NextResponse.json({ error: 'Rating, barber ID, and appointment ID are required' }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("bookcut")

    // Verify the appointment exists and belongs to the user
    const appointment = await db.collection('appointments').findOne({
      _id: new ObjectId(appointmentId),
      userId: new ObjectId(userId),
      barberId: new ObjectId(barberId),
      status: 'completed'
    })

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found or not completed' }, { status: 404 })
    }

    // Check if review already exists for this appointment
    const existingReview = await db.collection('reviews').findOne({
      appointmentId: new ObjectId(appointmentId),
      userId: new ObjectId(userId)
    })

    if (existingReview) {
      return NextResponse.json({ error: 'Review already exists for this appointment' }, { status: 400 })
    }

    // Create the review
    const review = {
      userId: new ObjectId(userId),
      barberId: new ObjectId(barberId),
      appointmentId: new ObjectId(appointmentId),
      rating: parseInt(rating),
      comment: comment || '',
      createdAt: new Date()
    }

    const result = await db.collection('reviews').insertOne(review)

    // Update barber's rating statistics
    await updateBarberRating(db, barberId)

    return NextResponse.json({ 
      message: 'Review created successfully',
      reviewId: result.insertedId
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating review:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function updateBarberRating(db, barberId) {
  try {
    // Get all reviews for this barber
    const reviews = await db.collection('reviews').find({
      barberId: new ObjectId(barberId)
    }).toArray()

    if (reviews.length === 0) {
      return
    }

    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
    const averageRating = totalRating / reviews.length

    // Update barber's rating and review count in the barbers collection
    await db.collection('barbers').updateOne(
      { _id: new ObjectId(barberId) },
      { 
        $set: { 
          rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
          reviewCount: reviews.length
        }
      }
    )
  } catch (error) {
    console.error('Error updating barber rating:', error)
  }
}
