# How to Seed Demo Cars in Docker 🐳

## วิธีที่ 1: ใช้ docker exec (แนะนำ - ง่ายที่สุด)

### 1. Start containers:
```bash
docker compose up --build -d
```

### 2. รอให้ containers พร้อม (~30 วินาที):
```bash
# ตรวจสอบว่า containers running หมดแล้ว
docker compose ps
```

### 3. Run seed script ใน backend container:
```bash
# วิธี 1: ใช้ script ที่เตรียมไว้
chmod +x backend/scripts/seed_demo_cars_docker.sh
./backend/scripts/seed_demo_cars_docker.sh

# หรือวิธี 2: Run command โดยตรง
docker exec -it carjai-backend go run /app/scripts/seed_demo_cars.go
```

### 4. ตรวจสอบผลลัพธ์:
เปิดเว็บ: http://localhost:3000/browse

คุณจะเห็นรถ 30 คัน พร้อมรูปภาพ!

---

## วิธีที่ 2: เพิ่ม Seed Service ใน docker-compose.yml (Auto-seed)

ถ้าต้องการให้ seed อัตโนมัติทุกครั้งที่ start containers:

### 1. เพิ่ม service ใน docker-compose.yml:
```yaml
  # Seed service (runs once and exits)
  seed:
    build:
      context: ./backend
      dockerfile: dockerfile
    environment:
      DB_NAME: ${DB_NAME}
      DB_PASSWORD: ${DB_PASSWORD}
      DB_USER: ${DB_USER}
      DB_HOST: database
      DB_PORT: 5432
    volumes:
      - ./frontend/public/assets:/app/frontend/public/assets:ro
    networks:
      - carjai-network
    depends_on:
      database:
        condition: service_healthy
    command: go run /app/scripts/seed_demo_cars.go
    restart: "no"
```

### 2. Start ทุกอย่าง:
```bash
docker compose up --build -d
```

Seed service จะ run 1 ครั้งแล้วหยุดเอง

---

## การ Verify ว่า Seed สำเร็จ

### 1. ตรวจสอบ logs:
```bash
# ดู logs จาก seed script
docker logs carjai-backend

# ควรเห็น:
# ✓ Created demo seller (ID: 1)
# ✓ Loaded 77 provinces
# Creating 30 demo cars...
# ✓ Car 1 created (ID: 1)
# ...
# ✅ Demo data seeding completed!
```

### 2. ตรวจสอบใน Database:
```bash
# เข้า database container
docker exec -it carjai-database-1 psql -U carjai_user -d carjai

# Run SQL:
SELECT COUNT(*) FROM cars WHERE status = 'active';
-- ควรได้ 30

SELECT email FROM users WHERE email = 'demo-seller@carjai.com';
-- ควรเห็น email

\q  # ออกจาก psql
```

### 3. ทดสอบ API:
```bash
curl http://localhost:8080/api/cars/search?limit=5
```

### 4. ทดสอบ Frontend:
เปิด: http://localhost:3000/browse

ทดสอบ filters:
- ✅ Filter by Fuel Type (Gasoline, Diesel, etc.)
- ✅ Filter by Body Type (Pickup, SUV, etc.)
- ✅ Price range
- ✅ Year range

---

## Troubleshooting 🔧

### ปัญหา: "Failed to connect to database"
**แก้ไข:**
```bash
# ตรวจสอบว่า database container running
docker compose ps database

# ดู logs
docker compose logs database

# Restart database
docker compose restart database
```

### ปัญหา: "Failed to read image"
**สาเหตุ:** Volume mount ไม่ถูกต้อง

**แก้ไข:**
```bash
# ตรวจสอบว่า mount ถูก
docker exec -it carjai-backend ls /app/frontend/public/assets/cars

# ควรเห็นรูปภาพ:
# alphard.jpg
# bmw.png
# honda_civic.png
# ...
```

### ปัญหา: "Car already exists" (chassis number duplicate)
**แก้ไข:** ลบข้อมูล demo ก่อน run ใหม่
```bash
# เข้า database
docker exec -it carjai-database-1 psql -U carjai_user -d carjai

# ลบข้อมูล demo
DELETE FROM cars WHERE chassis_number LIKE 'DEMO%';
DELETE FROM sellers WHERE user_id = (
  SELECT id FROM users WHERE email = 'demo-seller@carjai.com'
);
DELETE FROM users WHERE email = 'demo-seller@carjai.com';

\q
```

---

## Clean Up ข้อมูล Demo

### ลบเฉพาะรถ 30 คัน:
```bash
docker exec -it carjai-database-1 psql -U carjai_user -d carjai \
  -c "DELETE FROM cars WHERE chassis_number LIKE 'DEMO%';"
```

### ลบทุกอย่าง (รวม seller):
```bash
docker exec -it carjai-database-1 psql -U carjai_user -d carjai -c "
DELETE FROM cars WHERE seller_id = (
  SELECT id FROM sellers WHERE user_id = (
    SELECT id FROM users WHERE email = 'demo-seller@carjai.com'
  )
);
DELETE FROM sellers WHERE user_id = (
  SELECT id FROM users WHERE email = 'demo-seller@carjai.com'
);
DELETE FROM users WHERE email = 'demo-seller@carjai.com';
"
```

---

## สรุป Quick Commands 🚀

```bash
# 1. Start everything
docker compose up --build -d

# 2. Seed demo data
docker exec -it carjai-backend go run /app/scripts/seed_demo_cars.go

# 3. Check results
curl http://localhost:8080/api/cars/search?limit=5

# 4. Open browser
open http://localhost:3000/browse

# 5. Clean up (if needed)
docker exec -it carjai-database-1 psql -U carjai_user -d carjai \
  -c "DELETE FROM cars WHERE chassis_number LIKE 'DEMO%';"
```

---

## Notes 📝

- **Seed script รองรับทั้ง local และ Docker** - จะ auto-detect path
- **Images ถูก mount แบบ read-only** (`:ro`) - ปลอดภัย
- **Demo seller email:** `demo-seller@carjai.com`
- **รถทั้งหมดมีสถานะ:** `active` (แสดงใน browse ทันที)
- **รูปภาพ:** 6-10 รูป/คัน (สุ่มจาก 20 รูป)

