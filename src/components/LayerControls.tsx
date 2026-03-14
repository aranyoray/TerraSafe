/**
 * Layer Controls Component
 * Interactive checkboxes for toggling different map layers
 */

import { useState } from 'react'
import { MapLayerConfig } from '../types/emergencyMetrics'
import './LayerControls.css'

interface LayerControlsProps {
  layers: MapLayerConfig[]
  onLayerToggle: (layerId: string, enabled: boolean) => void
  featuredLayerIds?: string[]
}

const LayerControls = ({ layers, onLayerToggle, featuredLayerIds = [] }: LayerControlsProps) => {
  const [collapsed, setCollapsed] = useState(false)
  const [emergencyOpen, setEmergencyOpen] = useState(false)
  const [energyOpen, setEnergyOpen] = useState(false)
  const emergencyLayers = layers.filter(layer => layer.category !== 'energy')
  const energyLayers = layers.filter(layer => layer.category === 'energy')
  const layerDescriptions: Record<string, string> = {
    'county-choropleth': 'Composite grid vulnerability index by county.',
    'forecast-pressure': 'Predictive outage probability using climate and grid stress modeling.',
    'disaster-stress': 'Historical extreme weather exposure and FEMA disaster declarations.',
    'energy-reliability': 'Counties with elevated grid stress and capacity deficit risk.',
    'recovery-needs': 'Areas requiring post-disaster grid restoration investment.',
    'infrastructure-priority': 'Hospitals, shelters, cooling centers, and critical facilities at risk.',
    'county-pricing': 'Demand-response pricing zones for peak load management.',
    'manufacturing-hubs': 'High industrial and data center load concentrations.',
    'agriculture-supply': 'Agricultural supply chain and cold storage protection zones.',
    'water-systems': 'Water treatment and pumping infrastructure vulnerability.',
    'first-responders': 'Emergency services, hospitals, and VA facility coverage areas.',
    'new-projects': 'Recommended resilience infrastructure investments through 2050.',
    'storage-sites': 'Battery storage deployment candidates for disaster resilience.',
    'nightlight-points': 'VIIRS satellite nighttime energy activity indicators.',
    'top-stressed': 'Highest-priority counties requiring immediate intervention.'
  }

  const renderLayer = (layer: MapLayerConfig) => (
    <label key={layer.id} className="layer-control-item">
      <input
        type="checkbox"
        checked={layer.enabled}
        onChange={(e) => onLayerToggle(layer.id, e.target.checked)}
      />
      <span className="layer-name">{layer.name}</span>
      <span className="layer-info-icon" title={layerDescriptions[layer.id] || 'Layer details'}>
        i
      </span>
      {layer.color && (
        <span
          className="layer-color-indicator"
          style={{ backgroundColor: layer.color }}
        />
      )}
    </label>
  )

  return (
    <div className="layer-controls">
      <button
        type="button"
        className="layer-controls-header"
        onClick={() => setCollapsed(!collapsed)}
        aria-expanded={!collapsed}
      >
        <span className="layer-controls-header-title">Map Layers</span>
        <span className="collapse-button">{collapsed ? '▼' : '▲'}</span>
      </button>

      {!collapsed && (
        <div className="layer-controls-content">
          <div className="layer-controls-section">
            <button
              type="button"
              className="layer-controls-accordion"
              onClick={() => setEmergencyOpen(prev => !prev)}
            >
              <span>Climate & Grid Risk</span>
              <span className="accordion-icon">{emergencyOpen ? '▲' : '▼'}</span>
            </button>
            {emergencyOpen && (
              <div className="layer-controls-group">
                {emergencyLayers.map(renderLayer)}
                <div className="layer-controls-note">Predictive risk layers</div>
              </div>
            )}
          </div>

          <div className="layer-controls-section">
            <button
              type="button"
              className="layer-controls-accordion"
              onClick={() => setEnergyOpen(prev => !prev)}
            >
              <span>Energy Infrastructure</span>
              <span className="accordion-icon">{energyOpen ? '▲' : '▼'}</span>
            </button>
            {energyOpen && (
              <div className="layer-controls-group">
                {energyLayers.map(renderLayer)}
                <div className="layer-controls-note">Infrastructure intelligence layers</div>
              </div>
            )}
          </div>
          {featuredLayerIds.length > 0 && (
            <div className="layer-controls-section">
              <div className="layer-controls-title">Active overlays</div>
              {layers.filter(layer => featuredLayerIds.includes(layer.id)).map(renderLayer)}
            </div>
          )}
          {featuredLayerIds.length === 0 && energyLayers.length === 0 && (
            <div className="layer-controls-section">
              <button
                type="button"
                className="layer-controls-empty"
                disabled
              >
                No infrastructure layers available
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default LayerControls
