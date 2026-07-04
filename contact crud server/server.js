const express = require('express');
const mongoose = require('mongoose');

const { ContactsRouter } = require('./src/routes/contacts');
const { errorHandler, notFoundHandler } = require('./src/middleware/errors');

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/contacts', ContactsRouter);
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/contacts_db';

async function start() {
  await mongoose.connect(MONGODB_URI, {
    autoIndex: true
  });

  app.listen(PORT, () => {
    console.log(`Contact service listening on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

