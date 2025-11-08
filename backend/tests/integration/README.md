# Integration Tests

Integration tests สำหรับ API endpoints ทั้งหมดที่ใช้ database และ HTTP server จริง

## การรัน Tests

### ใน Docker Container

```bash
# Start services
docker compose up -d

# Run integration tests
docker compose exec backend go test ./tests/integration/... -v

# หรือรันเฉพาะไฟล์
docker compose exec backend go test ./tests/integration/api_integration_test.go -v
```

### ใน Local (ต้องมี database running)

```bash
cd backend
go test ./tests/integration/... -v
```

## Test Coverage

- Health endpoint
- User authentication flow (signup, signin, me)
- Car endpoints (search, create)
- Reference data endpoint
- Admin authentication flow

## Requirements

- Database ต้อง running และมี migrations ถูก apply แล้ว
- Environment variables ต้องถูกตั้งค่าใน `.env` หรือ system environment

