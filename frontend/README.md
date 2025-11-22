# CarJai Frontend

Next.js frontend application for the CarJai car marketplace.

## 🛠️ Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework

## 🏗️ Structure

```
frontend/
├── src/
│   ├── app/              # Next.js pages (App Router)
│   ├── components/       # React components
│   ├── lib/              # API clients & utilities
│   ├── hooks/            # Custom React hooks
│   ├── contexts/         # React contexts
│   ├── types/            # TypeScript types
│   └── utils/            # Utility functions
├── public/               # Static assets
├── package.json
└── next.config.ts
```

## 🚀 Run with Docker

Run from project root using Docker Compose:

```bash
docker compose up -d frontend
```

Access at: http://localhost:3000

See root `README.md` for complete setup instructions.
