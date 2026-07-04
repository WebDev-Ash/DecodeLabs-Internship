require('dotenv').config();
const express = require('express');

const { healthRouter } = require('./src/routes/health');
const { weatherRouter } = require('./src/routes/weather');
const { errorHandler } = require('./src/middleware/errorHandler');
const { logger } = require('./src/middleware/logger');

const app = express();

app.use(express.json({ limit: '50kb' }));
app.use(logger);

app.get('/', (req, res) => {
  res.json({
    name: 'weather-api',
    version: '1.1.0',
    status: 'ok',
    endpoints: {
      health: '/health',
      weather: {
        current: '/weather',
        forecast: '/weather/forecast',
        batch: '/weather/batch',
      },
    },
  });
});

app.use('/health', healthRouter);
app.use('/weather', weatherRouter);

app.use(errorHandler);

const port = process.env.PORT ? Number(process.env.PORT) : 3000;
app.listen(port, () => {
  console.log(`Weather API listening on port ${port}`);
});


