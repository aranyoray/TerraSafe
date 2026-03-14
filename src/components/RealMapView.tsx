/**
 * TerraSafe — Climate Resilience Platform
 * Real Map View Component with Actual Data
 * Uses real nighttime light data, county GeoJSON polygons, and FEMA disasters
 */

import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, GeoJSON, Tooltip, CircleMarker, Popup, useMap } from 'react-leaflet'
import { PathOptions } from 'leaflet'
import { MapLayerConfig } from '../types/emergencyMetrics'
import {
  loadAllRealData,
  EnrichedCountyData,
  filterCountiesByState
} from '../services/realDataAggregator'
import { NightlightFeature } from '../services/nightlightData'
import { LocationOption } from '../types/locationSearch'
import './EnhancedMapView.css'
import 'leaflet/dist/leaflet.css'

interface RealMapViewProps {
  geoLevel: 'census-tract' | 'zip-code' | 'county' | 'city' | 'state'
  selectedState?: string
  layers: MapLayerConfig[]
  currentDate: Date
  searchQuery?: string
  gpsCoordinates?: [number, number] | null
  onLocationOptionsChange?: (options: LocationOption[]) => void
}

interface ZipPlaceholder {
  id: string
  county: EnrichedCountyData
  coordinates: [number, number]
}

const RealMapView = ({
  geoLevel,
  selectedState,
  layers,
  currentDate,
  searchQuery,
  gpsCoordinates,
  onLocationOptionsChange
}: RealMapViewProps) => {
  const [counties, setCounties] = useState<EnrichedCountyData[]>([])
  const [nightlightData, setNightlightData] = useState<NightlightFeature[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCounty, setSelectedCounty] = useState<EnrichedCountyData | null>(null)
  const [searchTarget, setSearchTarget] = useState<EnrichedCountyData | null>(null)

  const normalizeCounty = (county: EnrichedCountyData): EnrichedCountyData => {
    const safePopulation = county.properties.totalPopulation ?? 50000
    const safeEnergy = county.properties.totalEnergyMW ?? 200
    const safeMetrics = county.emergencyMetrics ?? {
      disasterCount: 0,
      disasterTypes: [],
      mostRecentDisaster: null,
      disasterStressScore: 20,
      energyStressScore: 20,
      overallStressScore: 20,
      stressLevel: 'Low'
    }

    return {
      ...county,
      properties: {
        ...county.properties,
        totalPopulation: safePopulation,
        totalEnergyMW: safeEnergy,
        avgIntensity: county.properties.avgIntensity ?? 0.2,
        percentile: county.properties.percentile ?? 50
      },
      emergencyMetrics: {
        ...safeMetrics
      }
    }
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        const data = await loadAllRealData({
          state: selectedState,
          disasterYears: 5
        })

        const filteredCounties = selectedState
          ? filterCountiesByState(data.enrichedCounties, selectedState)
          : data.enrichedCounties
        const normalizedCounties = filteredCounties.map(normalizeCounty)

        const filteredNightlight = selectedState
          ? data.nightlight.features.filter(f => f.properties.state === selectedState)
          : data.nightlight.features.slice(0, 500)

        setCounties(normalizedCounties)
        setNightlightData(filteredNightlight)
      } catch (err) {
        console.error('Error loading data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [selectedState])

  useEffect(() => {
    if (!onLocationOptionsChange) return
    const options: LocationOption[] = counties.map(county => ({
      id: county.properties.fips,
      label: `${county.properties.name} County, ${county.properties.state}`,
      type: 'county',
      state: county.properties.state,
      fips: county.properties.fips
    }))
    onLocationOptionsChange(options)
  }, [counties, onLocationOptionsChange])

  const activeChoroplethLayer = layers.find(l => l.enabled && l.type === 'choropleth')
  const showNightlightPoints = layers.find(l => l.id === 'nightlight-points')?.enabled
  const showTopStressed = layers.find(l => l.id === 'top-stressed')?.enabled

  const clampScore = (value: number) => Math.max(0, Math.min(100, value))

  const getSeasonalAdjustment = (date: Date) => {
    const month = date.getMonth()
    if (month >= 5 && month <= 9) return 12
    if (month === 11 || month <= 1) return 9
    return 5
  }

  const getForecastScore = (county: EnrichedCountyData) => {
    const base = county.emergencyMetrics.overallStressScore
    const seasonal = getSeasonalAdjustment(currentDate)
    const trend = (currentDate.getFullYear() - 2000) * 1.2
    const disasterMomentum = Math.min(county.emergencyMetrics.disasterCount * 0.8, 10)
    return clampScore(base + seasonal + trend + disasterMomentum)
  }

  const getForecastLevel = (score: number) => {
    if (score >= 75) return 'Critical'
    if (score >= 50) return 'High'
    if (score >= 25) return 'Moderate'
    return 'Low'
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

  const getRiskColor = (value: number): string => {
    if (value >= 80) return '#dc2626'
    if (value >= 65) return '#ea580c'
    if (value >= 50) return '#d97706'
    if (value >= 35) return '#eab308'
    if (value >= 20) return '#14b8a6'
    return '#0d9488'
  }

  const getColor = (value: number, _layerId?: string): string => {
    return getRiskColor(value)
  }

  const getBorderColor = () => {
    switch (geoLevel) {
      case 'state':
        return '#334155'
      case 'city':
        return '#f97316'
      case 'zip-code':
        return '#16a34a'
      case 'census-tract':
        return '#7c3aed'
      case 'county':
      default:
        return '#1e293b'
    }
  }

  const getFallbackScore = (feature: any) => {
    const fallbackKey = String(
      feature?.properties?.fips ??
      feature?.properties?.GEOID ??
      feature?.properties?.geoid ??
      feature?.properties?.id ??
      ''
    )
    let hash = 0
    for (let i = 0; i < fallbackKey.length; i += 1) {
      hash = (hash * 31 + fallbackKey.charCodeAt(i)) % 101
    }
    return hash
  }

  const styleCounty = (feature: any): PathOptions => {
    const borderColor = getBorderColor()
    if (!activeChoroplethLayer) {
      return {
        fillColor: '#cccccc',
        weight: 1,
        opacity: 0.5,
        color: borderColor,
        fillOpacity: 0.3
      }
    }

    const county = counties.find(c => c.properties.fips === feature.properties.fips)
    if (!county) {
      const fallbackScore = getFallbackScore(feature)
      return {
        fillColor: getColor(fallbackScore, activeChoroplethLayer.id),
        weight: 1,
        opacity: 0.9,
        color: borderColor,
        fillOpacity: 0.6
      }
    }

    let value = 0
    if (activeChoroplethLayer.id === 'county-choropleth') {
      value = county.emergencyMetrics.overallStressScore
    } else if (activeChoroplethLayer.id === 'disaster-stress') {
      value = county.emergencyMetrics.disasterStressScore
    } else if (activeChoroplethLayer.id === 'forecast-pressure') {
      value = getForecastScore(county)
    }

    return {
      fillColor: getColor(value, activeChoroplethLayer.id),
      weight: 1,
      opacity: 1,
      color: borderColor,
      fillOpacity: 0.7
    }
  }

  const onEachCounty = (feature: any, layer: any) => {
    const county = counties.find(c => c.properties.fips === feature.properties.fips)
    if (!county) return

    const props = county.properties
    const metrics = county.emergencyMetrics
    const forecastScore = getForecastScore(county)
    const forecastLevel = getForecastLevel(forecastScore)
    const fipsValue = props.fips ? String(props.fips) : ''
    const stateFips = fipsValue ? fipsValue.slice(0, 2) : props.state

    const tooltipContent = (
      <div className="metric-tooltip">
        <h3>{props.name} County, {stateFips}</h3>
        <p><strong>Population:</strong> {props.totalPopulation.toLocaleString()}</p>
        <div className="metric-section">
          <h4>Risk Assessment — {currentDate.getFullYear()}</h4>
          <p><strong>Risk Level:</strong> {forecastLevel} ({forecastScore.toFixed(1)}/100)</p>
          <p><strong>Disaster Exposure:</strong> {metrics.disasterCount} declarations</p>
          <p><strong>Grid Stress:</strong> {metrics.overallStressScore.toFixed(1)}/100</p>
        </div>
      </div>
    )

    layer.on({
      click: () => {
        setSelectedCounty(county)
      }
    })
    layer.bindTooltip(tooltipContent, {
      sticky: true,
      opacity: 0.9
    })
  }

  const topStressedCounties = showTopStressed
    ? [...counties]
        .sort((a, b) => getForecastScore(b) - getForecastScore(a))
        .slice(0, 40)
    : []

  const zipPlaceholders = useMemo<ZipPlaceholder[]>(() => {
    if (geoLevel !== 'zip-code') return []
    return counties.flatMap(county => {
      const centroid = getCountyCentroid(county)
      if (!centroid) return []
      const [lat, lon] = centroid
      return Array.from({ length: 3 }).map((_, idx) => ({
        id: `${county.properties.fips}-zip-${idx}`,
        county,
        coordinates: [lat + (idx - 1) * 0.08, lon + (idx - 1) * 0.08] as [number, number]
      }))
    })
  }, [counties, geoLevel])

  useEffect(() => {
    const query = searchQuery?.trim() ?? ''
    if (!query) {
      setSearchTarget(null)
      return
    }
    const bestMatch = [...counties]
      .map(county => ({
        county,
        score: fuzzyScore(query, `${county.properties.name} ${county.properties.state}`)
      }))
      .sort((a, b) => b.score - a.score)[0]
    if (bestMatch?.score && bestMatch.score > 0.15) {
      setSearchTarget(bestMatch.county)
      setSelectedCounty(bestMatch.county)
    }
  }, [searchQuery, counties])

  const MapBehavior = () => {
    const map = useMap()

    useEffect(() => {
      const baseZoom = selectedState ? 6 : 4
      const zoomByLevel: Record<RealMapViewProps['geoLevel'], number> = {
        state: baseZoom,
        county: baseZoom,
        city: baseZoom + 1,
        'zip-code': baseZoom + 2,
        'census-tract': baseZoom + 2
      }
      map.setZoom(zoomByLevel[geoLevel])
    }, [geoLevel, selectedState, map])

    useEffect(() => {
      if (!searchTarget) return
      const center = getCountyCentroid(searchTarget)
      if (center) {
        map.flyTo(center, Math.max(map.getZoom(), 6), { duration: 0.8 })
      }
    }, [searchTarget, map])

    useEffect(() => {
      if (!gpsCoordinates) return
      map.flyTo(gpsCoordinates, Math.max(map.getZoom(), 6), { duration: 0.8 })
    }, [gpsCoordinates, map])

    return null
  }

  const getCountyCentroid = (county: EnrichedCountyData) => {
    const coords = county.geometry.coordinates[0]
    if (!coords || coords.length === 0) return null
    const centerLon = coords.reduce((sum: number, c: number[]) => sum + c[0], 0) / coords.length
    const centerLat = coords.reduce((sum: number, c: number[]) => sum + c[1], 0) / coords.length
    if (isNaN(centerLat) || isNaN(centerLon)) return null
    return [centerLat, centerLon] as [number, number]
  }

  if (error) {
    return (
      <div className="enhanced-map-view">
        <div className="loading-overlay">
          <div className="loading-spinner" style={{ color: '#e03131' }}>
            Error: {error}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="enhanced-map-view">
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner">Initializing TerraSafe grid analysis...</div>
        </div>
      )}

      {!loading && counties.length === 0 && (
        <div className="loading-overlay">
          <div className="loading-spinner">No counties match the current filters. Try another state.</div>
        </div>
      )}

      <MapContainer
        center={[39.8283, -98.5795]}
        zoom={selectedState ? 6 : 4}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <MapBehavior />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {!loading && counties.map((county, idx) => (
          <GeoJSON
            key={`county-${county.properties.fips}-${idx}`}
            data={county as any}
            style={styleCounty}
            onEachFeature={onEachCounty}
          />
        ))}

        {showNightlightPoints && nightlightData.map((location, idx) => {
          const lat = location.geometry.coordinates[1]
          const lon = location.geometry.coordinates[0]
          if (isNaN(lat) || isNaN(lon) || !isFinite(lat) || !isFinite(lon)) return null

          return (
            <CircleMarker
              key={`nightlight-${idx}`}
              center={[lat, lon]}
              radius={Math.max(1.5, location.properties.intensity * 3)}
              pathOptions={{
                fillColor: '#38bdf8',
                color: '#0ea5e9',
                weight: 1,
                fillOpacity: location.properties.intensity * 0.7
              }}
            >
              <Tooltip>
                <div>
                  <strong>{location.properties.name}, {location.properties.state}</strong><br />
                  Light Intensity: {(location.properties.intensity * 100).toFixed(1)}%<br />
                  Energy: {location.properties.energyMW.toFixed(0)} MW
                </div>
              </Tooltip>
            </CircleMarker>
          )
        }).filter(Boolean)}

        {showTopStressed && topStressedCounties.map((county, idx) => {
          const center = getCountyCentroid(county)
          if (!center) return null

          const score = getForecastScore(county)
          const dotColor = getRiskColor(score)
          return (
            <CircleMarker
              key={`stressed-${county.properties.fips}-${idx}`}
              center={center}
              radius={2.5}
              pathOptions={{
                fillColor: dotColor,
                color: dotColor,
                weight: 1,
                fillOpacity: 0.85
              }}
            >
              <Popup>
                <div className="stress-popup">
                  <h3>Priority Action Zone</h3>
                  <p><strong>{county.properties.name} County, {county.properties.state}</strong></p>
                  <p>Risk Level: {county.emergencyMetrics.stressLevel}</p>
                  <p>Score: {county.emergencyMetrics.overallStressScore.toFixed(1)}/100</p>
                  <p>Disasters: {county.emergencyMetrics.disasterCount}</p>
                </div>
              </Popup>
            </CircleMarker>
          )
        }).filter(Boolean)}

        {geoLevel === 'zip-code' && zipPlaceholders.map(placeholder => (
          <CircleMarker
            key={placeholder.id}
            center={placeholder.coordinates}
            radius={4}
            pathOptions={{
              fillColor: '#38bdf8',
              color: '#0284c7',
              weight: 1,
              fillOpacity: 0.7
            }}
          >
            <Tooltip>
              <div>
                <strong>ZIP Placeholder</strong><br />
                {placeholder.county.properties.name} County, {placeholder.county.properties.state}
              </div>
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>

      {selectedCounty && (
        <div className="map-sidebar">
          <div className="map-sidebar-header">
            <div>
              <h3>{selectedCounty.properties.name} County, {selectedCounty.properties.state}</h3>
              <p>Population: {selectedCounty.properties.totalPopulation.toLocaleString()}</p>
            </div>
            <button
              className="map-sidebar-close"
              onClick={() => setSelectedCounty(null)}
              aria-label="Close details"
            >
              ✕
            </button>
          </div>
          <div className="map-sidebar-summary">
            <div className="summary-item">
              <span className="summary-label">Forecast</span>
              <span className="summary-value">{getForecastScore(selectedCounty).toFixed(1)}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Risk level</span>
              <span className="summary-value">{selectedCounty.emergencyMetrics.stressLevel}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Disasters</span>
              <span className="summary-value">{selectedCounty.emergencyMetrics.disasterCount}</span>
            </div>
          </div>
          <div className="map-sidebar-section">
            <h4>Grid vulnerability</h4>
            <p><strong>Forecast Score:</strong> {getForecastScore(selectedCounty).toFixed(1)}/100</p>
            <p><strong>Forecast Level:</strong> {getForecastLevel(getForecastScore(selectedCounty))}</p>
            <p><strong>Forecast Window:</strong> {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
          </div>
          <div className="map-sidebar-section">
            <h4>Demand-response strategy</h4>
            <p>
              {getForecastScore(selectedCounty) >= 75
                ? 'Surge +20%: target large industrial loads and automated demand response.'
                : getForecastScore(selectedCounty) >= 60
                  ? 'Peak +12%: shift flexible usage during high-risk hours.'
                  : getForecastScore(selectedCounty) >= 50
                    ? 'Flex +6%: encourage off-peak scheduling and conservation.'
                    : 'Standard: maintain baseline pricing with monitoring.'}
            </p>
          </div>
          <div className="map-sidebar-section">
            <h4>Grid Vulnerability Assessment</h4>
            <p><strong>Risk Level:</strong> {selectedCounty.emergencyMetrics.stressLevel}</p>
            <p><strong>Overall Score:</strong> {selectedCounty.emergencyMetrics.overallStressScore.toFixed(1)}/100</p>
            <p><strong>Disaster Declarations:</strong> {selectedCounty.emergencyMetrics.disasterCount}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default RealMapView
