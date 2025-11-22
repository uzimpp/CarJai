# 🚗 CarJai

CarJai is a **second-hand car marketplace platform** for Thailand, built by Jaiyoo Group 8.  
It connects **sellers** (car owners, dealers, resellers) with **buyers** through a trusted, easy-to-use system.

---

## 📖 Project Overview

**CarJai** is a comprehensive second-hand car marketplace platform designed specifically for the Thai market. The platform facilitates **direct connections** between car sellers and buyers with robust features for trust, transparency, and ease of use.

### Business Aim

- **Connect Buyers and Sellers**: Enable direct connections between car sellers and buyers without intermediaries
- **Trust & Transparency**: Build trust through document verification (OCR), price estimation, and user reporting
- **Easy-to-Use Platform**: Provide intuitive interface for searching, listing, and managing car sales
- **Market Price Transparency**: Help users make informed decisions using DLT (Department of Land Transport) market price data

**Target Vehicle Classes:** รย.1, รย.2, รย.3

---

## ✨ Features

**For Buyers:**
- 🔍 Search and filtering (brand, model, year, price, province, body type, transmission, fuel type)
- ❤️ Save favorites and view recent browsing history
- 📞 Direct contact with sellers (phone, LINE, Facebook, Instagram)
- 🚨 Report suspicious listings or sellers
- 🔐 Secure authentication (email/password or Google OAuth)

**For Sellers:**
- 📝 Create detailed listings with multiple images
- 📄 OCR document extraction (inspection certificates, registration books)
- 📋 Draft management (auto-save, status: draft/active/sold)
- 💵 Automatic price estimates based on DLT data, condition, mileage, and special conditions
- 👤 Build seller profile with contact methods and map link

**For Administrators:**
- 📊 Dashboard with statistics (Pending Reports, Active Cars, Sold Cars, Total Users) and visualizations
- 👥 User management (create, update, delete)
- 🚗 Car listing management (view, add, edit, delete, change status)
- 📋 Report management (review, resolve, status tracking, admin notes)
- 💰 Market price data management (upload DLT PDFs)
- 🔒 IP whitelist management for admin access
- 👨‍💼 Admin account management (Super Admin only)

**Security & Trust:**
- 🔐 Dual JWT authentication (users and admins)
- 🌐 Google OAuth integration
- 📧 Password reset via email
- 🛡️ IP whitelisting for admin portal
- ⚡ Rate limiting on sensitive endpoints
- 🚨 User reporting system
- ✅ Document verification (OCR)

---

## 🛠️ Prerequisites

**Required:**
- Docker (20.10+)
- Docker Compose (2.0+)
- Git

**Optional (for local development):**
- Go 1.24.3+ (backend)
- Node.js 18.x or 20.x (frontend)
- PostgreSQL 15+ (database)

---

## 📦 Dependencies

**Backend (Go):**
- PostgreSQL driver (`lib/pq`)
- JWT authentication (`golang-jwt/jwt/v5`)
- PDF processing (`ledongthuc/pdf`)
- Web scraping (`chromedp/chromedp`)

**Frontend (Next.js 15.5.2):**
- React 19.1.0
- TypeScript
- TailwindCSS
- Recharts (charts)
- React Hook Form

---

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/uzimpp/CarJai.git
cd CarJai
```

### 2. Environment Setup
```bash
cp env.example .env
# Edit .env with your configuration (database, JWT secrets, admin credentials, API keys)
```

### 3. Build & Run
```bash
# Build all services
docker compose --build -d
```

**Access:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- Database: localhost:5432

### 4. Database Migrations
Migrations run **automatically** when the database container is first created.

**Seed test data (optional):**
```bash
docker exec -it carjai-backend /app/scripts/seed --all
```

---

## 🏛️ Architecture

**Services:**
- `database` - PostgreSQL 15 on port `5432`
- `backend` - Go HTTP API server on port `8080`
- `frontend` - Next.js 15.5.2 on port `3000`

**Technology Stack:**
- **Backend**: Go 1.24.3, PostgreSQL 15, JWT authentication
- **Frontend**: Next.js 15.5.2, React 19.1.0, TypeScript, TailwindCSS
- **Infrastructure**: Docker & Docker Compose, GitHub Actions (CI/CD)

All services communicate via `carjai-network` Docker bridge network.

---

## 📚 Documentation

- **[User Documentation](docs/User-Documentation.md)** - Guide for buyers, sellers, and administrators
- **[API Documentation](docs/API-Documentation.md)** - API overview (see [Swagger](backend/docs/swagger.yaml) for complete details)
- **[Developer Documentation](docs/Developer-Documentation.md)** - Setup, structure, and workflow
- **[Docker Documentation](docs/Docker-Documentation.md)** - Docker setup and troubleshooting
- **[System Documentation](docs/System-Documentation.md)** - Architecture and deployment
- **[Test Documentation](docs/Test-Documentation.md)** - Testing strategy and CI/CD

**Additional Resources:**
- [Backend README](backend/README.md)
- [Frontend README](frontend/README.md)
- [Online SwaggerHub](https://app.swaggerhub.com/apis-docs/noneno/carjai-api/1.0.0)

---

## 📄 License

See [LICENSE](LICENSE) file for details.

---

## 👥 Contributors

Jaiyoo Group 8

---

## 🔗 Links

- **GitHub Repository**: https://github.com/uzimpp/CarJai
- **Swagger API Documentation**: https://app.swaggerhub.com/apis-docs/noneno/carjai-api/1.0.0

---
