const BACKEND_URL = (window.__BACKEND_URL__ || window.location.origin || 'http://localhost:5000').replace(/\/$/, '');

const els = {
  searchInput: document.getElementById('searchInput'),
  searchBtn: document.getElementById('searchBtn'),
  suggestions: document.getElementById('suggestions'),
  statusBar: document.getElementById('statusBar'),
  unitToggle: document.getElementById('unitToggle'),
  geoBtn: document.getElementById('geoBtn'),
  refreshBtn: document.getElementById('refreshBtn'),
  shareBtn: document.getElementById('shareBtn'),
  placeTitle: document.getElementById('placeTitle'),
  metaRow: document.getElementById('metaRow'),
  temp: document.getElementById('temp'),
  tempUnit: document.getElementById('tempUnit'),
  weatherIcon: document.getElementById('weatherIcon'),
  summary: document.getElementById('summary'),
  feelsLike: document.getElementById('feelsLike'),
  humidity: document.getElementById('humidity'),
  wind: document.getElementById('wind'),
  precip: document.getElementById('precip'),
  uvIndex: document.getElementById('uvIndex'),
  cloudCover: document.getElementById('cloudCover'),
  pressure: document.getElementById('pressure'),
  dewPoint: document.getElementById('dewPoint'),
  visibility: document.getElementById('visibility'),
  sunTimes: document.getElementById('sunTimes'),
  hourly: document.getElementById('hourly'),
  daily: document.getElementById('daily'),
  detailsGrid: document.getElementById('detailsGrid'),
  airQualityGrid: document.getElementById('airQualityGrid'),
  tips: document.getElementById('tips'),
  saveFavBtn: document.getElementById('saveFavBtn'),
  favs: document.getElementById('favs'),
  recentSearches: document.getElementById('recentSearches'),
  footMeta: document.getElementById('footMeta'),
  loadingOverlay: document.getElementById('loadingOverlay'),
  emptyState: document.getElementById('emptyState'),
  weatherPanel: document.getElementById('weatherPanel')
};

const state = {
  units: localStorage.getItem('units') === 'imperial' ? 'imperial' : 'metric',
  lastSelection: null,
  lastWeather: null,
  suggestionsTimer: null,
  favs: [],
  loading: false
};

const WEATHER_CODES = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail'
};

function setStatus(msg, isError = false) {
  els.statusBar.textContent = msg || '';
  els.statusBar.classList.toggle('error', Boolean(isError && msg));
}

function setLoading(on) {
  state.loading = on;
  els.loadingOverlay.classList.toggle('hidden', !on);
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function iconFor(code) {
  if (code === 0) return '☀️';
  if ([1, 2].includes(code)) return '🌤️';
  if (code === 3) return '☁️';
  if ([45, 48].includes(code)) return '🌫️';
  if ([51, 53, 55].includes(code)) return '🌦️';
  if ([56, 57, 61, 63, 65].includes(code)) return '🌧️';
  if ([66, 67].includes(code)) return '🌨️';
  if ([71, 73, 75, 77].includes(code)) return '❄️';
  if ([80, 81, 82].includes(code)) return '🌧️';
  if ([85, 86].includes(code)) return '🌨️';
  if ([95, 96, 99].includes(code)) return '⛈️';
  return '🌈';
}

function summaryFor(code) {
  return WEATHER_CODES[code] || 'Weather';
}

function themeFor(code, isDay = true) {
  if (!isDay) return 'theme-night';
  if ([0, 1].includes(code)) return 'theme-clear';
  if ([2, 3].includes(code)) return 'theme-cloudy';
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'theme-rain';
  if ([95, 96, 99].includes(code)) return 'theme-storm';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'theme-snow';
  return 'theme-default';
}

function cOrF() {
  return state.units === 'imperial' ? '°F' : '°C';
}

function formatTemp(v) {
  if (v === undefined || v === null) return '—';
  return Math.round(v);
}

function formatWind(speed) {
  if (speed === undefined || speed === null) return '—';
  const s = Math.round(speed);
  return state.units === 'imperial' ? `${s} mph` : `${s} km/h`;
}

function formatPrecip(v) {
  if (v === undefined || v === null) return '—';
  const n = Number(v);
  if (Number.isNaN(n)) return '—';
  if (state.units === 'imperial') return `${(n / 25.4).toFixed(2)} in`;
  return `${n.toFixed(1)} mm`;
}

function formatVisibility(v) {
  if (v === undefined || v === null) return '—';
  const n = Number(v);
  if (Number.isNaN(n)) return '—';
  if (state.units === 'imperial') {
    const miles = n / 1609.34;
    return miles >= 10 ? `${Math.round(miles)} mi` : `${miles.toFixed(1)} mi`;
  }
  return n >= 10000 ? `${Math.round(v / 1000)} km` : `${(v / 1000).toFixed(1)} km`;
}

function aqiLabel(aqi) {
  if (aqi === undefined || aqi === null) return { text: '—', cls: '' };
  const v = Math.round(aqi);
  if (v <= 50) return { text: `${v} (Good)`, cls: 'aqi-good' };
  if (v <= 100) return { text: `${v} (Moderate)`, cls: 'aqi-moderate' };
  if (v <= 150) return { text: `${v} (Unhealthy for sensitive)`, cls: 'aqi-sensitive' };
  if (v <= 200) return { text: `${v} (Unhealthy)`, cls: 'aqi-unhealthy' };
  if (v <= 300) return { text: `${v} (Very unhealthy)`, cls: 'aqi-very-unhealthy' };
  return { text: `${v} (Hazardous)`, cls: 'aqi-hazardous' };
}

function percent(v) {
  if (v === undefined || v === null) return '—';
  return `${Math.round(v)}%`;
}

function windDir(deg) {
  if (deg === undefined || deg === null) return '';
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
}

function uvLabel(uv) {
  if (uv === undefined || uv === null) return { text: '—', cls: '' };
  const v = Math.round(uv);
  if (v <= 2) return { text: `${v} (Low)`, cls: 'uv-low' };
  if (v <= 5) return { text: `${v} (Moderate)`, cls: 'uv-moderate' };
  if (v <= 7) return { text: `${v} (High)`, cls: 'uv-high' };
  if (v <= 10) return { text: `${v} (Very high)`, cls: 'uv-very-high' };
  return { text: `${v} (Extreme)`, cls: 'uv-extreme' };
}

function timeLabel(isoOrTime) {
  const d = new Date(isoOrTime);
  if (Number.isNaN(d.getTime())) return isoOrTime;
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function dayLabel(isoDate, index = 0) {
  if (index === 0) return 'Today';
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString([], { weekday: 'short' });
}

function locationLabel(loc) {
  const parts = [loc.name];
  if (loc.region) parts.push(loc.region);
  if (loc.country) parts.push(loc.country);
  return parts.filter(Boolean).join(', ');
}

async function apiFetch(path) {
  const res = await fetch(`${BACKEND_URL}${path}`);
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error || j.message || `Request failed (${res.status})`);
  }
  return res.json();
}

async function geocode(query) {
  return apiFetch(`/api/geocode?q=${encodeURIComponent(query)}&limit=6`);
}

async function reverseGeocode(lat, lon) {
  return apiFetch(`/api/reverse-geocode?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`);
}

async function fetchWeather(lat, lon) {
  return apiFetch(`/api/weather?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&units=${encodeURIComponent(state.units)}`);
}

async function fetchAirQuality(lat, lon) {
  return apiFetch(`/api/air-quality?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`);
}

function saveFavorites() {
  localStorage.setItem('favorites', JSON.stringify(state.favs));
}

function loadFavorites() {
  try {
    const raw = localStorage.getItem('favorites');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecents() {
  localStorage.setItem('recentSearches', JSON.stringify(state.recents));
}

function loadRecents() {
  try {
    const raw = localStorage.getItem('recentSearches');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addRecent(loc) {
  const id = loc.id || `${loc.latitude},${loc.longitude}`;
  const entry = { ...loc, id };
  state.recents = [entry, ...(state.recents || []).filter(r => r.id !== id)].slice(0, 5);
  saveRecents();
  renderRecents();
}

function isFav(loc) {
  return (state.favs || []).some(f => f.id === loc.id);
}

function renderRecents() {
  const recents = state.recents || [];
  els.recentSearches.innerHTML = '';
  if (!recents.length) {
    els.recentSearches.innerHTML = '<span class="chip-empty">No recent searches</span>';
    return;
  }
  recents.forEach(r => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip';
    btn.textContent = r.name;
    btn.addEventListener('click', () => selectLocation({ ...r }));
    els.recentSearches.appendChild(btn);
  });
}

function renderFavs() {
  const favs = state.favs || [];
  els.favs.innerHTML = '';
  if (!favs.length) {
    els.favs.innerHTML = '<span class="chip-empty">None saved</span>';
    return;
  }
  favs.forEach(f => {
    const wrap = document.createElement('div');
    wrap.style.display = 'flex';
    wrap.style.gap = '4px';
    wrap.style.alignItems = 'center';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip';
    btn.textContent = `⭐ ${f.name}`;
    btn.addEventListener('click', () => selectLocation({ ...f }));

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'chip';
    del.textContent = '✕';
    del.title = 'Remove';
    del.addEventListener('click', (e) => {
      e.stopPropagation();
      state.favs = state.favs.filter(x => x.id !== f.id);
      saveFavorites();
      renderFavs();
      syncSaveButton();
    });

    wrap.appendChild(btn);
    wrap.appendChild(del);
    els.favs.appendChild(wrap);
  });
}

function syncSaveButton() {
  const loc = state.lastSelection;
  if (!loc) {
    els.saveFavBtn.disabled = true;
    return;
  }
  els.saveFavBtn.disabled = false;
  els.saveFavBtn.textContent = isFav(loc) ? '⭐ Saved' : '⭐ Save';
}

function renderSuggestions(items, onPick) {
  if (!items?.length) {
    els.suggestions.innerHTML = '';
    els.suggestions.classList.add('hidden');
    return;
  }
  els.suggestions.classList.remove('hidden');
  els.suggestions.innerHTML = '';
  items.forEach(item => {
    const row = document.createElement('div');
    row.className = 'suggestion';
    row.setAttribute('role', 'option');
    row.tabIndex = 0;
    row.innerHTML = `
      <div class="left">
        <div class="name">${escapeHtml(item.name)}${item.country ? `, ${escapeHtml(item.country)}` : ''}</div>
        <div class="sub">${escapeHtml(item.region || '')}${item.region ? ' • ' : ''}${item.latitude.toFixed(2)}°, ${item.longitude.toFixed(2)}°</div>
      </div>
      <div class="pick">Select</div>
    `;
    const pick = () => onPick(item);
    row.addEventListener('click', pick);
    row.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') pick();
    });
    els.suggestions.appendChild(row);
  });
}

function locFromGeocodeItem(item) {
  return {
    id: `${item.latitude},${item.longitude}`,
    name: item.name,
    country: item.country || '',
    region: item.region || '',
    latitude: item.latitude,
    longitude: item.longitude
  };
}

function showWeatherPanel(show) {
  els.weatherPanel.classList.toggle('hidden', !show);
  els.emptyState.classList.toggle('hidden', show);
}

function scoreTips(weather) {
  const tips = [];
  const current = weather?.current;
  const hourly = weather?.hourly;
  const daily = weather?.daily;
  if (!current) return tips;

  const code = current.weather_code;
  tips.push({
    title: `${iconFor(code)} ${summaryFor(code)}`,
    body: current.is_day === 0
      ? 'Night conditions — dress for cooler temps and reduced visibility.'
      : 'Check hourly trends below to plan around temperature and rain changes.'
  });

  const humidityVal = current.relative_humidity_2m;
  if (humidityVal >= 75) {
    tips.push({ title: 'High humidity', body: 'It may feel warmer and sticky — lighter, breathable clothing helps.' });
  } else if (humidityVal <= 35) {
    tips.push({ title: 'Dry air', body: 'Stay hydrated; lip balm and moisturizer can help in dry conditions.' });
  }

  const windVal = current.wind_speed_10m;
  if (windVal >= 40) {
    tips.push({ title: 'Strong wind', body: 'Secure loose items and consider a wind-resistant jacket.' });
  } else if (windVal >= 25) {
    tips.push({ title: 'Breezy', body: 'A light layer will keep you comfortable outdoors.' });
  }

  const uv = current.uv_index;
  if (uv !== undefined && current.is_day === 1) {
    if (uv >= 8) tips.push({ title: 'Very high UV', body: 'Use SPF 30+, sunglasses, and seek shade between 10am–4pm.' });
    else if (uv >= 3) tips.push({ title: 'Moderate UV', body: 'Sunscreen recommended if you\'ll be outside for a while.' });
    else tips.push({ title: 'Low UV', body: 'Minimal sun protection needed today.' });
  }

  if (hourly?.time?.length) {
    const probs = hourly.precipitation_probability?.slice(0, 6).filter(v => v !== undefined) || [];
    const maxProb = probs.length ? Math.max(...probs) : null;
    if (maxProb !== null) {
      if (maxProb >= 60) tips.push({ title: 'Rain likely soon', body: 'Bring an umbrella or plan indoor alternatives in the next few hours.' });
      else if (maxProb >= 30) tips.push({ title: 'Chance of showers', body: 'A compact umbrella is a good idea.' });
    }
  }

  if (daily?.time?.length) {
    const tMax = daily.temperature_2m_max?.[0];
    const tMin = daily.temperature_2m_min?.[0];
    if (tMax !== undefined && tMin !== undefined && tMax - tMin >= 12) {
      tips.push({ title: 'Big temperature swing', body: `Expect ${formatTemp(tMin)}${cOrF()} to ${formatTemp(tMax)}${cOrF()} today — layer up.` });
    }
  }

  return tips.slice(0, 6);
}

function renderAirQuality(aqData) {
  const current = aqData?.current;
  if (!current) {
    els.airQualityGrid.innerHTML = '<div class="detail-item"><div class="label">Air Quality</div><div class="value">Data unavailable</div></div>';
    return;
  }

  const aqi = aqiLabel(current.us_aqi);
  const items = [
    { label: 'US AQI', value: aqi.text, fmt: v => v, cls: aqi.cls },
    { label: 'PM2.5', value: current.pm2_5, fmt: v => v !== undefined ? `${v.toFixed(1)} µg/m³` : '—' },
    { label: 'PM10', value: current.pm10, fmt: v => v !== undefined ? `${v.toFixed(1)} µg/m³` : '—' },
    { label: 'Ozone (O₃)', value: current.ozone, fmt: v => v !== undefined ? `${v.toFixed(1)} µg/m³` : '—' },
    { label: 'Nitrogen dioxide', value: current.nitrogen_dioxide, fmt: v => v !== undefined ? `${v.toFixed(1)} µg/m³` : '—' },
    { label: 'Carbon monoxide', value: current.carbon_monoxide, fmt: v => v !== undefined ? `${v.toFixed(1)} µg/m³` : '—' }
  ];

  els.airQualityGrid.innerHTML = '';
  items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'detail-item';
    const val = item.value !== undefined && item.value !== null ? item.fmt(item.value) : '—';
    div.innerHTML = `
      <div class="label">${escapeHtml(item.label)}</div>
      <div class="value ${item.cls || ''}">${escapeHtml(val)}</div>
    `;
    els.airQualityGrid.appendChild(div);
  });
}

function renderDetails(weather) {
  const current = weather.current;
  const daily = weather.daily;
  const items = [
    { label: 'Feels like max', value: daily?.apparent_temperature_max?.[0], fmt: v => `${formatTemp(v)}${cOrF()}` },
    { label: 'Feels like min', value: daily?.apparent_temperature_min?.[0], fmt: v => `${formatTemp(v)}${cOrF()}` },
    { label: 'Today\'s rain total', value: daily?.precipitation_sum?.[0], fmt: formatPrecip },
    { label: 'Max wind today', value: daily?.wind_speed_10m_max?.[0], fmt: formatWind },
    { label: 'Max UV today', value: daily?.uv_index_max?.[0], fmt: v => uvLabel(v).text },
    { label: 'Dominant wind', value: daily?.wind_direction_10m_dominant?.[0], fmt: v => windDir(v) || '—' }
  ];

  els.detailsGrid.innerHTML = '';
  items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'detail-item';
    const val = item.value !== undefined && item.value !== null ? item.fmt(item.value) : '—';
    div.innerHTML = `
      <div class="label">${escapeHtml(item.label)}</div>
      <div class="value">${escapeHtml(val)}</div>
    `;
    els.detailsGrid.appendChild(div);
  });
}

function renderWeather(weather, loc) {
  state.lastWeather = weather;
  const current = weather.current;
  const hourly = weather.hourly;
  const daily = weather.daily;

  document.body.className = themeFor(current.weather_code, current.is_day !== 0);

  const fetchedAt = weather.fetchedAt || Date.now();
  els.footMeta.textContent = `Updated ${new Date(fetchedAt).toLocaleString()} • ${weather.timezone || ''}`;

  els.placeTitle.textContent = locationLabel(loc);
  els.tempUnit.textContent = cOrF();
  els.temp.textContent = formatTemp(current.temperature_2m);
  els.weatherIcon.textContent = iconFor(current.weather_code);
  els.summary.textContent = summaryFor(current.weather_code);

  els.feelsLike.textContent = `${formatTemp(current.apparent_temperature)} ${cOrF()}`;
  els.humidity.textContent = current.relative_humidity_2m !== undefined ? percent(current.relative_humidity_2m) : '—';

  const wDir = windDir(current.wind_direction_10m);
  els.wind.textContent = `${formatWind(current.wind_speed_10m)}${wDir ? ` ${wDir}` : ''}`;

  els.precip.textContent = formatPrecip(current.precipitation ?? current.rain ?? 0);

  const uv = uvLabel(current.uv_index);
  els.uvIndex.textContent = uv.text;
  els.uvIndex.className = `stat-value ${uv.cls}`;

  els.cloudCover.textContent = current.cloud_cover !== undefined ? percent(current.cloud_cover) : '—';
  els.pressure.textContent = current.pressure_msl !== undefined ? `${Math.round(current.pressure_msl)} hPa` : '—';
  els.dewPoint.textContent = current.dew_point_2m !== undefined ? `${formatTemp(current.dew_point_2m)}${cOrF()}` : '—';
  els.visibility.textContent = formatVisibility(current.visibility);

  const sunrise = daily?.sunrise?.[0];
  const sunset = daily?.sunset?.[0];
  els.sunTimes.textContent = sunrise && sunset
    ? `${timeLabel(sunrise)} / ${timeLabel(sunset)}`
    : '—';

  const tzNow = new Date(current.time || Date.now());
  els.metaRow.textContent = `${current.is_day === 0 ? 'Night' : 'Day'} • ${tzNow.toLocaleString([], { weekday: 'long', hour: '2-digit', minute: '2-digit' })}`;

  els.hourly.innerHTML = '';
  const times = hourly?.time || [];
  for (let i = 0; i < Math.min(24, times.length); i++) {
    const t = times[i];
    const temp = hourly.temperature_2m?.[i];
    const pr = hourly.precipitation_probability?.[i];
    const code = hourly.weather_code?.[i];
    const wSpd = hourly.wind_speed_10m?.[i];

    const card = document.createElement('div');
    card.className = 'h-card';
    card.innerHTML = `
      <div class="h-time">${escapeHtml(timeLabel(t))}</div>
      <div class="h-icon">${iconFor(code)}</div>
      <div class="h-temp">${formatTemp(temp)}${cOrF()}</div>
      <div class="h-rain">${percent(pr)}</div>
      <div class="rain-bar-wrap"><div class="rain-bar" style="width:${Math.min(100, pr || 0)}%"></div></div>
      <div class="h-wind">${escapeHtml(formatWind(wSpd))}</div>
    `;
    els.hourly.appendChild(card);
  }

  els.daily.innerHTML = '';
  const dTimes = daily?.time || [];
  const allMins = daily?.temperature_2m_min || [];
  const allMaxs = daily?.temperature_2m_max || [];
  const rangeMin = Math.min(...allMins.filter(v => v !== undefined));
  const rangeMax = Math.max(...allMaxs.filter(v => v !== undefined));
  const range = rangeMax - rangeMin || 1;

  for (let i = 0; i < Math.min(14, dTimes.length); i++) {
    const dt = dTimes[i];
    const tMax = daily.temperature_2m_max?.[i];
    const tMin = daily.temperature_2m_min?.[i];
    const prMax = daily.precipitation_probability_max?.[i];
    const rainSum = daily.precipitation_sum?.[i];
    const code = daily.weather_code?.[i];
    const uvMax = daily.uv_index_max?.[i];

    const leftPct = ((tMin - rangeMin) / range) * 100;
    const widthPct = ((tMax - tMin) / range) * 100;

    const day = document.createElement('div');
    day.className = `d-day${i === 0 ? ' today' : ''}`;
    day.innerHTML = `
      <div class="d-day-top">
        <div class="d-name">${escapeHtml(dayLabel(dt, i))}</div>
        <div class="d-icon">${iconFor(code)}</div>
      </div>
      <div class="d-day-bottom">
        <div class="d-bar-wrap">
          <span class="d-temps">${formatTemp(tMin)}°</span>
          <div class="d-bar-track">
            <div class="d-bar-fill" style="left:${leftPct}%;width:${Math.max(widthPct, 8)}%"></div>
          </div>
          <span class="d-temps">${formatTemp(tMax)}°</span>
        </div>
        <div class="d-meta">Rain ${percent(prMax)} • UV ${uvMax !== undefined ? Math.round(uvMax) : '—'}</div>
      </div>
    `;
    els.daily.appendChild(day);
  }

  renderDetails(weather);

  // Fetch and render air quality
  fetchAirQuality(loc.latitude, loc.longitude).then(aqData => {
    renderAirQuality(aqData);
  }).catch(() => {
    els.airQualityGrid.innerHTML = '<div class="detail-item"><div class="label">Air Quality</div><div class="value">Data unavailable</div></div>';
  });

  els.tips.innerHTML = '';
  scoreTips(weather).forEach(t => {
    const li = document.createElement('li');
    li.className = 'tip';
    li.innerHTML = `<b>${escapeHtml(t.title)}</b><span>${escapeHtml(t.body)}</span>`;
    els.tips.appendChild(li);
  });

  showWeatherPanel(true);
  syncSaveButton();
}

async function selectLocation(loc) {
  const normalized = {
    ...loc,
    id: loc.id || `${loc.latitude},${loc.longitude}`
  };
  state.lastSelection = normalized;
  els.searchInput.value = normalized.name;
  els.suggestions.classList.add('hidden');
  addRecent(normalized);
  syncSaveButton();
  await loadAndRender(normalized);
}

async function loadAndRender(loc) {
  try {
    setLoading(true);
    setStatus('');
    const weather = await fetchWeather(loc.latitude, loc.longitude);
    renderWeather(weather, loc);
    setStatus('');
  } catch (e) {
    setStatus(e.message || 'Failed to load weather', true);
  } finally {
    setLoading(false);
  }
}

async function handleSearch() {
  const q = els.searchInput.value.trim();
  if (!q) return;
  try {
    setStatus('Searching locations…');
    const data = await geocode(q);
    const items = data.results || [];
    if (items.length === 1) {
      await selectLocation(locFromGeocodeItem(items[0]));
      setStatus('');
      return;
    }
    renderSuggestions(items, (item) => selectLocation(locFromGeocodeItem(item)));
    setStatus(items.length ? 'Pick a location from the list.' : 'No matches found.', !items.length);
  } catch (e) {
    setStatus(e.message || 'Geocoding error', true);
  }
}

function toggleUnits() {
  state.units = state.units === 'metric' ? 'imperial' : 'metric';
  localStorage.setItem('units', state.units);
  els.unitToggle.textContent = state.units === 'imperial' ? '°F / °C' : '°C / °F';
  if (state.lastSelection) loadAndRender(state.lastSelection);
}

async function geoLocate() {
  if (!navigator.geolocation) {
    setStatus('Geolocation is not supported in this browser', true);
    return;
  }
  setStatus('Requesting location…');
  navigator.geolocation.getCurrentPosition(async (pos) => {
    try {
      setLoading(true);
      const { latitude, longitude } = pos.coords;
      let loc = {
        id: `${latitude},${longitude}`,
        name: 'Your location',
        country: '',
        region: '',
        latitude,
        longitude
      };
      try {
        const rev = await reverseGeocode(latitude, longitude);
        if (rev.result) loc = { ...rev.result, id: `${rev.result.latitude},${rev.result.longitude}` };
      } catch {
        // keep generic name
      }
      await selectLocation(loc);
    } catch (e) {
      setStatus(e.message || 'Could not load weather for your location', true);
      setLoading(false);
    }
  }, () => {
    setStatus('Location permission denied', true);
  }, { enableHighAccuracy: true, timeout: 10000 });
}

function refreshWeather() {
  if (state.lastSelection) loadAndRender(state.lastSelection);
  else setStatus('Search for a location first');
}

function shareLocation() {
  const loc = state.lastSelection;
  if (!loc) {
    setStatus('Search for a location first');
    return;
  }
  const shareText = `Check out the weather in ${locationLabel(loc)}: ${window.location.href}?lat=${loc.latitude}&lon=${loc.longitude}`;
  
  if (navigator.share) {
    navigator.share({
      title: 'Weather Atlas',
      text: shareText,
      url: window.location.href
    }).catch(() => {});
  } else {
    navigator.clipboard.writeText(shareText).then(() => {
      setStatus('Location copied to clipboard!');
      setTimeout(() => setStatus(''), 3000);
    }).catch(() => {
      setStatus('Failed to copy location');
    });
  }
}

els.searchBtn.addEventListener('click', handleSearch);
els.searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleSearch();
});

let lastQuery = '';
els.searchInput.addEventListener('input', () => {
  const q = els.searchInput.value.trim();
  if (q.length < 2) {
    els.suggestions.classList.add('hidden');
    return;
  }
  clearTimeout(state.suggestionsTimer);
  state.suggestionsTimer = setTimeout(async () => {
    if (q === lastQuery) return;
    lastQuery = q;
    try {
      const data = await geocode(q);
      renderSuggestions(data.results || [], (item) => selectLocation(locFromGeocodeItem(item)));
    } catch {
      // ignore autocomplete errors
    }
  }, 350);
});

els.unitToggle.addEventListener('click', toggleUnits);
els.geoBtn.addEventListener('click', geoLocate);
els.refreshBtn.addEventListener('click', refreshWeather);
els.shareBtn.addEventListener('click', shareLocation);

els.saveFavBtn.addEventListener('click', () => {
  const loc = state.lastSelection;
  if (!loc) return;
  if (isFav(loc)) {
    state.favs = state.favs.filter(f => f.id !== loc.id);
  } else {
    state.favs = [...state.favs, { ...loc }];
  }
  saveFavorites();
  renderFavs();
  syncSaveButton();
});

document.addEventListener('click', (e) => {
  if (!els.suggestions.contains(e.target) && e.target !== els.searchInput) {
    els.suggestions.classList.add('hidden');
  }
});

(function init() {
  state.favs = loadFavorites();
  state.recents = loadRecents();
  renderFavs();
  renderRecents();
  els.unitToggle.textContent = state.units === 'imperial' ? '°F / °C' : '°C / °F';
  els.saveFavBtn.disabled = true;

  const lastId = localStorage.getItem('lastLocationId');
  const saved = [...state.recents, ...state.favs].find(l => l.id === lastId);
  if (saved) selectLocation(saved);
})();

window.addEventListener('beforeunload', () => {
  if (state.lastSelection) {
    localStorage.setItem('lastLocationId', state.lastSelection.id);
  }
});
