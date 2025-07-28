import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function POST(request) {
  try {
    const { coordinates, radius = 10, searchQuery } = await request.json() // radius in km

    console.log("Search parameters:", { coordinates, radius, searchQuery })

    const client = await clientPromise
    const db = client.db("bookcut")

    let barbers = []
    let searchInfo = {}

    // If there's a search query (address search), perform text-based search
    if (searchQuery && searchQuery.trim()) {
      console.log("Performing advanced keyword search for:", searchQuery)
      
      const totalBarbers = await db.collection("barbers").countDocuments({ 
        isProfileComplete: true 
      })
      
      // Split search query into individual keywords and filter out common words
      const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'near', 'close', 'around']
      const keywords = searchQuery.trim().toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 1 && !stopWords.includes(word))
      
      console.log("Search keywords:", keywords)
      
      // Add common variations and synonyms for location searches
      const expandedKeywords = [...keywords]
      keywords.forEach(keyword => {
        // Add partial matches for longer words
        if (keyword.length > 4) {
          expandedKeywords.push(keyword.substring(0, keyword.length - 1))
          expandedKeywords.push(keyword.substring(0, keyword.length - 2))
        }
        
        // Add common location variations
        const locationVariations = {
          'st': ['street', 'saint'],
          'ave': ['avenue'],
          'rd': ['road'],
          'dr': ['drive'],
          'blvd': ['boulevard'],
          'ln': ['lane'],
          'ct': ['court'],
          'pl': ['place']
        }
        
        Object.entries(locationVariations).forEach(([short, long]) => {
          if (keyword === short) {
            expandedKeywords.push(...long)
          } else if (long.includes(keyword)) {
            expandedKeywords.push(short)
          }
        })
      })
      
      console.log("Expanded keywords:", expandedKeywords)
      
      // Create comprehensive search patterns
      const createSearchPattern = (keywords) => {
        // Create individual keyword patterns
        const keywordPatterns = keywords.map(keyword => {
          const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          return {
            $or: [
              // Exact matches at word boundaries (highest priority)
              { "location.address": { $regex: `\\b${escapedKeyword}`, $options: "i" } },
              { businessName: { $regex: `\\b${escapedKeyword}`, $options: "i" } },
              { description: { $regex: `\\b${escapedKeyword}`, $options: "i" } },
              { name: { $regex: `\\b${escapedKeyword}`, $options: "i" } },
              
              // Partial matches anywhere in text
              { "location.address": { $regex: escapedKeyword, $options: "i" } },
              { businessName: { $regex: escapedKeyword, $options: "i" } },
              { description: { $regex: escapedKeyword, $options: "i" } },
              { name: { $regex: escapedKeyword, $options: "i" } },
              
              // Service matches
              { "services.name": { $regex: escapedKeyword, $options: "i" } }
            ]
          }
        })
        
        // For broader results, use $or (any keyword matches)
        // For stricter results, use $and (all keywords must match)
        return keywords.length === 1 ? keywordPatterns[0] : { $or: keywordPatterns }
      }
      
      const searchCondition = createSearchPattern(expandedKeywords)
      
      barbers = await db
        .collection("barbers")
        .aggregate([
          {
            $match: {
              isProfileComplete: true,
              $and: [searchCondition]
            }
          },
          {
            $addFields: {
              // Simple relevance scoring
              relevanceScore: {
                $add: [
                  // Business name exact match bonus
                  {
                    $cond: {
                      if: { 
                        $regexMatch: { 
                          input: { $toLower: "$businessName" }, 
                          regex: searchQuery.toLowerCase(), 
                          options: "i" 
                        } 
                      },
                      then: 50,
                      else: 0
                    }
                  },
                  // Address exact match bonus
                  {
                    $cond: {
                      if: { 
                        $regexMatch: { 
                          input: { $toLower: "$location.address" }, 
                          regex: searchQuery.toLowerCase(), 
                          options: "i" 
                        } 
                      },
                      then: 30,
                      else: 0
                    }
                  },
                  // Rating boost
                  { $multiply: ["$rating", 5] },
                  // Review count boost
                  { $multiply: ["$reviewCount", 0.1] }
                ]
              }
            }
          },
          {
            $sort: {
              relevanceScore: -1, // Sort by relevance first
              rating: -1,         // Then by rating
              reviewCount: -1     // Then by review count
            }
          },
          {
            $addFields: {
              distance: null // No distance calculation for address search
            }
          },
          {
            $project: {
              businessName: 1,
              description: 1,
              profileImage: 1,
              location: 1,
              services: 1,
              rating: 1,
              reviewCount: 1,
              distance: 1,
              name: 1,
              relevanceScore: 1, // Include for debugging
            },
          },
          {
            $limit: 50 // Limit results for performance
          }
        ])
        .toArray()

      searchInfo = {
        searchType: "address",
        searchQuery,
        totalBarbers,
        found: barbers.length
      }
      
      console.log("Found", barbers.length, "barbers matching address search")
    } 
    // Otherwise, perform location-based search (existing functionality)
    else if (coordinates) {
      console.log("Performing location-based search near:", coordinates, "within", radius, "km")
      
      const totalBarbers = await db.collection("barbers").countDocuments({ 
        "location.coordinates": { $exists: true, $ne: [0, 0] },
        isProfileComplete: true 
      })
      
      barbers = await db
        .collection("barbers")
        .aggregate([
          {
            $geoNear: {
              near: {
                type: "Point",
                coordinates: coordinates, // [longitude, latitude]
              },
              distanceField: "distance",
              maxDistance: radius * 1000, // convert km to meters
              spherical: true,
              query: {
                isProfileComplete: true,
                "location.coordinates": { $exists: true, $ne: [0, 0] }
              }
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "userId",
              foreignField: "_id",
              as: "user",
            },
          },
          {
            $project: {
              businessName: 1,
              description: 1,
              profileImage: 1,
              location: 1,
              services: 1,
              rating: 1,
              reviewCount: 1,
              distance: 1,
              "user.name": 1,
            },
          },
        ])
        .toArray()

      searchInfo = {
        searchType: "location",
        coordinates,
        radius,
        totalBarbers,
        found: barbers.length
      }
      
      console.log("Found", barbers.length, "nearby barbers")
    } else {
      return NextResponse.json({ 
        error: "Either coordinates or search query must be provided" 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      barbers,
      searchInfo
    })
  } catch (error) {
    console.error("Barber search error:", error)
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error.message 
    }, { status: 500 })
  }
}
