import { NextResponse } from "next/server"

export async function POST(request) {
  try {
    const { address } = await request.json()

    if (!address) {
      return NextResponse.json({ error: "Address is required" }, { status: 400 })
    }

    // Use OpenStreetMap Nominatim API server-side to avoid CORS
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      {
        headers: {
          'User-Agent': 'BookCut App/1.0 (https://bookcut.onrender.com)'
        }
      }
    )
    
    if (!response.ok) {
      return NextResponse.json({ error: "Geocoding service unavailable" }, { status: 503 })
    }

    const data = await response.json()
    
    if (data && data.length > 0) {
      const lat = parseFloat(data[0].lat)
      const lon = parseFloat(data[0].lon)
      
      return NextResponse.json({
        coordinates: [lon, lat], // MongoDB expects [longitude, latitude]
        displayName: data[0].display_name
      })
    } else {
      return NextResponse.json({ 
        error: "Could not find coordinates for this address" 
      }, { status: 404 })
    }
    
  } catch (error) {
    console.error("Geocoding error:", error)
    return NextResponse.json({ 
      error: "Geocoding failed" 
    }, { status: 500 })
  }
}
