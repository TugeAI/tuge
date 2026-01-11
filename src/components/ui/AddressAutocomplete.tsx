'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, Check, Loader2 } from 'lucide-react'

// Type declarations for Google Maps API
declare global {
  interface Window {
    google?: typeof google
  }
}

declare namespace google.maps.places {
  interface AutocompletePrediction {
    description: string
    place_id: string
    structured_formatting: {
      main_text: string
      secondary_text: string
    }
  }
  class AutocompleteService {
    getPlacePredictions(
      request: { input: string; componentRestrictions?: { country: string }; types?: string[] },
      callback: (predictions: AutocompletePrediction[] | null, status: string) => void
    ): void
  }
  const PlacesServiceStatus: {
    OK: string
    ZERO_RESULTS: string
    ERROR: string
  }
}

interface AddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  isHighlighted?: boolean
  placeholder?: string
  className?: string
}

/**
 * Composant d'autocomplétion d'adresse avec Google Places API
 * Charge l'API de manière asynchrone et fournit des suggestions d'adresses françaises
 */
export function AddressAutocomplete({
  value,
  onChange,
  isHighlighted = false,
  placeholder = 'Ville, région...',
  className = '',
}: AddressAutocompleteProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [inputValue, setInputValue] = useState(value)
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Sync with external value changes
  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value)
    }
  }, [value])

  // Load Google Maps API
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    if (!apiKey) {
      console.warn('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY not found. Address autocomplete will work as a simple text input.')
      setIsLoading(false)
      return
    }

    const loadGoogleMaps = async () => {
      try {
        // Check if already loaded
        if (window.google?.maps?.places) {
          autocompleteServiceRef.current = new google.maps.places.AutocompleteService()
          setIsLoading(false)
          return
        }

        // Check if script is already being loaded
        const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
        if (existingScript) {
          // Wait for existing script to load
          existingScript.addEventListener('load', () => {
            if (window.google?.maps?.places) {
              autocompleteServiceRef.current = new google.maps.places.AutocompleteService()
              setIsLoading(false)
            }
          })
          return
        }

        // Create and load new script
        const script = document.createElement('script')
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`
        script.async = true
        script.defer = true
        
        script.onload = () => {
          if (window.google?.maps?.places) {
            autocompleteServiceRef.current = new google.maps.places.AutocompleteService()
            setIsLoading(false)
          }
        }

        script.onerror = () => {
          console.error('Error loading Google Maps API')
          setIsLoading(false)
        }

        document.head.appendChild(script)
      } catch (error) {
        console.error('Error loading Google Maps API:', error)
        setIsLoading(false)
      }
    }

    loadGoogleMaps()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch suggestions with debounce
  const fetchSuggestions = useCallback((input: string) => {
    if (!autocompleteServiceRef.current || input.length < 2) {
      setSuggestions([])
      setIsOpen(false)
      return
    }

    autocompleteServiceRef.current.getPlacePredictions(
      {
        input,
        componentRestrictions: { country: 'fr' },
        types: ['(regions)', '(cities)'],
      },
      (predictions, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSuggestions(predictions)
          setIsOpen(true)
        } else {
          setSuggestions([])
          setIsOpen(false)
        }
      }
    )
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    setSelectedIndex(-1)

    // Clear previous debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Debounce the API call
    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(newValue)
    }, 300)

    // Update parent immediately for simple text input fallback
    onChange(newValue)
  }

  const handleSelectSuggestion = (suggestion: google.maps.places.AutocompletePrediction) => {
    const selectedValue = suggestion.description
    setInputValue(selectedValue)
    onChange(selectedValue)
    setIsOpen(false)
    setSuggestions([])
    setSelectedIndex(-1)
    inputRef.current?.blur()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSelectSuggestion(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  return (
    <div 
      ref={wrapperRef}
      className={`
        relative px-3 py-2.5 rounded-lg border transition-all duration-300
        ${isHighlighted 
          ? 'bg-violet-500/20 border-violet-500/50 shadow-[0_0_15px_rgba(139,92,246,0.3)]' 
          : 'bg-white/[0.02] border-white/[0.06]'
        }
        ${className}
      `}
    >
      {/* Highlight glow effect */}
      {isHighlighted && (
        <div className="absolute inset-0 rounded-lg bg-violet-500/10 animate-pulse" />
      )}

      <div className="relative">
        <div className={`flex items-center gap-2 mb-1.5 ${isHighlighted ? 'text-violet-400' : 'text-white/40'}`}>
          <MapPin className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">Localisation</span>
          {isLoading && (
            <Loader2 className="w-3 h-3 ml-auto animate-spin" />
          )}
          {isHighlighted && !isLoading && (
            <span className="ml-auto flex items-center gap-1 text-[10px] text-violet-400">
              <Check className="w-3 h-3" />
              Modifié
            </span>
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setIsOpen(true)
            }
          }}
          placeholder={placeholder}
          className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.08] rounded-md text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.08] transition-all"
          autoComplete="off"
        />

        {/* Dropdown suggestions */}
        {isOpen && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-[#1a1a1a] border border-white/[0.08] rounded-lg shadow-xl overflow-hidden">
            <ul className="max-h-64 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <li
                  key={suggestion.place_id}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  className={`
                    px-3 py-2 cursor-pointer transition-colors text-sm
                    ${index === selectedIndex 
                      ? 'bg-violet-500/20 text-violet-400' 
                      : 'text-white/80 hover:bg-white/[0.05]'
                    }
                  `}
                >
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-white/40" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {suggestion.structured_formatting.main_text}
                      </div>
                      <div className="text-xs text-white/50 truncate">
                        {suggestion.structured_formatting.secondary_text}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

