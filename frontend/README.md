# CarJai Frontend - Next.js Application

A modern car marketplace frontend built with Next.js 14, featuring user authentication, admin dashboard, and car listing management.

## 🚀 Features

- **🔐 Dual Authentication** - Separate user and admin sign-in systems
- **🚗 Car Marketplace** - Browse, search, and manage car listings
- **👤 User Profiles** - Buyer and seller profile management
- **📊 Admin Dashboard** - System administration and IP whitelist management
- **🛡️ Protected Routes** - Secure authentication guards


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

## 📱 Key Pages

- `/` - Home page
- `/signin` - User sign in
- `/signup` - User registration  
- `/buy` - Car marketplace
- `/admin/signin` - Admin sign in
- `/admin/dashboard` - Admin dashboard

## 🛠️ Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **ESLint/Prettier** - Code quality

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🔧 Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```
