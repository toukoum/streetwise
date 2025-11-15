import { SAFETY_CONFIG, calculateTimeWeight, getIncidentPenalty } from '@/config/config'
import { getIncidentsNearRoute } from '@/utils/incidents'
import { getPoliceStationsNearRoute } from '@/utils/police-stations'
import { NextRequest, NextResponse } from 'next/server'

interface RouteInput {
  geometry: any // GeoJSON LineString from Mapbox
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { geometry } = body as RouteInput

    if (!geometry || !geometry.coordinates) {
      return NextResponse.json({ error: 'Invalid route geometry' }, { status: 400 })
    }

    // Get incidents near this route
    const { data: incidents, error: incidentsError } = await getIncidentsNearRoute(
      geometry,
      SAFETY_CONFIG.BUFFER_DISTANCE_METERS,
      SAFETY_CONFIG.MAX_INCIDENT_AGE_DAYS
    )

    if (incidentsError) {
      console.error('Error fetching incidents:', incidentsError)
      return NextResponse.json({ error: 'Failed to fetch incidents' }, { status: 500 })
    }

    // Get police stations near this route
    const { data: policeStations, error: policeError } = await getPoliceStationsNearRoute(
      geometry,
      SAFETY_CONFIG.POLICE_STATION_BUFFER_METERS
    )

    if (policeError) {
      console.error('Error fetching police stations:', policeError)
      // Don't fail the request if police stations can't be fetched
      // Just continue without the bonus
    }

    // Calculate safety score
    let safetyScore = SAFETY_CONFIG.BASE_SAFETY_SCORE
    let totalPenalty = 0

    console.log(`Found ${incidents.length} incidents near route`)
    console.log(`Found ${policeStations.length} police stations near route`)

    // Calculate penalties from incidents
    incidents.forEach((incident) => {
      const penalty = getIncidentPenalty(incident.type)
      const timeWeight = calculateTimeWeight(new Date(incident.created_at))
      const weightedPenalty = penalty * timeWeight

      totalPenalty += weightedPenalty
      safetyScore -= weightedPenalty
    })

    // Add bonus for police stations
    let policeBonus = 0
    if (policeStations && policeStations.length > 0) {
      // Calculate total bonus (limited by MAX_POLICE_STATION_BONUS)
      policeBonus = Math.min(
        policeStations.length * SAFETY_CONFIG.POLICE_STATION_BONUS,
        SAFETY_CONFIG.MAX_POLICE_STATION_BONUS
      )
      safetyScore += policeBonus
      console.log(
        `Applied police station bonus: +${policeBonus} (${policeStations.length} stations)`
      )
    }

    // Ensure score stays within valid range (0-10)
    safetyScore = Math.max(SAFETY_CONFIG.MIN_SAFETY_SCORE, Math.min(10, safetyScore))

    console.log(
      `Final safety score: ${safetyScore} (penalties: -${totalPenalty}, police bonus: +${policeBonus})`
    )

    return NextResponse.json({
      safetyScore: Math.round(safetyScore * 10) / 10, // Round to 1 decimal
      incidentCount: incidents.length,
      policeStationCount: policeStations.length,
      totalPenalty: Math.round(totalPenalty * 10) / 10,
      policeBonus: Math.round(policeBonus * 10) / 10,
      incidents: incidents.map((i) => ({
        id: i.id,
        type: i.type,
        severity: i.severity,
        latitude: i.latitude,
        longitude: i.longitude,
        created_at: i.created_at,
        location: [i.longitude, i.latitude],
      })),
      policeStations: policeStations.map((p) => ({
        id: p.id,
        name: p.name,
        latitude: p.latitude,
        longitude: p.longitude,
        location: [p.longitude, p.latitude],
      })),
    })
  } catch (error) {
    console.error('Error calculating safety score:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
