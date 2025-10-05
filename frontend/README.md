# CarJai Frontend - Next.js Application

A modern, responsive frontend application for CarJai built with Next.js 14, featuring user authentication, admin dashboard, and document verification capabilities.

## 🚀 Features

### Authentication & User Management
- **🔐 Dual Authentication** - Separate sign in systems for users and admins
- **👤 User Registration & Sign In** - Complete user account management
- **🛡️ Protected Routes** - Secure route protection with authentication guards
- **🔄 Session Management** - Automatic token refresh and session handling

### Admin Dashboard
- **📊 Admin Panel** - Comprehensive admin dashboard for system management
- **🛡️ IP Whitelist Management** - Admin IP address management interface
- **👥 User Management** - User account administration and monitoring
- **📈 System Monitoring** - Real-time system health and metrics

### Document Verification
- **📄 OCR Integration** - AI-powered document scanning and verification
- **🔍 Document Upload** - Secure document upload with validation
- **✅ Verification Workflow** - Complete document verification process
- **📋 Document Management** - Document history and status tracking


## 🏗️ Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── about-us/          # About us page
│   │   ├── admin/             # Admin dashboard pages
│   │   │   ├── dashboard/     # Admin dashboard
│   │   │   └── signin/        # Admin sign in
│   │   ├── buy/               # Car buying page
│   │   ├── signin/            # User sign in page
│   │   ├── signup/            # User registration page
│   │   ├── verify-document/   # Document verification page
│   │   ├── privacy/           # Privacy policy
│   │   ├── terms/             # Terms of service
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home page
│   │   └── globals.css        # Global styles
│   ├── components/            # React components
│   │   ├── auth/              # Authentication components
│   │   │   └── ProtectedRoute.tsx
│   │   ├── features/          # Feature-specific components
│   │   │   └── ocr/           # OCR document components
│   │   │       └── DocumentUploader.tsx
│   │   └── global/            # Global UI components
│   │       ├── footer.tsx
│   │       ├── navbar.tsx
│   │       └── searchbar.tsx
│   ├── config/                # Configuration files
│   │   └── env.ts
│   ├── constants/             # Application constants
│   │   ├── admin.ts
│   │   └── user.ts
│   ├── hooks/                 # Custom React hooks
│   │   ├── useAdminAuth.ts
│   │   └── useUserAuth.ts
│   └── lib/                   # Utility libraries
│       ├── adminAuth.ts
│       └── auth.ts
├── public/                    # Static assets
│   ├── assets/               # Images and media
│   │   └── cars/             # Car images
│   ├── fonts/                # Custom fonts
│   └── logo/                 # Logo assets
├── package.json
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

## 📱 Pages & Routes

### Public Pages
- `/` - Home page
- `/about-us` - About us page
- `/signin` - User sign in
- `/signup` - User registration
- `/privacy` - Privacy policy
- `/terms` - Terms of service

### User Pages
- `/buy` - Car marketplace (requires user auth)
- `/verify-document` - Document verification (requires user auth)

### Admin Pages
- `/admin/signin` - Admin sign in
- `/admin/dashboard` - Admin dashboard (requires admin auth)

### Code Quality
- **TypeScript** - Full type safety
- **ESLint** - Code linting and formatting
- **Prettier** - Code formatting
- **Tailwind CSS** - CSS framework

### Docker
```bash
# Build Docker image
docker build -t carjai-frontend .

# Run container
docker run -p 3000:3000 carjai-frontend
```

### Environment Variables for Production
```env
NEXT_PUBLIC_API_URL=https://api.carjai.com
NODE_ENV=production
```
