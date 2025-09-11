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
git clone https://github.com/uzimpp/carjai.git
cd carjai
```

### 3. Environment Setup

Create the required `.env` files for both frontend and backend:

```
├── backend/
│   ├── .env
├── frontend/
│   ├── .env
├── docker-compose.yml

```

⚠️ **Important**: 
- Change the `JWT_SECRET` to a secure random string (minimum 32 characters)
- Update admin credentials (`ADMIN_USERNAME`, `ADMIN_PASSWORD`) for production
- The backend `.env` file is required for the API to function
- The frontend `.env.local` file is required for API communication

### 4. Install frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```
App available at: http://localhost:3000

### 5. Run backend (Go API)
```bash
cd backend
go mod tidy
go run main.go
```
API available at: http://localhost:8080

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

run everything with:
```bash
docker compose up -d
```
