<!-- markdownlint-disable MD041 -->
<!-- markdownlint-disable MD047 -->
To use api first run:
npm install
then run server.js:
npm start
Endpoints to check working of api:

- GET / : Root info
- GET /health : Health check
- GET /weather?city=London&unit=imperial : Current weather
- POST /weather with body: { "city": "Paris", "unit": "metric" }
- GET /weather/forecast?lat=40.7128&lon=-74.0060&days=5 : 5-day forecast
- POST /weather/forecast with body: { "city": "Tokyo", "days": 10, "unit": "imperial" }
- POST /weather/batch with body: { "locations": [{"city": "London"}, {"lat": 40.7128, "lon": -74.0060}], "unit": "metric" }