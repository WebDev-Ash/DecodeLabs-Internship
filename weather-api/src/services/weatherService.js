const { cache } = require('./cacheService');

function celsiusToFahrenheit(c) {
  return Number((c * 9 / 5 + 32).toFixed(1));
}

function kphToMph(kph) {
  return Math.round(kph * 0.621371);
}

function deterministicWeatherFromCoords(lat, lon, dayOffset = 0) {
  const seed = Math.floor((lat + 90) * 1000) ^ Math.floor((lon + 180) * 1000) ^ dayOffset;

  const temperatureC = ((seed % 3500) / 100) - 10;
  const humidity = 20 + (seed % 61);
  const windKph = 3 + (seed % 41);

  const descriptions = ['Clear', 'Partly cloudy', 'Cloudy', 'Light rain', 'Rain', 'Storm'];
  const description = descriptions[seed % descriptions.length];

  return {
    temperatureC: Number(temperatureC.toFixed(1)),
    humidity: Math.round(humidity),
    windKph: Math.round(windKph),
    description,
  };
}

function deterministicWeatherFromCity(city, dayOffset = 0) {
  let h = 0;
  const s = city.toLowerCase();
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  const seed = h ^ dayOffset;

  const temperatureC = (seed % 3500) / 100 - 10;
  const humidity = 20 + (seed % 61);
  const windKph = 3 + (seed % 41);
  const descriptions = ['Clear', 'Partly cloudy', 'Cloudy', 'Light rain', 'Rain', 'Storm'];
  const description = descriptions[seed % descriptions.length];

  return {
    temperatureC: Number(temperatureC.toFixed(1)),
    humidity: Math.round(humidity),
    windKph: Math.round(windKph),
    description,
  };
}

function convertUnits(data, unit) {
  if (unit === 'imperial') {
    return {
      ...data,
      temperature: celsiusToFahrenheit(data.temperatureC),
      temperatureUnit: 'F',
      windSpeed: kphToMph(data.windKph),
      windUnit: 'mph',
    };
  }
  return {
    ...data,
    temperature: data.temperatureC,
    temperatureUnit: 'C',
    windSpeed: data.windKph,
    windUnit: 'kph',
  };
}

async function getWeather({ city, lat, lon, unit = 'metric' }) {
  const cacheKey = cache._generateKey('weather', city || { lat, lon }, unit);
  const cached = cache.get(cacheKey);

  if (cached) {
    return cached;
  }

  let data, location;
  if (city) {
    data = deterministicWeatherFromCity(city);
    location = { city };
  } else {
    data = deterministicWeatherFromCoords(lat, lon);
    location = { lat, lon };
  }

  const convertedData = convertUnits(data, unit);
  const result = {
    source: 'mock',
    location,
    ...convertedData,
    humidity: data.humidity,
    description: data.description,
    unit,
    timestamp: new Date().toISOString(),
  };

  cache.set(cacheKey, result);
  return result;
}

async function getForecast({ city, lat, lon, unit = 'metric', days = 7 }) {
  const cacheKey = cache._generateKey('forecast', city || { lat, lon }, unit, days);
  const cached = cache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const forecast = [];
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    let data;
    if (city) {
      data = deterministicWeatherFromCity(city, i);
    } else {
      data = deterministicWeatherFromCoords(lat, lon, i);
    }

    const convertedData = convertUnits(data, unit);
    forecast.push({
      date: date.toISOString().split('T')[0],
      ...convertedData,
      humidity: data.humidity,
      description: data.description,
    });
  }

  const result = {
    source: 'mock',
    location: city ? { city } : { lat, lon },
    unit,
    forecast,
    timestamp: new Date().toISOString(),
  };

  cache.set(cacheKey, result);
  return result;
}

async function getBatchWeather({ locations, unit = 'metric' }) {
  const results = [];

  for (const loc of locations) {
    try {
      const weather = await getWeather({ ...loc, unit });
      results.push({
        location: weather.location,
        success: true,
        data: weather,
      });
    } catch (err) {
      results.push({
        location: loc,
        success: false,
        error: err.message,
      });
    }
  }

  return {
    source: 'mock',
    unit,
    results,
    timestamp: new Date().toISOString(),
  };
}

module.exports = { getWeather, getForecast, getBatchWeather };


