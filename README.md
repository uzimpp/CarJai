# 🚗 CarJai

CarJai is a **second-hand car marketplace platform** for Thailand, built by Jaiyoo Group 8.  
It connects **sellers** (car owners, dealers, resellers) with **buyers** through a trusted, easy-to-use system.  

---

## 📖 Project Overview

**CarJai** is a comprehensive second-hand car marketplace platform designed specifically for the Thai market. The platform facilitates direct connections between car sellers and buyers with robust features for trust, transparency, and ease of use.

### Key Features

**For Buyers:**
- 🔍 Search and filtering (brand, model, year, price, province, body type, transmission, fuel type)
- ❤️ Save favorite listings for easy access
- 📊 View recent browsing history
- 📞 Direct contact with sellers (phone, LINE, Facebook, Instagram)
- 🚨 Report suspicious listings or sellers
- 💰 View estimated market prices based on DLT data
- 🔐 Secure authentication (email/password or Google OAuth)

**For Sellers:**
- 📝 Create detailed car listings with multiple images
- 📄 Upload inspection certificates with OCR extraction
- 📋 Auto-save draft listings
- 💵 Get automatic price estimates based on market data
- 📱 Manage multiple contact methods
- 👤 Build seller profile with about section and map link
- 📊 Track listing performance

**For Administrators:**
- 📊 Comprehensive dashboard with statistics and charts
- 👥 User management (create, update, delete, ban)
- 🚗 Car listing management
- 📋 Report review and resolution system
- 💰 Market price data management (upload DLT PDFs)
- 🔒 IP whitelist management for admin access
- 👨‍💼 Admin account management (super admin only)

**Security & Trust:**
- 🔐 Dual JWT authentication (users and admins)
- 🌐 Google OAuth integration
- 📧 Password reset via email
- 🛡️ IP whitelisting for admin portal
- ⚡ Rate limiting on sensitive endpoints
- 🚨 User reporting system
- ✅ Document verification (OCR)

**Target Vehicle Classes:** รย.1, รย.2, รย.3

---

## ⚙️ Setup Guide

### 1. Prerequisites
- Docker (for containerized run)  

### 2. Clone the repo
```bash
git clone https://github.com/uzimpp/carjai.git
cd carjai
```

### 3. Environment Setup
Copy `env.example` to `.env` and configure:
- Database credentials
- JWT secrets
- Admin credentials
- External API keys

```bash
# Copy environment templates
cp env.example .env
```

The structure should look like this
```
├── backend/
├── frontend/
├── .env
├── env.example
├── docker-compose.yml

```

## 🐳 Run with Docker

run everything with:
```bash
docker compose up -d
```

→ Visit Frontend at http://localhost:3000
→ Visit Backend at http://localhost:8080

## 📚 Documentation

- [API Documentation](backend/docs/API.md) - Complete API reference
- [Backend Docs](backend/README.md) - Backend-specific documentation
- [Frontend Docs](frontend/README.md) - Frontend-specific documentation
