# EduSafe Admin Dashboard

Next.js admin dashboard for managing drills, alerts, and devices.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API running (see `backend/README.md`)

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your backend URL
# NEXT_PUBLIC_API_URL=http://localhost:3000/api
# NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

### Development

```bash
# Start development server
npm run dev

# Open http://localhost:3001
```

### Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 📁 Project Structure

```
web/
├── app/                    # Next.js app directory
│   ├── login/             # Login page
│   ├── dashboard/          # Dashboard page
│   ├── drills/            # Drill management
│   ├── devices/           # Device list
│   └── map/               # Map placeholder
├── components/            # React components
│   ├── ui/               # UI components (Button, Input, Card)
│   └── layout/           # Layout components (Sidebar, Header)
├── lib/                  # Utilities and services
│   ├── api/             # API clients
│   ├── store/           # Zustand stores
│   ├── services/        # Services (Socket.io)
│   └── config/          # Configuration
└── public/              # Static assets
```

## 🔑 Authentication

The app uses JWT tokens stored in localStorage. Login credentials should match backend seed data.

**Demo Credentials:**
- Email: `admin@school.com`
- Password: (from backend seed script)

## 📡 Real-time Features

The dashboard connects to the backend Socket.io server to receive:
- `CRISIS_ALERT` - Emergency alerts
- `DRILL_SCHEDULED` - New drill notifications
- `DRILL_SUMMARY` - Drill completion summaries

## 🎨 Features

- ✅ Admin login
- ✅ Dashboard with live counters
- ✅ Drill scheduling
- ✅ Real-time event viewer
- ✅ Device management
- ✅ Socket.io integration

## 🔧 Configuration

Edit `.env` to configure:
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_SOCKET_URL` - Socket.io server URL

## 📝 API Integration

The app integrates with backend APIs:
- `/api/auth/login` - Authentication
- `/api/drills` - Drill management
- `/api/alerts` - Alert management
- `/api/devices` - Device listing

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Other Platforms

Build the app and deploy the `.next` folder:
```bash
npm run build
npm start
```

## 📚 Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [Socket.io Client](https://socket.io/docs/v4/client-api/)

## ✅ Status

Phase 2.9: Admin Web Shell - **COMPLETE** ✅

**Ready for Phase 2.10!** 🚀
