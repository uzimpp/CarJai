# CarJai Backend

Go backend API for the CarJai car marketplace.

## 🛠️ Tech Stack

- **Go 1.24.3+** - Programming language
- **PostgreSQL 15** - Database
- **JWT** - Authentication

## 🏗️ Structure

```
backend/
├── config/          # Configuration
├── handlers/        # HTTP handlers
├── middleware/      # Auth, CORS, rate limiting
├── models/          # Database models & repositories
├── routes/          # API routes
├── services/        # Business logic
├── utils/           # Utilities
├── migrations/      # Database migrations
├── tests/           # Test files
└── main.go          # Entry point
```

## 🚀 Run with Docker

Run from project root using Docker Compose:

```bash
docker compose up -d backend
```

API available at: http://localhost:8080

See root `README.md` for complete setup instructions.

## 📚 Documentation

- [API Reference](docs/swagger.yaml)
- [Database Schema](docs/schema.md)
