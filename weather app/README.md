<!-- markdownlint-disable MD041 -->
<!-- markdownlint-disable MD032 -->
<!-- markdownlint-disable MD022 -->
<!-- markdownlint-disable MD012 -->
<!-- markdownlint-disable MD031 -->
<!-- markdownlint-disable MD034 -->
# Weather Atlas (Express backend + Frontend)

A full-stack weather app that:
- Uses an **Express** backend serving both API and static frontend
- Fetches weather + geocoding from **Open-Meteo** (no API key required)
- Shows **Current**, **Hourly (next 24h)**, **14-day** forecasts
- Includes **Air Quality** data with pollutant measurements
- Features: **Favorites**, **Unit toggle (°C/°F)**, **Geolocation**, **Share location**, caching + rate limiting
- Modern UI with hover effects, dynamic themes, and responsive design

## Features

### Weather Data
- Current conditions: temperature, humidity, wind, precipitation, UV index, cloud cover, pressure, dew point, visibility
- Hourly forecast (24 hours): temperature, precipitation probability, weather codes, wind
- 14-day outlook: daily highs/lows, precipitation totals, UV index, sunrise/sunset
- Air quality index (US AQI) with PM2.5, PM10, O₃, NO₂, CO, SO₂ levels

### User Features
- City search with autocomplete
- Geolocation support (use current location)
- Save favorite locations
- Recent search history
- Share location (Web Share API or clipboard fallback)
- Unit conversion (metric/imperial)
- Dynamic theming based on weather conditions
- Smart tips based on current conditions

## Folder structure
- `backend/` Express API with static file serving
- `frontend/` HTML, CSS, and JavaScript (served by backend)

## Setup & Run

### Quick Start
```bat
cd "d:/frontend and backend integration/backend"
npm install
npm start
```
The app will be available at: http://localhost:5000

### Backend Configuration
- Port: 5000 (configurable via PORT environment variable)
- Rate limiting: 120 requests per minute per IP
- Caching: 5-minute TTL for weather and geocoding data
- No API keys required (uses Open-Meteo free APIs)

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/geocode?q=London&limit=6` - City search/geocoding
- `GET /api/reverse-geocode?lat=..&lon=..` - Reverse geocoding
- `GET /api/weather?lat=..&lon=..&units=metric|imperial` - Weather data
- `GET /api/air-quality?lat=..&lon=..` - Air quality data

## Technologies
- **Backend**: Node.js, Express, Axios, LRU Cache, Helmet, CORS
- **Frontend**: Vanilla JavaScript, CSS3, HTML5
- **Data Sources**: Open-Meteo Weather API, Open-Meteo Air Quality API, OpenStreetMap (Nominatim)

## Browser Support
- Modern browsers with ES6+ support
- Geolocation API for location features
- Web Share API for sharing (with clipboard fallback)


