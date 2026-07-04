const { z } = require('zod');

const latSchema = z.number().min(-90).max(90);
const lonSchema = z.number().min(-180).max(180);

const citySchema = z
  .string()
  .trim()
  .min(2)
  .max(100)
  .regex(/^[a-zA-Z\s.'-]+$/, {
    message: 'City must contain only letters and common separators.',
  });

const unitSchema = z.enum(['metric', 'imperial']).default('metric');

const daysSchema = z.number().min(1).max(14).default(7);

function parseLat(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') return Number(value);
  return value;
}

function parseLon(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') return Number(value);
  return value;
}

function parseDays(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') return Number(value);
  return value;
}

const baseLocationSchema = z.object({
  lat: z.preprocess(parseLat, latSchema.optional()),
  lon: z.preprocess(parseLon, lonSchema.optional()),
  city: citySchema.optional(),
});

function validateLocation(data) {
  const hasCoords = data.lat !== undefined || data.lon !== undefined;
  const hasCity = data.city !== undefined;
  if (hasCity && hasCoords) return false;
  if (!hasCity && hasCoords) return data.lat !== undefined && data.lon !== undefined;
  if (hasCity && !hasCoords) return true;
  return false;
}

const weatherQuerySchema = baseLocationSchema
  .extend({
    unit: unitSchema.optional(),
  })
  .refine(validateLocation, 'Provide either city OR both lat and lon');

const weatherBodySchema = baseLocationSchema
  .extend({
    unit: unitSchema.optional(),
  })
  .refine(validateLocation, 'Provide either city OR both lat and lon');

const forecastQuerySchema = baseLocationSchema
  .extend({
    unit: unitSchema.optional(),
    days: z.preprocess(parseDays, daysSchema.optional()),
  })
  .refine(validateLocation, 'Provide either city OR both lat and lon');

const forecastBodySchema = baseLocationSchema
  .extend({
    unit: unitSchema.optional(),
    days: daysSchema.optional(),
  })
  .refine(validateLocation, 'Provide either city OR both lat and lon');

const batchLocationSchema = baseLocationSchema.refine(
  validateLocation,
  'Provide either city OR both lat and lon for each location'
);

const batchWeatherBodySchema = z.object({
  locations: z.array(batchLocationSchema).min(1).max(20),
  unit: unitSchema.optional(),
});

function validateWeatherQuery(query) {
  const parsed = weatherQuerySchema.safeParse(query);
  if (!parsed.success) {
    const err = new Error('Invalid request parameters');
    err.statusCode = 400;
    err.issues = parsed.error.issues;
    throw err;
  }
  return parsed.data;
}

function validateWeatherBody(body) {
  const parsed = weatherBodySchema.safeParse(body);
  if (!parsed.success) {
    const err = new Error('Invalid request body');
    err.statusCode = 400;
    err.issues = parsed.error.issues;
    throw err;
  }
  return parsed.data;
}

function validateForecastQuery(query) {
  const parsed = forecastQuerySchema.safeParse(query);
  if (!parsed.success) {
    const err = new Error('Invalid request parameters');
    err.statusCode = 400;
    err.issues = parsed.error.issues;
    throw err;
  }
  return parsed.data;
}

function validateForecastBody(body) {
  const parsed = forecastBodySchema.safeParse(body);
  if (!parsed.success) {
    const err = new Error('Invalid request body');
    err.statusCode = 400;
    err.issues = parsed.error.issues;
    throw err;
  }
  return parsed.data;
}

function validateBatchWeatherBody(body) {
  const parsed = batchWeatherBodySchema.safeParse(body);
  if (!parsed.success) {
    const err = new Error('Invalid request body');
    err.statusCode = 400;
    err.issues = parsed.error.issues;
    throw err;
  }
  return parsed.data;
}

module.exports = {
  validateWeatherQuery,
  validateWeatherBody,
  validateForecastQuery,
  validateForecastBody,
  validateBatchWeatherBody,
};
