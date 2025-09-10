# Database Migrations

This directory contains database migration files for the CarJai application.

## Migration Files

- `001_admin_auth.sql` - Admin authentication system tables and initial data

## Running Migrations

### Using psql (PostgreSQL command line)
```bash
psql -h localhost -U postgres -d carjai -f migrations/001_admin_auth.sql
```

### Using Docker
```bash
docker exec -i carjai-db psql -U postgres -d carjai < migrations/001_admin_auth.sql
```

## Migration Naming Convention

- Use sequential numbers: `001_`, `002_`, etc.
- Use descriptive names: `admin_auth`, `user_management`, etc.
- Use lowercase with underscores

## Default Admin Account

After running the migration, you can login with:
- Username: `admin`
- Password: `admin123`

**⚠️ Important: Change the default password in production!**

## IP Whitelist

The default admin account has the following IP addresses whitelisted:
- `127.0.0.1/32` (localhost IPv4)
- `::1/128` (localhost IPv6)

Add your IP address to the whitelist before accessing the admin panel from other machines.
