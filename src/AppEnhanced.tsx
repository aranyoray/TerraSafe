/**
 * TerraSafe — Extreme Weather Energy Preparedness Platform
 * Full-screen map dashboard with floating controls
 */

import { useEffect, useMemo, useState } from 'react'
import RealMapView from './components/RealMapView'
import LayerControls from './components/LayerControls'
import { MapLayerConfig } from './types/emergencyMetrics'
import TimeSlider from './components/TimeSlider'
import AIModelsReport from './components/AIModelsReport'
import { LocationOption } from './types/locationSearch'
import { Search, MapPin, Layers, BarChart3, Shield, Menu, X } from 'lucide-react'
import './App.css'
import './AppEnhanced.css'

export type GeographicLevel = 'census-tract' | 'zip-code' | 'county' | 'city' | 'state'

const STATE_ABBREVIATIONS = [
  'All States', 'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI',
  'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND',
  'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA',
  'WA', 'WV', 'WI', 'WY'
]

const NATIONAL_OPTION: LocationOption = {
  id: 'all-states',
  label: 'Nationwide (All States)',
  type: 'state'
}

function AppEnhanced() {
  const [geoLevel, setGeoLevel] = useState<GeographicLevel>('county')
  const [selectedState, setSelectedState] = useState<string | undefined>(undefined)
  const [currentDate, setCurrentDate] = useState(new Date(2030, 0, 1))
  const [isMobile, setIsMobile] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [committedSearch, setCommittedSearch] = useState('')
  const [locationOptions, setLocationOptions] = useState<LocationOption[]>([])
  const [gpsStatus, setGpsStatus] = useState<string | null>(null)
  const [gpsCoordinates, setGpsCoordinates] = useState<[number, number] | null>(null)
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname)
  const [menuOpen, setMenuOpen] = useState(false)
  const [layers, setLayers] = useState<MapLayerConfig[]>([
    {
      id: 'forecast-pressure',
      name: 'Predictive Outage Risk',
      enabled: true,
      type: 'choropleth',
      dataKey: 'overallStressScore',
      color: '#06b6d4',
      category: 'emergency'
    },
    {
      id: 'county-choropleth',
      name: 'Grid Vulnerability Index',
      enabled: false,
      type: 'choropleth',
      dataKey: 'overallStressScore',
      color: '#ef4444',
      category: 'emergency'
    },
    {
      id: 'disaster-stress',
      name: 'Historical Disaster Exposure',
      enabled: false,
      type: 'choropleth',
      dataKey: 'disasterStressScore',
      color: '#f97316',
      category: 'emergency'
    },
    {
      id: 'top-stressed',
      name: 'Priority Action Counties',
      enabled: true,
      type: 'symbols',
      dataKey: 'isTopStressed',
      color: '#ef4444',
      icon: '⚠️',
      category: 'emergency'
    }
  ])

  const handleLayerToggle = (layerId: string, enabled: boolean) => {
    setLayers(prevLayers =>
      prevLayers.map(layer => {
        if (layer.id === layerId) {
          return { ...layer, enabled }
        }
        if (enabled && layer.type === 'choropleth' && layer.id !== layerId) {
          return { ...layer, enabled: false }
        }
        return layer
      })
    )
  }

  const normalizeText = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()

  const fuzzyScore = (query: string, candidate: string) => {
    const normalizedQuery = normalizeText(query)
    const normalizedCandidate = normalizeText(candidate)
    if (!normalizedQuery || !normalizedCandidate) return 0
    if (normalizedCandidate.includes(normalizedQuery)) {
      return 0.9 + Math.min(0.1, normalizedQuery.length / normalizedCandidate.length)
    }
    let score = 0
    let queryIndex = 0
    for (let i = 0; i < normalizedCandidate.length && queryIndex < normalizedQuery.length; i += 1) {
      if (normalizedCandidate[i] === normalizedQuery[queryIndex]) {
        score += 1
        queryIndex += 1
      }
    }
    return score / normalizedCandidate.length
  }

  const stateOptions: LocationOption[] = useMemo(() => (
    STATE_ABBREVIATIONS
      .filter(state => state !== 'All States')
      .map(state => ({
        id: `state-${state}`,
        label: `${state} (State)`,
        type: 'state',
        state
      }))
  ), [])

  const combinedOptions = useMemo(() => [NATIONAL_OPTION, ...stateOptions, ...locationOptions], [
    stateOptions,
    locationOptions
  ])

  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return []
    return combinedOptions
      .map(option => ({
        option,
        score: fuzzyScore(searchQuery, option.label)
      }))
      .filter(({ score }) => score > 0.15)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map(({ option }) => option)
  }, [combinedOptions, searchQuery])

  const handleSearchSelect = (option: LocationOption) => {
    setSearchQuery(option.label)
    if (option.type === 'state') {
      setSelectedState(option.state)
      setGeoLevel('state')
      setCommittedSearch('')
    }
    if (option.type === 'county') {
      setSelectedState(option.state)
      setGeoLevel('county')
      setCommittedSearch(option.label)
    }
  }

  const handleSearchSubmit = () => {
    if (!searchQuery.trim()) return
    if (searchSuggestions.length > 0) {
      handleSearchSelect(searchSuggestions[0])
      return
    }
    setCommittedSearch(searchQuery.trim())
  }

  const handleGpsLookup = () => {
    if (!navigator.geolocation) {
      setGpsStatus('Geolocation not available in this browser.')
      return
    }
    setGpsStatus('Acquiring location...')
    navigator.geolocation.getCurrentPosition(
      position => {
        setGpsCoordinates([position.coords.latitude, position.coords.longitude])
        setGpsStatus('Location acquired. Centering map.')
      },
      error => {
        if (error.code === error.PERMISSION_DENIED) {
          setGpsStatus('Location access denied. Search by name instead.')
        } else {
          setGpsStatus('Location unavailable. Try searching by name.')
        }
      }
    )
  }

  useEffect(() => {
    if (!searchQuery.trim()) {
      setCommittedSearch('')
    }
  }, [searchQuery])

  const activeChoroplethLayer = layers.find(layer => layer.enabled && layer.type === 'choropleth')

  const getLegendColor = (value: number) => {
    if (value >= 80) return '#dc2626'
    if (value >= 60) return '#ea580c'
    if (value >= 40) return '#d97706'
    if (value >= 20) return '#14b8a6'
    return '#0d9488'
  }

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname)
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)')
    const handleChange = () => setIsMobile(mediaQuery.matches)
    handleChange()
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return (
    <div className="app">
      {currentPath === '/AI-models' ? (
        <AIModelsReport />
      ) : (
        <>
      {/* Floating Navigation Bar */}
      <nav className="ts-navbar">
        <button
          className="ts-menu-btn"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        <div className="ts-navbar-brand">
          <Shield size={18} className="ts-logo-icon" />
          <span className="ts-logo-text">Terra<span className="ts-logo-accent">Safe</span></span>
        </div>

        <div className="ts-navbar-center">
          <a className="ts-nav-item ts-nav-active" href="/">
            <Layers size={14} />
            <span>Dashboard</span>
          </a>
          <a className="ts-nav-item" href="/AI-models">
            <BarChart3 size={14} />
            <span>Models</span>
          </a>
        </div>

        <div className="ts-navbar-right">
          {!isMobile && (
            <div className="ts-geo-select">
              <select
                value={geoLevel}
                onChange={(e) => setGeoLevel(e.target.value as GeographicLevel)}
                className="ts-select"
              >
                <option value="state">State</option>
                <option value="county">County</option>
                <option value="city">City</option>
                <option value="zip-code">ZIP Code</option>
                <option value="census-tract">Census Tract</option>
              </select>
            </div>
          )}
          <div className="ts-search-wrapper">
            <Search size={14} className="ts-search-icon" />
            <input
              className="ts-search-input"
              type="text"
              placeholder="Search location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearchSubmit()
              }}
            />
            <button className="ts-gps-btn" onClick={handleGpsLookup} type="button" aria-label="Use GPS location">
              <MapPin size={14} />
            </button>
            {searchSuggestions.length > 0 && (
              <ul className="ts-search-suggestions">
                {searchSuggestions.map(option => (
                  <li key={option.id}>
                    <button type="button" onClick={() => handleSearchSelect(option)}>
                      <span className="ts-suggestion-label">{option.label}</span>
                      <span className="ts-suggestion-type">{option.type}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {gpsStatus && <div className="ts-gps-status">{gpsStatus}</div>}
        </div>
      </nav>

      {/* Menu Panel (replaces sidebar) */}
      {menuOpen && (
        <>
          <div className="ts-menu-backdrop" onClick={() => setMenuOpen(false)} />
          <div className="ts-menu-panel">
            <LayerControls
              layers={layers}
              onLayerToggle={handleLayerToggle}
            />

            {activeChoroplethLayer && (
              <div className="ts-legend-card">
                <div className="ts-legend-title">{activeChoroplethLayer.name}</div>
                <div className="ts-legend-gradient">
                  <div className="ts-legend-bar" style={{
                    background: `linear-gradient(to right, ${getLegendColor(0)}, ${getLegendColor(40)}, ${getLegendColor(70)}, ${getLegendColor(100)})`
                  }} />
                  <div className="ts-legend-labels">
                    <span>Low Risk</span>
                    <span>Moderate</span>
                    <span>Critical</span>
                  </div>
                </div>
                <div className="ts-legend-meta">
                  Forecast: {currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </div>
                <div className="ts-legend-meta">
                  Sources: FEMA, NOAA, EIA, Census, VIIRS
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Full-Screen Map */}
      <div className="ts-main">
        <div className="ts-map-container">
          <RealMapView
            geoLevel={geoLevel}
            selectedState={selectedState}
            layers={layers}
            currentDate={currentDate}
            searchQuery={committedSearch}
            gpsCoordinates={gpsCoordinates}
            onLocationOptionsChange={setLocationOptions}
          />

          {/* Floating Legend (bottom-left, always visible when choropleth active) */}
          {!menuOpen && activeChoroplethLayer && (
            <div className="ts-floating-legend">
              <div className="ts-legend-bar" style={{
                background: `linear-gradient(to right, ${getLegendColor(0)}, ${getLegendColor(40)}, ${getLegendColor(70)}, ${getLegendColor(100)})`
              }} />
              <div className="ts-legend-labels">
                <span>Low</span>
                <span>Critical</span>
              </div>
            </div>
          )}

          {/* Timeline Slider */}
          <div className="ts-timeline-float">
            <div className="ts-timeline-label">Forecast Timeline</div>
            <TimeSlider
              minDate={new Date(2020, 0, 1)}
              maxDate={new Date(2050, 11, 31)}
              currentDate={currentDate}
              onDateChange={setCurrentDate}
              stepSize="month"
              className="time-slider--inline"
            />
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  )
}

export default AppEnhanced
