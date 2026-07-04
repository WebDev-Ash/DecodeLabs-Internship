<!-- markdownlint-disable MD034 -->
<!-- markdownlint-disable MD032 -->
<!-- markdownlint-disable MD022 -->
<!-- markdownlint-disable MD031 -->
<!-- markdownlint-disable MD029 -->
# Contact Store Service (Express + Mongoose)

Implements CRUD for `Contact` using:
- Express
- Mongoose (MongoDB)

## Requirements
- Node.js
- MongoDB (local or hosted)

## Setup
```bash
npm install
```

## Run
```bash
npm start
```

By default it connects to:
- `mongodb://127.0.0.1:27017/contacts_db`

You can override via env var:
- `MONGODB_URI`
- `PORT`

Example:
```bash
set MONGODB_URI=mongodb://127.0.0.1:27017/contacts_db
set PORT=3000
npm start
```

## Endpoints
### Health
- `GET /health`

### Contacts CRUD
Base: `/api/contacts`

1) Create
- `POST /api/contacts`
```json
{
  "contactname": "John Doe",
  "phone": "1234567890",
  "email": "john@example.com",
  "address": "221B Baker Street"
}
```

2) Read all
- `GET /api/contacts`

3) Read one
- `GET /api/contacts/:id`

4) Update
- `PUT /api/contacts/:id`
```json
{
  "contactname": "John Doe",
  "phone": "1234567890",
  "email": "john@example.com",
  "address": "New Address"
}
```

5) Delete
- `DELETE /api/contacts/:id`
