const express = require('express');

const {
  validateWeatherQuery,
  validateWeatherBody,
  validateForecastQuery,
  validateForecastBody,
  validateBatchWeatherBody,
} = require('../validation/weatherValidator');
const { getWeather, getForecast, getBatchWeather } = require('../services/weatherService');

const weatherRouter = express.Router();

weatherRouter.get('/', async (req, res, next) => {
  try {
    const data = validateWeatherQuery(req.query);
    const weather = await getWeather(data);
    return res.json(weather);
  } catch (err) {
    return next(err);
  }
});

weatherRouter.post('/', async (req, res, next) => {
  try {
    const data = validateWeatherBody(req.body);
    const weather = await getWeather(data);
    return res.json(weather);
  } catch (err) {
    return next(err);
  }
});

weatherRouter.get('/forecast', async (req, res, next) => {
  try {
    const data = validateForecastQuery(req.query);
    const forecast = await getForecast(data);
    return res.json(forecast);
  } catch (err) {
    return next(err);
  }
});

weatherRouter.post('/forecast', async (req, res, next) => {
  try {
    const data = validateForecastBody(req.body);
    const forecast = await getForecast(data);
    return res.json(forecast);
  } catch (err) {
    return next(err);
  }
});

weatherRouter.post('/batch', async (req, res, next) => {
  try {
    const data = validateBatchWeatherBody(req.body);
    const batchWeather = await getBatchWeather(data);
    return res.json(batchWeather);
  } catch (err) {
    return next(err);
  }
});

module.exports = { weatherRouter };


