/**
 * EnerGency - Enhanced Emergency Preparedness Dashboard
 * Interactive map with disaster preparedness metrics and energy management insights
 */

import { useEffect, useMemo, useState } from 'react'
import RealMapView from './components/RealMapView'
import LayerControls from './components/LayerControls'
import { MapLayerConfig } from './types/emergencyMetrics'
import TimeSlider from './components/TimeSlider'
import AIModelsReport from './components/AIModelsReport'
import { LocationOption } from './types/locationSearch'
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
  const [layers, setLayers] = useState<MapLayerConfig[]>([
    {
      id: 'county-choropleth',
      name: 'County Readiness Pressure',
      enabled: false,
      type: 'choropleth',
      dataKey: 'overallStressScore',
      color: '#b91c1c',
      category: 'emergency'
    },
    {
      id: 'forecast-pressure',
      name: 'AI Forecast (2020-2050 Outlook)',
      enabled: true,
      type: 'choropleth',
      dataKey: 'overallStressScore',
      color: '#1d4ed8',
      category: 'emergency'
    },
    {
      id: 'disaster-stress',
      name: 'Disaster Exposure Level',
      enabled: false,
      type: 'choropleth',
      dataKey: 'disasterStressScore',
      color: '#f97316',
      category: 'emergency'
    },
    {
      id: 'energy-reliability',
      name: 'Energy Reliability Watchlist',
      enabled: false,
      type: 'symbols',
      dataKey: 'energyStressScore',
      color: '#2563eb',
      icon: '⚡',
      category: 'energy'
    },
    {
      id: 'recovery-needs',
      name: 'Disaster Recovery Needs',
      enabled: false,
      type: 'symbols',
      dataKey: 'disasterStressScore',
      color: '#f97316',
      icon: '🛠️',
      category: 'emergency'
    },
    {
      id: 'infrastructure-priority',
      name: 'Critical Infrastructure Safeguards',
      enabled: false,
      type: 'symbols',
      dataKey: 'overallStressScore',
      color: '#7c3aed',
      icon: '🏥',
      category: 'emergency'
    },
    {
      id: 'county-pricing',
      name: 'County-Level Pricing Signals',
      enabled: false,
      type: 'symbols',
      dataKey: 'overallStressScore',
      color: '#0f766e',
      icon: '💵',
      category: 'energy'
    },
    {
      id: 'manufacturing-hubs',
      name: 'Manufacturing & Data Center Hubs',
      enabled: false,
      type: 'symbols',
      dataKey: 'energyStressScore',
      color: '#0f172a',
      icon: '🏭',
      category: 'energy'
    },
    {
      id: 'agriculture-supply',
      name: 'Agriculture & Food Supply Chains',
      enabled: false,
      type: 'symbols',
      dataKey: 'disasterStressScore',
      color: '#16a34a',
      icon: '🌾',
      category: 'emergency'
    },
    {
      id: 'water-systems',
      name: 'Water System Reliability Risks',
      enabled: false,
      type: 'symbols',
      dataKey: 'disasterStressScore',
      color: '#0284c7',
      icon: '💧',
      category: 'emergency'
    },
    {
      id: 'first-responders',
      name: 'First Responder & Hospital Hubs',
      enabled: false,
      type: 'symbols',
      dataKey: 'overallStressScore',
      color: '#7c3aed',
      icon: '🚓',
      category: 'emergency'
    },
    {
      id: 'new-projects',
      name: '2050 New Energy Projects 💡',
      enabled: false,
      type: 'symbols',
      dataKey: 'overallStressScore',
      color: '#facc15',
      icon: '💡',
      category: 'energy'
    },
    {
      id: 'storage-sites',
      name: '2050 Storage Sites 🔋',
      enabled: false,
      type: 'symbols',
      dataKey: 'overallStressScore',
      color: '#22c55e',
      icon: '🔋',
      category: 'energy'
    },
    {
      id: 'nightlight-points',
      name: 'Local Energy Activity',
      enabled: false,
      type: 'symbols',
      dataKey: 'isTopStressed',
      color: '#38bdf8',
      category: 'energy'
    },
    {
      id: 'top-stressed',
      name: 'Priority Action Counties (⚠️)',
      enabled: true,
      type: 'symbols',
      dataKey: 'isTopStressed',
      color: '#b91c1c',
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
      setGpsStatus('GPS is not available in this browser.')
      return
    }
    setGpsStatus('Requesting location permission...')
    navigator.geolocation.getCurrentPosition(
      position => {
        setGpsCoordinates([position.coords.latitude, position.coords.longitude])
        setGpsStatus('Location detected. Centering the map now.')
      },
      error => {
        if (error.code === error.PERMISSION_DENIED) {
          setGpsStatus('Location permission denied. You can still search by name.')
        } else {
          setGpsStatus('Unable to detect location. Try again or search by name.')
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
      if (value >= 80) return '#1e3a8a'
      if (value >= 60) return '#1d4ed8'
      if (value >= 40) return '#38bdf8'
      if (value >= 20) return '#bae6fd'
      return '#e0f2fe'
    }
    if (value >= 80) return '#991b1b'
    if (value >= 60) return '#dc2626'
    if (value >= 40) return '#f97316'
    if (value >= 20) return '#93c5fd'
    return '#1d4ed8'
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
      <header className="app-header-enhanced">
        <div className="header-top">
          <div className="header-content">
            <h1>🇺🇸 EnerGency</h1>
            <p className="header-subtitle">
              Energy reliability, local control, and community readiness intelligence
            </p>
            <div className="header-actions">
              <a className="header-link" href="/AI-models">AI Models Report</a>
            </div>
          </div>
          {!isMobile && (
            <div className="header-timeline header-timeline-inline">
              <div className="header-timeline-label">Timeline to 2035</div>
              <TimeSlider
                minDate={new Date(2020, 0, 1)}
                maxDate={new Date(2035, 11, 31)}
                currentDate={currentDate}
                onDateChange={setCurrentDate}
                stepSize="month"
                className="time-slider--inline"
              />
            </div>
          )}
          {activeChoroplethLayer && (
            <div className="header-legend">
              <div className="legend-title">{activeChoroplethLayer.name}</div>
              <div className="legend-gradient">
                <div className="legend-gradient-bar" style={{
                  background: `linear-gradient(to right, ${getLegendColor(0, activeChoroplethLayer.id)}, ${getLegendColor(50, activeChoroplethLayer.id)}, ${getLegendColor(100, activeChoroplethLayer.id)})`
                }} />
                <div className="legend-gradient-labels">
                  <span>Low</span>
                  <span>Medium</span>
                  <span>High</span>
                </div>
              </div>
              <div className="legend-metadata">
                <strong>Forecast Date:</strong> {currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </div>
              <div className="legend-metadata">
                <strong>Data Sources:</strong> FEMA, NOAA, EIA, Census, VIIRS
              </div>
            </div>
          )}
        </div>
        <div className="header-controls">
          <div className="control-group">
            <label>Geographic Level:</label>
            <select
              value={geoLevel}
              onChange={(e) => setGeoLevel(e.target.value as GeographicLevel)}
              className="select-control"
            >
              <option value="state">State</option>
              <option value="county">County</option>
              <option value="city">City</option>
              <option value="zip-code">ZIP Code</option>
              <option value="census-tract">Census Tract</option>
            </select>
          </div>
          <div className="control-group search-group">
            <label>Location Search:</label>
            <div className="search-input-group">
              <input
                className="search-input"
                type="text"
                placeholder="Search state or county"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearchSubmit()
                  }
                }}
              />
              <button className="search-button" onClick={handleSearchSubmit} type="button">
                Go
              </button>
              <button className="gps-button" onClick={handleGpsLookup} type="button" aria-label="Use GPS location">
                📍
              </button>
            </div>
            {searchSuggestions.length > 0 && (
              <ul className="search-suggestions">
                {searchSuggestions.map(option => (
                  <li key={option.id}>
                    <button type="button" onClick={() => handleSearchSelect(option)}>
                      <span className="suggestion-title">{option.label}</span>
                      <span className="suggestion-tag">{option.type}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {gpsStatus && (
              <div className="gps-status">{gpsStatus}</div>
            )}
          </div>
        </div>
      </header>

      <div className="app-content-enhanced">
        <div className="info-panel">
          <div className="info-card">
            <LayerControls
              layers={layers}
              onLayerToggle={handleLayerToggle}
            />
          </div>

          <div className="info-card">
            <h3>
              🤖 AI Forecast Studio
              <span className="info-icon" title="Model design and governance summary.">i</span>
            </h3>
            <p>
              The forecasting stack blends weather risk, grid stress, and community resilience signals
              to prioritize preparedness actions. Each model is validated on holdout data and scored
              for stability across rural, suburban, and metro counties.
            </p>
            <ul className="metrics-list">
              <li><strong>Models used:</strong> Regression baseline, reinforcement learning, gradient boosting</li>
              <li><strong>Signals:</strong> Disaster exposure, demand load, migration balance, terrain slope</li>
              <li><strong>Outputs:</strong> Readiness pressure, investment timing, storage need score</li>
            </ul>
          </div>

          <div className="info-card">
            <h3>
              🧠 2050 Forecast & Recommendations
              <span className="info-icon" title="AI-assisted guidance for long-term investments.">i</span>
            </h3>
            <p>
              The forecast highlights counties that should prepare for new energy projects 💡
              and disaster-ready storage 🔋. Recommendations prioritize reliable power,
              resilient supply chains, and protection for seniors, veterans, and critical services.
            </p>
          </div>

          <div className="info-card">
            <h3>
              📚 Datasets & Sources
              <span className="info-icon" title="Public, transparent datasets used for AI training.">i</span>
            </h3>
            <ul className="sources-list">
              <li>NOAA Storm Events Database</li>
              <li>FEMA Disaster Declarations</li>
              <li>U.S. Energy Information Administration (EIA)</li>
              <li>U.S. Census Bureau Migration Data</li>
              <li>DOE LEAD Tool + VIIRS Nighttime Lights</li>
            </ul>
          </div>

          <div className="info-card">
            <h3>
              📊 About This Dashboard
              <span className="info-icon" title="Designed for clear, common-sense planning.">i</span>
            </h3>
            <p>
              EnerGency delivers clear, accountable readiness insights for communities across
              America. Measure disaster exposure, infrastructure strength, and energy
              independence to support local decision-making, fiscal discipline, and
              responsible stewardship.
            </p>
          </div>

          <div className="info-card">
            <h3>
              📈 Available Metrics
              <span className="info-icon" title="Hover over counties for detailed metrics.">i</span>
            </h3>
            <ul className="metrics-list">
              <li><strong>Natural Disasters:</strong> Storm events, FEMA declarations, damage estimates</li>
              <li><strong>Energy Independence:</strong> Local capacity, reliability, and demand load</li>
              <li><strong>Household Burden:</strong> Share of income spent on power</li>
              <li><strong>Community Stability:</strong> Migration trends and local retention</li>
              <li><strong>Critical Infrastructure:</strong> Exposure for schools, hospitals, and services</li>
            </ul>
          </div>

          <div className="info-card">
            <h3>
              🧭 Problem Statement
              <span className="info-icon" title="Why the tool matters for emergency readiness.">i</span>
            </h3>
            <p>
              Extreme weather and rapid population shifts create localized demand spikes that
              overwhelm a grid built for more predictable patterns. Without early forecasting,
              communities face blackouts, delayed response, and costly recoveries.
            </p>
          </div>

          <div className="info-card stress-levels">
            <h3>⚡ Readiness Levels</h3>
            <div className="stress-level" style={{ borderLeft: '4px solid #1d4ed8' }}>
              <strong>Low:</strong> Strong readiness and stable conditions
            </div>
            <div className="stress-level" style={{ borderLeft: '4px solid #0ea5e9' }}>
              <strong>Moderate:</strong> Watch list, proactive planning advised
            </div>
            <div className="stress-level" style={{ borderLeft: '4px solid #f97316' }}>
              <strong>High:</strong> Elevated risk, readiness actions needed
            </div>
            <div className="stress-level" style={{ borderLeft: '4px solid #b91c1c' }}>
              <strong>Critical:</strong> Severe conditions, immediate action required
            </div>
          </div>

          <div className="info-card">
            <h3>
              🎯 How to Use
              <span className="info-icon" title="Clear steps for first-time users.">i</span>
            </h3>
            <ul className="usage-list">
              <li>Toggle layers using the <strong>Map Layers</strong> panel</li>
              <li>Hover over areas to see detailed metrics</li>
              <li>Use the <strong>timeline</strong> to view 2035 projections</li>
              <li>⚠️ symbols mark priority action areas</li>
              <li>Color intensity shows readiness severity</li>
            </ul>
          </div>

          <div className="info-card">
            <h3>
              🏛️ Community Priorities
              <span className="info-icon" title="Focus on families, farms, and local jobs.">i</span>
            </h3>
            <ul className="sources-list">
              <li>Support first responders, veterans, and critical services</li>
              <li>Protect families, farms, and small businesses</li>
              <li>Promote energy reliability with fair household costs</li>
              <li>Strengthen local control and public accountability</li>
            </ul>
          </div>

          <div className="info-card faq-card">
            <h3>
              ❓ FAQ
              <span className="info-icon" title="Quick answers for first-time visitors.">i</span>
            </h3>
            <dl className="faq-list">
              <div>
                <dt>How is the AI forecast built?</dt>
                <dd>We combine disaster history, grid stress, and migration trends to model readiness pressure.</dd>
              </div>
              <div>
                <dt>Is this a real-time tool?</dt>
                <dd>It is a planning dashboard for preparedness, updated with public datasets.</dd>
              </div>
              <div>
                <dt>What should I click first?</dt>
                <dd>Start with the timeline and 2050 overlays for a quick future view.</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="map-container">
          <RealMapView
            geoLevel={geoLevel}
            selectedState={selectedState}
            layers={layers}
            currentDate={currentDate}
            searchQuery={committedSearch}
            gpsCoordinates={gpsCoordinates}
            onLocationOptionsChange={setLocationOptions}
          />
          {isMobile && (
            <div className="timeline-mobile">
              <div className="timeline-mobile-label">Timeline to 2035</div>
              <TimeSlider
                minDate={new Date(2020, 0, 1)}
                maxDate={new Date(2035, 11, 31)}
                currentDate={currentDate}
                onDateChange={setCurrentDate}
                stepSize="month"
                className="time-slider--inline"
              />
            </div>
          )}
        </div>
      </div>

      <footer className="app-footer">
        <p>
          Built with transparent public data for local leaders and community members |{' '}
          <a href="/AI-models">View AI Models Report</a>
        </p>
      </footer>
        </>
      )}
    </div>
  )
}

export default AppEnhanced
