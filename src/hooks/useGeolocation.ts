/**
 * Hook pour obtenir la géolocalisation de l'utilisateur
 * 
 * Utilise l'API Geolocation du navigateur pour obtenir les coordonnées,
 * puis les convertit en nom de ville via l'API de géocodage inverse.
 */

import { useState, useEffect, useCallback } from 'react'

interface GeolocationState {
  loading: boolean
  error: string | null
  location: string | null
  coordinates: {
    latitude: number
    longitude: number
  } | null
}

interface UseGeolocationReturn extends GeolocationState {
  requestLocation: () => Promise<string | null>
}

/**
 * Convertit des coordonnées en nom de ville via l'API Nominatim (OpenStreetMap)
 */
async function reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'TugeApp/1.0',
        },
      }
    )
    
    if (!response.ok) {
      console.warn('[Geolocation] Reverse geocoding failed:', response.status)
      return null
    }
    
    const data = await response.json()
    
    // Extraire la ville ou la région
    const address = data.address || {}
    const city = address.city || address.town || address.village || address.municipality
    const region = address.state || address.county
    
    if (city && region) {
      return `${city}, ${region}`
    } else if (city) {
      return city
    } else if (region) {
      return region
    }
    
    return null
  } catch (error) {
    console.warn('[Geolocation] Reverse geocoding error:', error)
    return null
  }
}

/**
 * Hook pour gérer la géolocalisation
 */
export function useGeolocation(): UseGeolocationReturn {
  const [state, setState] = useState<GeolocationState>({
    loading: false,
    error: null,
    location: null,
    coordinates: null,
  })

  // Vérifier si la localisation est déjà en cache
  useEffect(() => {
    const cached = localStorage.getItem('user_location')
    if (cached) {
      try {
        const { location, coordinates, timestamp } = JSON.parse(cached)
        // Cache valide pendant 24h
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          setState({
            loading: false,
            error: null,
            location,
            coordinates,
          })
        }
      } catch {
        localStorage.removeItem('user_location')
      }
    }
  }, [])

  const requestLocation = useCallback(async (): Promise<string | null> => {
    // Retourner le cache si disponible
    if (state.location) {
      return state.location
    }

    // Vérifier la disponibilité de l'API
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'La géolocalisation n\'est pas supportée par ce navigateur',
      }))
      return null
    }

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 3600000, // 1 heure
        })
      })

      const { latitude, longitude } = position.coords
      const coordinates = { latitude, longitude }

      // Convertir en nom de ville
      const location = await reverseGeocode(latitude, longitude)

      // Mettre en cache
      if (location) {
        localStorage.setItem('user_location', JSON.stringify({
          location,
          coordinates,
          timestamp: Date.now(),
        }))
      }

      setState({
        loading: false,
        error: null,
        location,
        coordinates,
      })

      return location
    } catch (error) {
      const geoError = error as GeolocationPositionError
      let errorMessage = 'Erreur de géolocalisation'
      
      switch (geoError.code) {
        case geoError.PERMISSION_DENIED:
          errorMessage = 'Accès à la localisation refusé'
          break
        case geoError.POSITION_UNAVAILABLE:
          errorMessage = 'Position non disponible'
          break
        case geoError.TIMEOUT:
          errorMessage = 'Délai dépassé pour la localisation'
          break
      }

      setState({
        loading: false,
        error: errorMessage,
        location: null,
        coordinates: null,
      })

      return null
    }
  }, [state.location])

  return {
    ...state,
    requestLocation,
  }
}

export default useGeolocation






