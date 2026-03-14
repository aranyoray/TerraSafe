/**
 * TerraSafe — Extreme Weather Energy Preparedness Platform
 * AI-powered climate resilience dashboard for community grid protection
 */

import { useEffect, useMemo, useState } from 'react'
import RealMapView from './components/RealMapView'
import LayerControls from './components/LayerControls'
import { MapLayerConfig } from './types/emergencyMetrics'
import TimeSlider from './components/TimeSlider'
import AIModelsReport from './components/AIModelsReport'
import { LocationOption } from './types/locationSearch'
import { ChevronLeft, ChevronRight, Search, MapPin, Layers, BarChart3, Shield, Zap, AlertTriangle, Info, HelpCircle, Target, Building2, Menu, X } from 'lucide-react'
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
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeInfoSection, setActiveInfoSection] = useState<string | null>(null)
  const [layers, setLayers] = useState<MapLayerConfig[]>([
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
      id: 'forecast-pressure',
      name: 'Predictive Outage Risk (2025–2050)',
      enabled: true,
      type: 'choropleth',
      dataKey: 'overallStressScore',
      color: '#06b6d4',
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
      id: 'energy-reliability',
      name: 'Grid Stress Watchlist',
      enabled: false,
      type: 'symbols',
      dataKey: 'energyStressScore',
      color: '#3b82f6',
      icon: '⚡',
      category: 'energy'
    },
    {
      id: 'recovery-needs',
      name: 'Post-Disaster Recovery Zones',
      enabled: false,
      type: 'symbols',
      dataKey: 'disasterStressScore',
      color: '#f97316',
      icon: '🛠️',
      category: 'emergency'
    },
    {
      id: 'infrastructure-priority',
      name: 'Critical Facility Protection',
      enabled: false,
      type: 'symbols',
      dataKey: 'overallStressScore',
      color: '#8b5cf6',
      icon: '🏥',
      category: 'emergency'
    },
    {
      id: 'county-pricing',
      name: 'Demand-Response Pricing Zones',
      enabled: false,
      type: 'symbols',
      dataKey: 'overallStressScore',
      color: '#14b8a6',
      icon: '💵',
      category: 'energy'
    },
    {
      id: 'manufacturing-hubs',
      name: 'Industrial Load Centers',
      enabled: false,
      type: 'symbols',
      dataKey: 'energyStressScore',
      color: '#64748b',
      icon: '🏭',
      category: 'energy'
    },
    {
      id: 'agriculture-supply',
      name: 'Agricultural Supply Chain Risk',
      enabled: false,
      type: 'symbols',
      dataKey: 'disasterStressScore',
      color: '#22c55e',
      icon: '🌾',
      category: 'emergency'
    },
    {
      id: 'water-systems',
      name: 'Water Infrastructure Risk',
      enabled: false,
      type: 'symbols',
      dataKey: 'disasterStressScore',
      color: '#0ea5e9',
      icon: '💧',
      category: 'emergency'
    },
    {
      id: 'first-responders',
      name: 'Emergency Services Hubs',
      enabled: false,
      type: 'symbols',
      dataKey: 'overallStressScore',
      color: '#8b5cf6',
      icon: '🚓',
      category: 'emergency'
    },
    {
      id: 'new-projects',
      name: 'Resilience Infrastructure Pipeline',
      enabled: false,
      type: 'symbols',
      dataKey: 'overallStressScore',
      color: '#eab308',
      icon: '💡',
      category: 'energy'
    },
    {
      id: 'storage-sites',
      name: 'Battery Storage Candidates',
      enabled: false,
      type: 'symbols',
      dataKey: 'overallStressScore',
      color: '#22c55e',
      icon: '🔋',
      category: 'energy'
    },
    {
      id: 'nightlight-points',
      name: 'Satellite Energy Activity',
      enabled: false,
      type: 'symbols',
      dataKey: 'isTopStressed',
      color: '#38bdf8',
      category: 'energy'
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

  const getLegendColor = (value: number, layerId?: string) => {
    if (layerId === 'forecast-pressure') {
      if (value >= 80) return '#0e7490'
      if (value >= 60) return '#06b6d4'
      if (value >= 40) return '#22d3ee'
      if (value >= 20) return '#67e8f9'
      return '#a5f3fc'
    }
    if (value >= 80) return '#991b1b'
    if (value >= 60) return '#dc2626'
    if (value >= 40) return '#f97316'
    if (value >= 20) return '#38bdf8'
    return '#06b6d4'
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

  const toggleInfoSection = (id: string) => {
    setActiveInfoSection(prev => prev === id ? null : id)
  }

  return (
    <div className="app">
      {currentPath === '/AI-models' ? (
        <AIModelsReport />
      ) : (
        <>
      {/* Floating Navigation Bar */}
      <nav className="ts-navbar">
        <div className="ts-navbar-brand">
          <Shield size={20} className="ts-logo-icon" />
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

      {/* Main Content */}
      <div className="ts-main">
        {/* Sidebar Toggle */}
        <button
          className="ts-sidebar-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label={sidebarOpen ? 'Close panel' : 'Open panel'}
        >
          {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>

        {/* Side Panel */}
        {sidebarOpen && (
          <aside className="ts-sidebar">
            <div className="ts-sidebar-header">
              <h2>Control Panel</h2>
            </div>

            <div className="ts-sidebar-content">
              {/* Layer Controls */}
              <div className="ts-panel-card">
                <LayerControls
                  layers={layers}
                  onLayerToggle={handleLayerToggle}
                />
              </div>

              {/* Legend */}
              {activeChoroplethLayer && (
                <div className="ts-panel-card ts-legend-card">
                  <div className="ts-legend-title">{activeChoroplethLayer.name}</div>
                  <div className="ts-legend-gradient">
                    <div className="ts-legend-bar" style={{
                      background: `linear-gradient(to right, ${getLegendColor(0, activeChoroplethLayer.id)}, ${getLegendColor(50, activeChoroplethLayer.id)}, ${getLegendColor(100, activeChoroplethLayer.id)})`
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

              {/* Collapsible Info Sections */}
              <div className="ts-panel-card ts-info-section">
                <button className="ts-info-toggle" onClick={() => toggleInfoSection('forecast')}>
                  <span><Target size={14} /> Predictive Modeling</span>
                  <span className="ts-chevron">{activeInfoSection === 'forecast' ? '−' : '+'}</span>
                </button>
                {activeInfoSection === 'forecast' && (
                  <div className="ts-info-body">
                    <p>
                      TerraSafe's forecasting engine combines climate projections, historical grid data,
                      population migration patterns, and critical facility mapping to predict county-level
                      outage probability under extreme weather scenarios.
                    </p>
                    <ul>
                      <li><strong>Models:</strong> Gradient boosting, spatial clustering, regression ensemble</li>
                      <li><strong>Signals:</strong> Disaster exposure, demand load, migration, terrain</li>
                      <li><strong>Output:</strong> Outage probability, intervention priority, storage needs</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="ts-panel-card ts-info-section">
                <button className="ts-info-toggle" onClick={() => toggleInfoSection('resilience')}>
                  <span><Shield size={14} /> Resilience Toolkit</span>
                  <span className="ts-chevron">{activeInfoSection === 'resilience' ? '−' : '+'}</span>
                </button>
                {activeInfoSection === 'resilience' && (
                  <div className="ts-info-body">
                    <p>
                      The platform identifies where the grid will fail before failures happen,
                      generating county-level action plans for grid reinforcement, backup power
                      pre-positioning, and microgrid isolation.
                    </p>
                    <p>
                      Recommendations prioritize hospitals, shelters, tribal clinics, VA facilities,
                      and cooling centers serving the most vulnerable populations.
                    </p>
                  </div>
                )}
              </div>

              <div className="ts-panel-card ts-info-section">
                <button className="ts-info-toggle" onClick={() => toggleInfoSection('data')}>
                  <span><BarChart3 size={14} /> Data Sources</span>
                  <span className="ts-chevron">{activeInfoSection === 'data' ? '−' : '+'}</span>
                </button>
                {activeInfoSection === 'data' && (
                  <div className="ts-info-body">
                    <ul className="ts-source-list">
                      <li>NOAA Storm Events Database</li>
                      <li>FEMA Disaster Declarations (OpenFEMA API v2)</li>
                      <li>U.S. Energy Information Administration (EIA)</li>
                      <li>U.S. Census Bureau Migration Data</li>
                      <li>DOE LEAD Tool</li>
                      <li>VIIRS Nighttime Satellite Imagery</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="ts-panel-card ts-info-section">
                <button className="ts-info-toggle" onClick={() => toggleInfoSection('about')}>
                  <span><Info size={14} /> About TerraSafe</span>
                  <span className="ts-chevron">{activeInfoSection === 'about' ? '−' : '+'}</span>
                </button>
                {activeInfoSection === 'about' && (
                  <div className="ts-info-body">
                    <p>
                      TerraSafe is an AI-powered resilience dashboard that helps communities maintain
                      energy reliability before, during, and after climate-driven extreme weather events.
                      It translates complex grid and climate data into concrete, localized preparedness
                      decisions.
                    </p>
                    <div className="ts-risk-levels">
                      <div className="ts-risk-level" data-level="low">
                        <span className="ts-risk-dot" style={{ background: '#06b6d4' }} />
                        <span><strong>Low</strong> — Stable grid, standard monitoring</span>
                      </div>
                      <div className="ts-risk-level" data-level="moderate">
                        <span className="ts-risk-dot" style={{ background: '#f59e0b' }} />
                        <span><strong>Moderate</strong> — Proactive planning advised</span>
                      </div>
                      <div className="ts-risk-level" data-level="high">
                        <span className="ts-risk-dot" style={{ background: '#f97316' }} />
                        <span><strong>High</strong> — Reinforce feeders, pre-position backup power</span>
                      </div>
                      <div className="ts-risk-level" data-level="critical">
                        <span className="ts-risk-dot" style={{ background: '#ef4444' }} />
                        <span><strong>Critical</strong> — Immediate intervention required</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="ts-panel-card ts-info-section">
                <button className="ts-info-toggle" onClick={() => toggleInfoSection('problem')}>
                  <span><AlertTriangle size={14} /> Problem Statement</span>
                  <span className="ts-chevron">{activeInfoSection === 'problem' ? '−' : '+'}</span>
                </button>
                {activeInfoSection === 'problem' && (
                  <div className="ts-info-body">
                    <p>
                      Climate change is making weather events more extreme and frequent, directly
                      threatening energy systems communities depend on. Heat waves spike demand beyond
                      grid capacity. Storms destroy transmission infrastructure. Floods cause electrical
                      fires and extended outages.
                    </p>
                    <p>
                      Today, energy data is fragmented across agencies and analyzed only after the fact.
                      Decision-makers lack tools to see crises coming. TerraSafe bridges this gap with
                      predictive, AI-powered situational awareness.
                    </p>
                  </div>
                )}
              </div>

              <div className="ts-panel-card ts-info-section">
                <button className="ts-info-toggle" onClick={() => toggleInfoSection('equity')}>
                  <span><Building2 size={14} /> Equity Priorities</span>
                  <span className="ts-chevron">{activeInfoSection === 'equity' ? '−' : '+'}</span>
                </button>
                {activeInfoSection === 'equity' && (
                  <div className="ts-info-body">
                    <ul>
                      <li>Prioritize backup power for hospitals, shelters, and VA facilities</li>
                      <li>Protect Indigenous communities on remote or aging grids</li>
                      <li>Ensure cooling centers remain operational during heat waves</li>
                      <li>Target restoration resources to medically fragile populations first</li>
                      <li>Reduce energy burden for low-income households</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="ts-panel-card ts-info-section">
                <button className="ts-info-toggle" onClick={() => toggleInfoSection('faq')}>
                  <span><HelpCircle size={14} /> FAQ</span>
                  <span className="ts-chevron">{activeInfoSection === 'faq' ? '−' : '+'}</span>
                </button>
                {activeInfoSection === 'faq' && (
                  <div className="ts-info-body">
                    <div className="ts-faq-item">
                      <strong>How does the predictive model work?</strong>
                      <p>We combine disaster history, grid stress indicators, climate projections, and population dynamics using gradient boosting and spatial clustering to forecast outage risk.</p>
                    </div>
                    <div className="ts-faq-item">
                      <strong>Is this a real-time monitoring tool?</strong>
                      <p>TerraSafe is a planning and preparedness platform. It uses historical and projected data to identify future risk zones, enabling proactive resilience investments.</p>
                    </div>
                    <div className="ts-faq-item">
                      <strong>Who is this built for?</strong>
                      <p>Local governments, utility cooperatives, emergency managers, and community organizations seeking to protect critical infrastructure from climate-driven grid failures.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </aside>
        )}

        {/* Map Container */}
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

          {/* Timeline Slider - Floating at Bottom */}
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
