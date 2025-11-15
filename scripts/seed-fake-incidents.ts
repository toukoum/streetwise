/**
 * Script to seed fake incident data for Paris neighborhoods
 * Run with: DOTENV_CONFIG_PATH=.env.local pnpm tsx scripts/seed-fake-incidents.ts
 */

import 'dotenv/config'
import { getIncidentSeverity } from '../config/config'
import { supabaseAdmin } from '../utils/supabase-admin'

// Define Paris risky zones with their approximate coordinates
const RISKY_ZONES = {
  chapelleStalingrad: {
    name: 'La Chapelle - Stalingrad',
    // Bounding box around La Chapelle and Stalingrad area
    bounds: {
      minLat: 48.883,
      maxLat: 48.893,
      minLng: 2.355,
      maxLng: 2.37,
    },
  },
  barbesRochechouart: {
    name: 'Barbès - Rochechouart',
    // Bounding box around Barbès-Rochechouart
    bounds: {
      minLat: 48.881,
      maxLat: 48.888,
      minLng: 2.345,
      maxLng: 2.355,
    },
  },
  gareNord: {
    name: 'Gare du Nord',
    // Bounding box around Gare du Nord station
    bounds: {
      minLat: 48.877,
      maxLat: 48.883,
      minLng: 2.353,
      maxLng: 2.362,
    },
  },
  lesHalles: {
    name: 'Les Halles - Châtelet',
    // Bounding box around Les Halles and Châtelet
    bounds: {
      minLat: 48.859,
      maxLat: 48.865,
      minLng: 2.343,
      maxLng: 2.352,
    },
  },
  belleville: {
    name: 'Belleville',
    // Bounding box around Belleville
    bounds: {
      minLat: 48.867,
      maxLat: 48.875,
      minLng: 2.375,
      maxLng: 2.385,
    },
  },
  pigalle: {
    name: 'Pigalle',
    // Bounding box around Pigalle
    bounds: {
      minLat: 48.879,
      maxLat: 48.885,
      minLng: 2.333,
      maxLng: 2.342,
    },
  },
  gareEst: {
    name: "Gare de l'Est",
    // Bounding box around Gare de l'Est
    bounds: {
      minLat: 48.873,
      maxLat: 48.879,
      minLng: 2.355,
      maxLng: 2.364,
    },
  },
  republique: {
    name: 'République',
    // Bounding box around République
    bounds: {
      minLat: 48.864,
      maxLat: 48.87,
      minLng: 2.36,
      maxLng: 2.369,
    },
  },
  menilmontant: {
    name: 'Ménilmontant',
    // Bounding box around Ménilmontant
    bounds: {
      minLat: 48.863,
      maxLat: 48.871,
      minLng: 2.381,
      maxLng: 2.391,
    },
  },
  porteChapelle: {
    name: 'Porte de la Chapelle',
    // Bounding box around Porte de la Chapelle
    bounds: {
      minLat: 48.897,
      maxLat: 48.903,
      minLng: 2.356,
      maxLng: 2.365,
    },
  },
}

// Paris city bounds (approximate)
const PARIS_BOUNDS = {
  minLat: 48.815,
  maxLat: 48.902,
  minLng: 2.225,
  maxLng: 2.42,
}

// Incident types with their likelihood in these neighborhoods
const INCIDENT_TYPES = [
  { type: 'harassment', weight: 15 },
  { type: 'aggressive', weight: 12 },
  { type: 'pickpocket', weight: 20 },
  { type: 'suspicious', weight: 18 },
  { type: 'vandalism', weight: 10 },
  { type: 'protest', weight: 5 },
  { type: 'insecurity', weight: 10 },
  { type: 'passage', weight: 5 },
  { type: 'poorlight', weight: 5 },
]

// Helper function to generate random coordinate within bounds
function randomCoordinate(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

// Helper function to get random incident type based on weights
function getRandomIncidentType(): string {
  const totalWeight = INCIDENT_TYPES.reduce((sum, item) => sum + item.weight, 0)
  let random = Math.random() * totalWeight

  for (const item of INCIDENT_TYPES) {
    random -= item.weight
    if (random <= 0) {
      return item.type
    }
  }

  return INCIDENT_TYPES[0].type
}

// Helper function to generate random date within last 30 days
function randomDateWithinLast30Days(): Date {
  const now = new Date()
  const daysAgo = Math.random() * 30 // Random number between 0-30 days
  const past = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
  return past
}

// Generate incidents for a neighborhood
function generateIncidentsForNeighborhood(
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number },
  count: number
) {
  const incidents = []

  for (let i = 0; i < count; i++) {
    const type = getRandomIncidentType()
    const latitude = randomCoordinate(bounds.minLat, bounds.maxLat)
    const longitude = randomCoordinate(bounds.minLng, bounds.maxLng)
    const severity = getIncidentSeverity(type)

    // Generate date within last 30 days
    const createdAt = randomDateWithinLast30Days()

    incidents.push({
      type,
      latitude,
      longitude,
      severity,
      created_at: createdAt.toISOString(),
    })
  }

  return incidents
}

async function seedIncidents() {
  console.log('🌱 Starting to seed fake incident data for Paris...\n')

  const TOTAL_INCIDENTS = 200
  const RISKY_ZONE_PERCENTAGE = 0.4 // 40% in risky zones
  const SPREAD_PERCENTAGE = 0.6 // 60% spread across Paris

  const riskyZoneIncidents = Math.floor(TOTAL_INCIDENTS * RISKY_ZONE_PERCENTAGE) // 80 incidents
  const spreadIncidents = Math.floor(TOTAL_INCIDENTS * SPREAD_PERCENTAGE) // 120 incidents

  const allIncidents = []

  console.log(
    `📊 Distribution: ${riskyZoneIncidents} in risky zones, ${spreadIncidents} spread across Paris\n`
  )

  // Generate incidents for risky zones (5-10 per zone)
  const zones = Object.values(RISKY_ZONES)
  const incidentsPerZone = Math.floor(riskyZoneIncidents / zones.length)

  for (const zone of zones) {
    // Randomize between 5-10 incidents per zone, but ensure we use all allocated incidents
    const zoneIndex = zones.indexOf(zone)
    const isLastZone = zoneIndex === zones.length - 1

    let count
    if (isLastZone) {
      // For the last zone, use all remaining incidents to reach exactly riskyZoneIncidents
      const usedIncidents = zones.slice(0, zoneIndex).reduce((sum, z, i) => {
        return sum + Math.min(10, Math.max(5, incidentsPerZone + Math.floor(Math.random() * 3 - 1)))
      }, 0)
      count = riskyZoneIncidents - allIncidents.filter((i) => !i.isSpread).length
    } else {
      count = Math.min(10, Math.max(5, incidentsPerZone + Math.floor(Math.random() * 3 - 1)))
    }

    console.log(`📍 Generating ${count} incidents for ${zone.name}...`)
    const incidents = generateIncidentsForNeighborhood(zone.bounds, count)
    allIncidents.push(...incidents.map((i) => ({ ...i, isSpread: false })))
  }

  // Generate incidents spread across all of Paris
  console.log(`\n🌍 Generating ${spreadIncidents} incidents spread across Paris...`)
  const parisWideIncidents = generateIncidentsForNeighborhood(PARIS_BOUNDS, spreadIncidents)
  allIncidents.push(...parisWideIncidents.map((i) => ({ ...i, isSpread: true })))

  console.log(`\n✨ Generated ${allIncidents.length} total incidents`)
  console.log('💾 Inserting into database...\n')

  // Insert in batches of 50 to avoid overwhelming the database
  const batchSize = 50
  let insertedCount = 0

  // Remove the isSpread property before inserting
  const incidentsToInsert = allIncidents.map(({ isSpread, ...incident }) => incident)

  for (let i = 0; i < incidentsToInsert.length; i += batchSize) {
    const batch = incidentsToInsert.slice(i, i + batchSize)

    const { error } = await supabaseAdmin.from('incidents').insert(batch)

    if (error) {
      console.error(`❌ Error inserting batch ${i / batchSize + 1}:`, error)
      process.exit(1)
    }

    insertedCount += batch.length
    console.log(`✅ Inserted ${insertedCount}/${incidentsToInsert.length} incidents`)
  }

  console.log('\n🎉 Successfully seeded all fake incidents!')
  console.log('\nIncident type distribution:')

  // Show distribution of incident types
  const typeCounts: Record<string, number> = {}
  incidentsToInsert.forEach((incident) => {
    typeCounts[incident.type] = (typeCounts[incident.type] || 0) + 1
  })

  Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`)
    })
}

// Run the seed function
seedIncidents()
  .then(() => {
    console.log('\n✨ Seeding completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Seeding failed:', error)
    process.exit(1)
  })
