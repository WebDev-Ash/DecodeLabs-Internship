require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { LRUCache } = require('lru-cache');
const axios = require('axios');

const app = express();
const FRONTEND_DIR = path.join(__dirname, '..', '..', 'frontend');

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors({ origin: true }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

const cache = new LRUCache({
  max: 500,
  ttl: 1000 * 60 * 5
});

function normalizeUnits(units) {
  if (!units) return 'metric';
  return units === 'imperial' ? 'imperial' : 'metric';
}

function formatKey(params) {
  return JSON.stringify(params);
}

async function fetchWeather({ lat, lon, units }) {
  const metric = normalizeUnits(units);

  const params = {
    latitude: lat,
    longitude: lon,
    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'precipitation',
      'rain',
      'weather_code',
      'wind_speed_10m',
      'wind_direction_10m',
      'cloud_cover',
      'pressure_msl',
      'surface_pressure',
      'uv_index',
      'is_day',
      'dew_point_2m',
      'visibility'
    ].join(','),
    hourly: [
      'temperature_2m',
      'precipitation_probability',
      'precipitation',
      'rain',
      'weather_code',
      'wind_speed_10m',
      'wind_direction_10m',
      'cloud_cover',
      'uv_index',
      'dew_point_2m',
      'visibility'
    ].join(','),
    daily: [
      'temperature_2m_max',
      'temperature_2m_min',
      'apparent_temperature_max',
      'apparent_temperature_min',
      'precipitation_probability_max',
      'precipitation_sum',
      'rain_sum',
      'weather_code',
      'wind_speed_10m_max',
      'wind_direction_10m_dominant',
      'sunrise',
      'sunset',
      'uv_index_max'
    ].join(','),
    timezone: 'auto',
    forecast_days: 14,
    temperature_unit: metric === 'imperial' ? 'fahrenheit' : 'celsius',
    wind_speed_unit: metric === 'imperial' ? 'mph' : 'kmh',
    precipitation_unit: 'mm'
  };

  const url = 'https://api.open-meteo.com/v1/forecast';
  const res = await axios.get(url, { params, timeout: 12000 });
  return res.data;
}

async function reverseGeocode(lat, lon) {
  const url = 'https://geocoding-api.open-meteo.com/v1/search';
  const res = await axios.get(url, {
    params: { name: `${lat},${lon}`, count: 1, language: 'en', format: 'json' },
    timeout: 8000
  });

  const hit = res.data?.results?.[0];
  if (hit) {
    return {
      id: `${hit.latitude},${hit.longitude}`,
      name: hit.name,
      country: hit.country || '',
      region: hit.admin1 || '',
      latitude: hit.latitude,
      longitude: hit.longitude,
      timezone: hit.timezone
    };
  }

  const nominatim = await axios.get('https://nominatim.openstreetmap.org/reverse', {
    params: { format: 'json', lat, lon, zoom: 10 },
    headers: { 'User-Agent': 'WeatherAtlas/1.0 (local dev)' },
    timeout: 8000
  });

  const addr = nominatim.data?.address || {};
  const name = addr.city || addr.town || addr.village || addr.suburb || addr.county || 'Your location';
  return {
    id: `${lat},${lon}`,
    name,
    country: addr.country_code?.toUpperCase() || '',
    region: addr.state || addr.region || '',
    latitude: lat,
    longitude: lon
  };
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/geocode', async (req, res) => {
  const q = (req.query.q || '').trim();
  const limit = Math.min(parseInt(req.query.limit || '5', 10) || 5, 10);
  const key = formatKey({ type: 'geocode', q, limit });
  if (cache.has(key)) return res.json(cache.get(key));

  if (!q || q.length < 2) {
    return res.status(400).json({ error: 'Missing or invalid query parameter q' });
  }

  try {
    const url = 'https://geocoding-api.open-meteo.com/v1/search';
    const geoRes = await axios.get(url, {
      params: { name: q, count: limit, language: 'en', format: 'json' },
      timeout: 8000
    });

    const results = (geoRes.data?.results || []).map(r => ({
      id: `${r.latitude},${r.longitude}`,
      name: r.name,
      country: r.country,
      region: r.admin1,
      latitude: r.latitude,
      longitude: r.longitude,
      timezone: r.timezone
    }));

    const out = { results };
    cache.set(key, out);
    res.json(out);
  } catch {
    res.status(502).json({ error: 'Failed to geocode location' });
  }
});

app.get('/api/reverse-geocode', async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lon = parseFloat(req.query.lon);
  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return res.status(400).json({ error: 'Missing/invalid lat and lon' });
  }

  const key = formatKey({ type: 'reverse', lat: lat.toFixed(4), lon: lon.toFixed(4) });
  if (cache.has(key)) return res.json(cache.get(key));

  try {
    const result = await reverseGeocode(lat, lon);
    const out = { result };
    cache.set(key, out);
    res.json(out);
  } catch {
    res.status(502).json({ error: 'Failed to reverse geocode location' });
  }
});

app.get('/api/weather', async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lon = parseFloat(req.query.lon);
  const units = normalizeUnits(req.query.units);

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return res.status(400).json({ error: 'Missing/invalid lat and lon' });
  }

  const key = formatKey({ type: 'weather', lat: lat.toFixed(4), lon: lon.toFixed(4), units });
  if (cache.has(key)) return res.json(cache.get(key));

  try {
    const data = await fetchWeather({ lat, lon, units });
    const out = { ...data, units, fetchedAt: Date.now() };
    cache.set(key, out);
    res.json(out);
  } catch {
    res.status(502).json({ error: 'Failed to fetch weather' });
  }
});

app.get('/api/air-quality', async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lon = parseFloat(req.query.lon);

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return res.status(400).json({ error: 'Missing/invalid lat and lon' });
  }

  const key = formatKey({ type: 'air-quality', lat: lat.toFixed(4), lon: lon.toFixed(4) });
  if (cache.has(key)) return res.json(cache.get(key));

  try {
    const url = 'https://air-quality-api.open-meteo.com/v1/air-quality';
    const params = {
      latitude: lat,
      longitude: lon,
      current: [
        'us_aqi',
        'pm10',
        'pm2_5',
        'carbon_monoxide',
        'nitrogen_dioxide',
        'sulphur_dioxide',
        'ozone',
        'ammonia'
      ].join(','),
      timezone: 'auto'
    };
    const aqRes = await axios.get(url, { params, timeout: 10000 });
    const out = { ...aqRes.data, fetchedAt: Date.now() };
    cache.set(key, out);
    res.json(out);
  } catch {
    res.status(502).json({ error: 'Failed to fetch air quality data' });
  }
});

app.use(express.static(FRONTEND_DIR));

app.get('*', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Weather app running at http://localhost:${port}`);
});
