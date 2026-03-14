/**
 * Layer Controls — flat list for core analysis layers
 */

import { useState } from 'react'
import { MapLayerConfig } from '../types/emergencyMetrics'
import './LayerControls.css'

interface LayerControlsProps {
  layers: MapLayerConfig[]
  onLayerToggle: (layerId: string, enabled: boolean) => void
  featuredLayerIds?: string[]
}

const layerDescriptions: Record<string, string> = {
  'county-choropleth': 'Composite grid vulnerability index aggregating infrastructure age, capacity deficit, and population density.',
  'forecast-pressure': 'Predictive outage probability combining climate projections, grid stress modeling, and historical disaster data.',
  'disaster-stress': 'Historical extreme weather exposure derived from FEMA disaster declarations and NOAA storm events.',
  'top-stressed': 'Top 40 counties ranked by composite risk score requiring immediate intervention planning.'
}

const LayerControls = ({ layers, onLayerToggle }: LayerControlsProps) => {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="layer-controls">
      <button
        type="button"
        className="layer-controls-header"
        onClick={() => setCollapsed(!collapsed)}
        aria-expanded={!collapsed}
      >
        <span className="layer-controls-header-title">Analysis Layers</span>
        <span className="collapse-button">{collapsed ? '▼' : '▲'}</span>
      </button>

      {!collapsed && (
        <div className="layer-controls-content">
          {layers.map(layer => (
            <label key={layer.id} className="layer-control-item">
              <input
                type="checkbox"
                checked={layer.enabled}
                onChange={(e) => onLayerToggle(layer.id, e.target.checked)}
              />
              <div className="layer-control-info">
                <span className="layer-name">{layer.name}</span>
                <span className="layer-description">{layerDescriptions[layer.id]}</span>
              </div>
              {layer.color && (
                <span
                  className="layer-color-indicator"
                  style={{ backgroundColor: layer.color }}
                />
              )}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

export default LayerControls
