# TerraSafe — Extreme Weather Energy Preparedness

An AI-powered climate resilience platform helping communities maintain energy reliability and protect critical services before, during, and after climate-driven extreme weather events.

**Real Data Sources:**
- **2,269 US Counties** with GeoJSON polygon boundaries
- **10,000+ Cities** with VIIRS nighttime satellite light intensity data
- **Live FEMA Disaster Declarations** via OpenFEMA API v2
- **County-level energy consumption** derived from satellite nighttime light data

## Overview

TerraSafe aggregates grid, climate, and infrastructure data to help communities prepare their energy systems for extreme weather. It creates an interactive map of critical infrastructure — hospitals, shelters, schools, cooling centers — along with their grid dependencies, then uses predictive modeling to forecast county-level outage probability under heat wave, storm, and flood scenarios.

## Features

### Predictive Grid-Stress Modeling
- Gradient boosting, spatial clustering, and regression ensemble models
- County-level outage probability predictions under extreme weather scenarios
- 2025–2050 forecast timeline with seasonal adjustments
- Validated against historical events using county-holdout cross-validation

### Interactive Resilience Dashboard
- Dark-themed, full-screen map with 15+ toggleable data layers
- Real-time choropleth visualization of grid vulnerability, disaster exposure, and predictive risk
- Floating glass-morphism control panels inspired by modern weather platforms
- County-level detail panels with risk assessments and intervention recommendations

### Equity-Centered Prioritization
- Prioritizes hospitals, shelters, tribal clinics, VA facilities, and cooling centers
- Weights vulnerable populations: Indigenous communities, unhoused residents, veterans, elderly
- Generates role-specific action cards for officials, utility planners, and community organizations

### Data Layers
- **Climate & Grid Risk:** Grid vulnerability index, predictive outage risk, historical disaster exposure, post-disaster recovery zones, critical facility protection, agricultural supply chain risk, water infrastructure risk, emergency services hubs
- **Energy Infrastructure:** Grid stress watchlist, demand-response pricing zones, industrial load centers, resilience infrastructure pipeline, battery storage candidates, satellite energy activity

## Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Deploy to Vercel
```bash
vercel --prod
```

## Technology Stack

- **React 18** with TypeScript
- **Vite** — Build tool and dev server
- **Leaflet** + **React Leaflet** — Map visualization with CartoDB Dark Matter tiles
- **Recharts** — Data visualization
- **Lucide React** — Icon system
- **Inter** — Typography

## Data Sources

| Source | Data | Resolution |
|--------|------|------------|
| FEMA OpenFEMA API v2 | Disaster declarations | County level |
| NOAA Storm Events | Storm events, hurricanes, floods, wildfires | County level |
| EIA (Energy Information Administration) | Energy demand, electricity prices | State/utility level |
| U.S. Census Bureau | Migration flows, population estimates | County level |
| DOE LEAD Tool | Energy burden, household characteristics | Census tract level |
| VIIRS Nighttime Lights | Satellite energy activity proxy | City level |

## Predictive Models

TerraSafe employs three forecasting models with increasing complexity:

1. **Linear Regression Baseline** (81.4% accuracy) — Core demographic, infrastructure, and disaster features
2. **Terrain-Augmented Regression** (86.2% accuracy) — Adds terrain slope as infrastructure vulnerability proxy
3. **Gradient Boosting Ensemble** (89.7% accuracy) — Spatiotemporal features with regional clustering and seasonal patterns

All models are validated using county-holdout cross-validation and tested for geographic equity across rural, suburban, and metro counties.

## Project Structure

```
src/
  components/
    RealMapView.tsx           # Interactive map with dark CartoDB tiles
    LayerControls.tsx         # Data layer toggle controls
    TimeSlider.tsx            # Forecast timeline navigation
    AIModelsReport.tsx        # Predictive modeling methodology report
    EnhancedMapView.css       # Map styling and tooltips
  services/
    realDataAggregator.ts     # Multi-source data integration
    realFemaData.ts           # FEMA OpenFEMA API v2 client
    nightlightData.ts         # VIIRS satellite data loader
    noaaData.ts               # NOAA Storm Events service
    eiaData.ts                # EIA API integration
    censusData.ts             # Census migration data
    leadData.ts               # DOE LEAD tool data
  types/
    emergencyMetrics.ts       # Core data interfaces
    energyData.ts             # Energy data types
    locationSearch.ts         # Search and geolocation types
  AppEnhanced.tsx             # Main application
  main.tsx                    # Entry point
```

## License

MIT License

## Team

Built by the TerraSafe team — combining expertise in AI-driven energy systems, grid modeling, and community-centered climate resilience.
