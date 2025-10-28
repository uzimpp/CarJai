# CarJai Backend

A Go backend for the CarJai car marketplace featuring dual authentication, car management, and admin controls.

## ✨ Features

- 🔐 **Dual Authentication** - Separate admin and user JWT systems
- 🚗 **Car Management** - CRUD operations for car listings
- 👤 **User Profiles** - Buyer and seller profile management
- 🛡️ **Security** - IP whitelist, rate limiting, CORS protection
- 📊 **Admin Dashboard** - System administration and IP management

## 🚀 Quick Start

```bash
# Copy environment template
cp env.example .env

# Start with Docker Compose
docker compose up -d

# Or run manually
go mod tidy
go run main.go
```
## 📚 Documentation

- [APIs](docs/swagger.yaml) - Complete API reference
- [Database Schema](docs/SCHEMA.md) - Database structure and relationships
- [Testing Guide](docs/TESTING.md) - How to test the backend

## 🏗️ Project Structure

```
backend/
├── config/          # Configuration management
├── handlers/        # HTTP request handlers
├── middleware/      # CORS, auth, rate limiting
├── models/          # Database models & repositories
├── routes/          # API route definitions
├── services/        # Business logic services
├── utils/           # Utility functions
├── migrations/      # Database schema migrations
├── tests/           # Test files
├── docs/            # Documentation
└── main.go          # Application entry point
```

## 📄 License

MIT License - see [LICENSE](../LICENSE) file for details.
