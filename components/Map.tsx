'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTheme } from 'next-themes'
import { Navigation, AlertTriangle, Search } from 'lucide-react'
import SearchDrawer from './SearchDrawer'
import ReportDrawer from './ReportDrawer'
import RouteSelection from './RouteSelection'
import NavigationMode from './NavigationMode'
import CommunityDataToggle from './CommunityDataToggle'
import { useIncidentMarkers } from './Map/IncidentMarkers'
import { usePoliceMarkers } from './Map/PoliceMarkers'
import { useMapNavigation } from './Map/useMapNavigation'

interface MapProps {
  className?: string
}

function MapComponent({ className = '' }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [lng, setLng] = useState<number>(2.3522) // Default to Paris
  const [lat, setLat] = useState<number>(48.8566)
  const [zoom, setZoom] = useState<number>(11)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const { resolvedTheme } = useTheme()

  // Drawer states
  const [searchOpen, setSearchOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)

  // Community data toggle state
  const [showCommunityData, setShowCommunityData] = useState(true)

  // Use navigation hook
  const {
    userLocation,
    navigationState,
    destinationPlace,
    routes,
    selectedRouteIndex,
    navigationSteps,
    remainingDuration,
    remainingDistance,
    showRecenter,
    isFollowingUser,
    setIsFollowingUser,
    setShowRecenter,
    getUserLocation,
    handleSelectDestination,
    handleSelectRoute,
    handleBackToDestination,
    handleStartNavigation,
    handleExitNavigation,
    handleRecenter,
  } = useMapNavigation(map)

  // Use incident markers hook
  useIncidentMarkers({ map: map.current, mapLoaded, showCommunityData })

  // Use police markers hook
  usePoliceMarkers({ map: map.current, mapLoaded })

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    const mapStyle =
      resolvedTheme === 'dark'
        ? 'mapbox://styles/mapbox/dark-v11'
        : 'mapbox://styles/mapbox/light-v11'

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: mapStyle,
        center: [lng, lat],
        zoom: zoom,
        pitch: 0,
        bearing: 0,
        attributionControl: false,
        antialias: true,
        fadeDuration: 0,
      })
    } catch (error) {
      console.error('Error initializing map:', error)
      setMapError(error instanceof Error ? error.message : 'Failed to initialize map')
      return
    }

    // Track map movement
    map.current.on('move', () => {
      if (!map.current) return
      setLng(parseFloat(map.current.getCenter().lng.toFixed(4)))
      setLat(parseFloat(map.current.getCenter().lat.toFixed(4)))
      setZoom(parseFloat(map.current.getZoom().toFixed(2)))
    })

    // Track user interaction will be handled in useEffect

    // Map loaded
    map.current.on('load', async () => {
      if (!map.current) return
      setMapLoaded(true)
      console.log('Map loaded successfully!')

      // Try to get user location when map loads
      try {
        await getUserLocation()
        console.log('User location successfully obtained on map load')
      } catch (error) {
        console.log('Could not get user location on initial load:', error)
        // Don't show an error on initial load, user can still use the app
        // Location will be requested when needed for navigation
      }
    })

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [getUserLocation])

  // Update map style when theme changes
  useEffect(() => {
    if (!map.current || !mapLoaded) return

    const mapStyle =
      resolvedTheme === 'dark'
        ? 'mapbox://styles/mapbox/dark-v11'
        : 'mapbox://styles/mapbox/light-v11'

    map.current.setStyle(mapStyle)
  }, [resolvedTheme, mapLoaded])

  // Handle map drag events during navigation
  useEffect(() => {
    if (!map.current || !mapLoaded) return

    const handleMapInteraction = () => {
      if (navigationState === 'navigating') {
        setIsFollowingUser(false)
        setShowRecenter(true)
      }
    }

    // Listen to multiple events that indicate user interaction
    map.current.on('dragstart', handleMapInteraction)
    map.current.on('rotatestart', handleMapInteraction)
    map.current.on('pitchstart', handleMapInteraction)
    map.current.on('zoomstart', handleMapInteraction)
    map.current.on('touchstart', handleMapInteraction)

    return () => {
      if (map.current) {
        map.current.off('dragstart', handleMapInteraction)
        map.current.off('rotatestart', handleMapInteraction)
        map.current.off('pitchstart', handleMapInteraction)
        map.current.off('zoomstart', handleMapInteraction)
        map.current.off('touchstart', handleMapInteraction)
      }
    }
  }, [navigationState, mapLoaded, setIsFollowingUser, setShowRecenter])

  // Handle report incident
  const handleReportIncident = async (type: string) => {
    let locationToUse = userLocation

    if (!locationToUse) {
      const { toast } = await import('sonner')

      // Try to get user location first
      try {
        locationToUse = await getUserLocation()
      } catch (error) {
        if (error instanceof Error) {
          toast.error(error.message)
        } else {
          toast.error('Please enable location access to report an incident')
        }
        return
      }
    }

    try {
      const response = await fetch('/api/incidents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          latitude: locationToUse[1],
          longitude: locationToUse[0],
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save incident')
      }

      const { toast } = await import('sonner')
      toast.success('Incident reported successfully', {
        description: 'Thank you for keeping the community safe!',
      })

      setReportOpen(false)
    } catch (error) {
      console.error('Error reporting incident:', error)
      const { toast } = await import('sonner')
      toast.error('Failed to report incident', {
        description: 'Please try again later',
      })
    }
  }

  return (
    <div className={`relative h-full w-full bg-background overflow-hidden ${className}`}>
      {/* Map container */}
      <div
        ref={mapContainer}
        className="absolute inset-0 z-0"
        style={{ width: '100%', height: '100%' }}
      />

      {/* Loading indicator */}
      {!mapLoaded && !mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-background z-50">
          <div className="text-foreground text-sm">Loading map...</div>
        </div>
      )}

      {/* Error display */}
      {mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-background z-50">
          <div className="text-destructive p-4 text-center">
            <div className="text-lg mb-2">Failed to load map</div>
            <div className="text-sm">{mapError}</div>
          </div>
        </div>
      )}

      {/* Navigation mode UI */}
      {navigationState === 'navigating' && (
        <>
          <NavigationMode
            currentStep={navigationSteps[0] || null}
            nextStep={navigationSteps[1] || null}
            routeDuration={remainingDuration}
            routeDistance={remainingDistance}
            onExit={handleExitNavigation}
            onRecenter={handleRecenter}
            onReport={() => setReportOpen(true)}
            showRecenter={showRecenter}
          />
          {/* Community data toggle in navigation mode */}
          <div className="absolute top-40 right-4 z-10">
            <CommunityDataToggle
              showCommunityData={showCommunityData}
              onToggle={setShowCommunityData}
            />
          </div>
        </>
      )}

      {/* Route selection UI */}
      {navigationState === 'route-selection' && routes.length > 0 && (
        <RouteSelection
          routes={routes}
          selectedRouteIndex={selectedRouteIndex}
          onSelectRoute={handleSelectRoute}
          onStartNavigation={handleStartNavigation}
          onBack={handleBackToDestination}
        />
      )}

      {/* Default UI (when idle) */}
      {navigationState === 'idle' && (
        <>
          {/* Streetwise branding */}
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-10">
            <h1 className="text-white text-2xl font-bold tracking-wide drop-shadow-lg">
              Streetwise
            </h1>
          </div>

          {/* Community data toggle */}
          <div className="absolute top-6 right-4 z-10">
            <CommunityDataToggle
              showCommunityData={showCommunityData}
              onToggle={setShowCommunityData}
            />
          </div>

          {/* Floating location button */}
          <button
            onClick={getUserLocation}
            className="absolute top-20 right-4 z-10 bg-card rounded-full p-3 shadow-md hover:shadow-lg transition-shadow border border-border"
            aria-label="My location"
          >
            <Navigation className="h-5 w-5 text-foreground" />
          </button>

          {/* Bottom controls */}
          <div className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none">
            <div className="p-4 bg-gradient-to-t from-background via-background/50 to-transparent">
              <div className="space-y-3 max-w-lg mx-auto pointer-events-auto">
                {/* Search input */}
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Where are you going?"
                    value={destinationPlace?.text || ''}
                    onClick={() => setSearchOpen(true)}
                    readOnly
                    className="w-full h-14 text-base pl-12 pr-4 bg-card backdrop-blur-sm text-foreground placeholder-muted-foreground shadow-2xl border border-border rounded-xl cursor-pointer"
                  />
                  <Search className="absolute left-4 top-4 h-5 w-5 text-muted-foreground pointer-events-none" />
                </div>

                {/* Report button */}
                <Button
                  onClick={() => setReportOpen(true)}
                  className="w-full h-14 font-semibold text-base rounded-xl shadow-2xl flex items-center justify-center gap-2"
                >
                  {/*<AlertTriangle className="h-5 w-5" />*/}
                  Report a danger
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Search Drawer */}
      <SearchDrawer
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onSelectDestination={handleSelectDestination}
        currentMapCenter={{ lng, lat }}
      />

      {/* Report Drawer */}
      <ReportDrawer
        open={reportOpen}
        onOpenChange={setReportOpen}
        onReportIncident={handleReportIncident}
      />
    </div>
  )
}

export default MapComponent
