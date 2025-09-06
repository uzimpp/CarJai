# 🚗 CarJai

CarJai is a **second-hand car marketplace platform** for Thailand, built by Jaiyoo Group 8.  
It connects **sellers** (car owners, dealers, resellers) with **buyers** through a trusted, easy-to-use system.  

---

## 📖 Project Overview
**Key Features (planned):**
- Buyers can browse, search, and filter cars (brand, model, year, price, province).
- Sellers can create listings with car details, photos, and supporting documents.
- Admins can approve/reject listings, verify documents, and ban fraudulent sellers.
- Secure login (JWT), marketplace filters, and fraud prevention mechanisms.
- Target vehicle classes: **รย.1, รย.2, รย.3**.

---

## ⚙️ Setup Guide

### 1. Prerequisites
- Node.js (>= 18) & npm / yarn  
- Go (>= 1.22)  
- PostgreSQL (>= 15)  
- Docker (optional for containerized run)  

### 2. Clone the repo
```bash
git clone https://github.com/<org-or-user>/carjai.git
cd carjai
```

3. Install frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```
App available at: http://localhost:3000

4. Run backend (Go API)
```bash
cd backend
go mod tidy
go run main.go
```
API available at: http://localhost:8080

5. Setup database
```bash
createdb carjai_dev
psql -d carjai_dev -f schema.sql
```

---

## 🐳 Run with Docker

After building images, you can run containers directly:

Frontend
```bash
docker build -t carjai-frontend ./frontend
docker run -it --name frontend -p 3000:3000 --rm carjai-frontend
```
→ Visit http://localhost:3000

Backend
```bash
docker build -t carjai-backend ./backend
docker run -it --rm --name backend -p 8080:8080 carjai-backend
```
→ Visit http://localhost:8080

Docker Compose

run everything with:
```bash
docker compose up
```

---

## 📄 License
This project is for Kasetsart University coursework and educational purposes only.
