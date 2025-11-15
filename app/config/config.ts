// Safety scoring configuration for Streetwise
// Adjust these values to fine-tune the safety calculation

export const SAFETY_CONFIG = {
  // Buffer distance in meters to consider incidents near the route
  BUFFER_DISTANCE_METERS: 100,

  // Maximum age of incidents to consider (in days)
  MAX_INCIDENT_AGE_DAYS: 30,

  // Recent incidents are weighted more heavily (within this many days)
  RECENT_THRESHOLD_DAYS: 7,

  // Base safety score (out of 10)
  BASE_SAFETY_SCORE: 10,

  // Severity weights for each incident type (higher = more dangerous)
  INCIDENT_SEVERITY: {
    harassment: 10, // Most severe
    aggressive: 9,
    pickpocket: 2,
    suspicious: 7,
    vandalism: 5,
    protest: 1,
    insecurity: 5,
    passage: 2,
    animal: 1,
    poorlight: 5, // Least severe
  } as Record<string, number>,

  // Penalty points deducted from safety score per incident
  PENALTY_PER_INCIDENT: {
    harassment: 1.0,    // Severity: 10 (highest)
    aggressive: 0.9,    // Severity: 9
    pickpocket: 0.2,    // Severity: 2
    suspicious: 0.7,    // Severity: 7
    vandalism: 0.5,     // Severity: 5
    protest: 0.1,       // Severity: 1 (lowest)
    insecurity: 0.5,    // Severity: 5
    passage: 0.2,       // Severity: 2
    animal: 0.1,        // Severity: 1
    poorlight: 0.5,     // Severity: 5
  } as Record<string, number>,

  // Multiplier for recent incidents (last 7 days)
  RECENT_INCIDENT_MULTIPLIER: 1.5,

  // Minimum safety score (can't go below this)
  MIN_SAFETY_SCORE: 0,

  // ===== Safer Route Generation Configuration =====

  // Waypoint offset distances to try (in meters) when generating safer alternatives
  // Will try these sequentially: first 1000m, then 2000m, then 3000m
  WAYPOINT_OFFSET_DISTANCES: [50, 150, 500],

  // Maximum detour percentage acceptable for safer route
  // 50 = safer route can be up to 50% longer than original
  MAX_DETOUR_PERCENTAGE: 90,

  // Radius to identify danger clusters (incidents within this radius are grouped)
  DANGER_CLUSTER_RADIUS_METERS: 150,

  // Maximum number of danger clusters to avoid (1 = avoid only worst cluster)
  MAX_DANGER_CLUSTERS_TO_AVOID: 2,

  // Direction checking box dimensions when finding safest direction
  DIRECTION_CHECK_BOX_WIDTH_METERS: 100, // Width of rectangle to check
  DIRECTION_CHECK_BOX_LENGTH_METERS: 200, // Length of rectangle to check

  // Maximum number of alternative route attempts before giving up
  MAX_ALTERNATIVE_ROUTE_ATTEMPTS: 8,

  // Compass directions to check when finding safest waypoint direction
  COMPASS_DIRECTIONS: ['north', 'south', 'east', 'west'] as const,

  // ===== Police Station Safety Configuration =====

  // Buffer distance in meters to consider police stations near the route
  POLICE_STATION_BUFFER_METERS: 300,

  // Bonus points added to safety score per police station near route
  POLICE_STATION_BONUS: 0.5,

  // Maximum total bonus from police stations (to prevent score inflation)
  MAX_POLICE_STATION_BONUS: 3,

  // ===== Incident Display Configuration =====

  // Emoji icons for each incident type
  INCIDENT_EMOJIS: {
    harassment: '😠',
    aggressive: '👊',
    pickpocket: '💰',
    suspicious: '👀',
    vandalism: '🔨',
    protest: '📢',
    insecurity: '⚠️',
    passage: '🚧',
    animal: '🐕',
    poorlight: '💡',
  } as Record<string, string>,
}

// Helper function to get severity for an incident type
export function getIncidentSeverity(type: string): number {
  return SAFETY_CONFIG.INCIDENT_SEVERITY[type] || 5 // Default to medium severity
}

// Helper function to get penalty for an incident type
export function getIncidentPenalty(type: string): number {
  return SAFETY_CONFIG.PENALTY_PER_INCIDENT[type] || 0.5 // Default penalty
}

// Helper function to get emoji for an incident type
export function getIncidentEmoji(type: string): string {
  return SAFETY_CONFIG.INCIDENT_EMOJIS[type] || '⚠️' // Default to warning emoji
}

// Calculate time-based weight (more recent = higher weight)
export function calculateTimeWeight(incidentDate: Date): number {
  const now = new Date()
  const ageInDays = (now.getTime() - incidentDate.getTime()) / (1000 * 60 * 60 * 24)

  // Incidents older than max age have 0 weight
  if (ageInDays > SAFETY_CONFIG.MAX_INCIDENT_AGE_DAYS) {
    return 0
  }

  // Recent incidents get multiplier
  if (ageInDays <= SAFETY_CONFIG.RECENT_THRESHOLD_DAYS) {
    return SAFETY_CONFIG.RECENT_INCIDENT_MULTIPLIER
  }

  // Exponential decay for older incidents
  // Weight decreases from 1.0 to 0.3 over 30 days
  const decayRate = 0.05
  return Math.max(0.3, Math.exp(-decayRate * ageInDays))
}
