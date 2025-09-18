# 🚗 CarJai

CarJai is a **second-hand car marketplace platform** for Thailand, built by Jaiyoo Group 8.  
It connects **sellers** (car owners, dealers, resellers) with **buyers** through a trusted, easy-to-use system.  

---

## 📖 Project Overview
**Key Features: **
- Buyers can browse, search, and filter cars (brand, model, year, price, province).
- Sellers can create listings with car details, photos, and supporting documents.
- Admins can approve/reject listings, verify documents, and ban fraudulent sellers.
- Secure login (JWT), marketplace filters, and fraud prevention mechanisms.
- Target vehicle classes: **รย.1, รย.2, รย.3**.

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
