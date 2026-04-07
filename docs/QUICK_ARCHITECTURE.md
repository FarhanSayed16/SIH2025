# Kavach - Quick Architecture Overview

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Admin UI   │  │  Teacher UI  │  │  Student UI   │     │
│  │ /admin/*     │  │ /teacher/*   │  │ /dashboard    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                  │                  │             │
│         └──────────────────┼──────────────────┘           │
│                            │                                │
│                    ┌───────▼────────┐                       │
│                    │  API Client    │                       │
│                    │  (Zustand)     │                       │
│                    └───────┬────────┘                       │
└────────────────────────────┼────────────────────────────────┘
                             │ HTTP/REST
                             │ JWT Token
┌────────────────────────────▼────────────────────────────────┐
│                    BACKEND (Node.js/Express)                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Middleware Layer                        │   │
│  │  ┌────────────┐  ┌────────────┐  ┌──────────────┐  │   │
│  │  │  Auth      │  │   RBAC     │  │  Validator   │  │   │
│  │  │ (JWT)      │  │ (Roles)    │  │  (express)   │  │   │
│  │  └────────────┘  └────────────┘  └──────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                  │
│  ┌────────────────────────▼──────────────────────────────┐ │
│  │              Controller Layer                           │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │ │
│  │  │   Auth   │ │  Class   │ │   User   │ │ Classroom│ │ │
│  │  │Controller│ │Controller│ │Controller│ │Controller│ │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │ │
│  └────────────────────────┬──────────────────────────────┘ │
│                            │                                │
│  ┌────────────────────────▼──────────────────────────────┐ │
│  │              Service Layer                              │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐              │ │
│  │  │   Auth  │ │ Classroom│ │  Teacher │              │ │
│  │  │ Service │ │  Service │ │  Service │              │ │
│  │  └──────────┘ └──────────┘ └──────────┘              │ │
│  └────────────────────────┬──────────────────────────────┘ │
└────────────────────────────┼────────────────────────────────┘
                             │
                             │ Mongoose ODM
┌────────────────────────────▼────────────────────────────────┐
│                    DATABASE (MongoDB)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Users   │  │  Classes │  │Institution│ │JoinRequest│   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 ER Diagram (Main Entities)

```
┌─────────────────┐
│   INSTITUTION   │
│─────────────────│
│ _id (PK)        │
│ name            │
│ address         │
│ contactInfo     │
│ isActive        │
└────────┬────────┘
         │
         │ 1:N
         │
┌────────▼────────┐         ┌─────────────────┐
│      USER       │         │      CLASS       │
│─────────────────│         │─────────────────│
│ _id (PK)        │         │ _id (PK)        │
│ email (UQ)       │         │ institutionId   │
│ name             │◄──┐    │ grade           │
│ role             │   │    │ section         │
│ institutionId ───┼───┼────┤ academicYear    │
│ approvalStatus   │   │    │ classCode (UQ)  │
│ approvedBy       │   │    │ teacherId ──────┼──┐
│ phone            │   │    │ studentIds[]    │  │
│ safetyStatus     │   │    │ joinQRCode (UQ) │  │
└──────────────────┘   │    │ roomNumber      │  │
                       │    │ capacity        │  │
                       │    └─────────────────┘  │
                       │                          │
                       │    ┌─────────────────┐  │
                       │    │ CLASSROOM_JOIN  │  │
                       │    │    REQUEST      │  │
                       │    │─────────────────│  │
                       │    │ _id (PK)        │  │
                       │    │ classId ────────┼──┘
                       │    │ studentId ──────┼──┐
                       │    │ studentInfo     │  │
                       │    │ status          │  │
                       │    │ requestedAt     │  │
                       │    │ processedBy ────┼──┘
                       │    └─────────────────┘
                       │
                       └─── Teacher/Student/Admin
```

---

## 🔄 Data Flow (Class Creation)

```
Admin → Frontend → API → Controller → Service → Database
  │        │         │        │          │         │
  │        │         │        │          │         │
  │   ┌────▼────┐    │        │          │         │
  │   │ Create  │    │        │          │         │
  │   │ Class   │    │        │          │         │
  │   │ Form    │    │        │          │         │
  │   └────┬────┘    │        │          │         │
  │        │         │        │          │         │
  │        │ POST    │        │          │         │
  │        ├─────────►        │          │         │
  │        │         │        │          │         │
  │        │         │ Auth   │          │         │
  │        │         ├────────►          │         │
  │        │         │        │          │         │
  │        │         │ RBAC   │          │         │
  │        │         ├────────►          │         │
  │        │         │        │          │         │
  │        │         │ Validate│         │         │
  │        │         ├────────►          │         │
  │        │         │        │          │         │
  │        │         │        │ Check    │         │
  │        │         │        ├──────────►         │
  │        │         │        │ Duplicate│         │
  │        │         │        │          │         │
  │        │         │        │          │ Query   │
  │        │         │        │          ├────────►
  │        │         │        │          │         │
  │        │         │        │          │ Response│
  │        │         │        │          ◄────────┤
  │        │         │        │          │         │
  │        │         │        │ Create/  │         │
  │        │         │        │ Update   │         │
  │        │         │        ├──────────►         │
  │        │         │        │          │         │
  │        │         │        │          │ Save    │
  │        │         │        │          ├────────►
  │        │         │        │          │         │
  │        │         │        │          │ Success │
  │        │         │        │          ◄────────┤
  │        │         │        │          │         │
  │        │         │ Response│         │         │
  │        │         ◄────────┤          │         │
  │        │         │        │          │         │
  │   ┌────▼────┐    │        │          │         │
  │   │ Success │    │        │          │         │
  │   │ Message │    │        │          │         │
  │   └─────────┘    │        │          │         │
```

---

## 🔐 Authentication Flow

```
User Login
    │
    ├─► POST /api/auth/login
    │       │
    │       ├─► Validate Credentials
    │       │
    │       ├─► Generate JWT Token
    │       │   (userId + role)
    │       │
    │       └─► Return Token + User Data
    │
    ├─► Store in Zustand + localStorage
    │
    └─► Use Token in API Requests
            │
            ├─► Authorization: Bearer <token>
            │
            ├─► Middleware: authenticate
            │   └─► Verify JWT → Load User from DB
            │
            ├─► Middleware: requireRole
            │   └─► Check Role (admin/teacher/student)
            │
            └─► Controller → Service → Database
```

---

## 👥 User Roles & Permissions

```
┌─────────────────────────────────────────────────────────┐
│                    SYSTEM_ADMIN                          │
│  ┌───────────────────────────────────────────────────┐   │
│  │ • Full System Access                             │   │
│  │ • Manage All Institutions                        │   │
│  │ • Manage All Users                               │   │
│  │ • Manage All Classes                              │   │
│  └───────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          │
                          │
┌─────────────────────────▼─────────────────────────────────┐
│                      ADMIN                                │
│  ┌───────────────────────────────────────────────────┐   │
│  │ • Manage Institution Users                        │   │
│  │ • Create/Edit Classes                             │   │
│  │ • Assign Teachers                                 │   │
│  │ • Approve/Reject Teachers                         │   │
│  │ • Generate QR Codes (any class)                   │   │
│  └───────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          │
                          │
┌─────────────────────────▼─────────────────────────────────┐
│                     TEACHER                                │
│  ┌───────────────────────────────────────────────────┐   │
│  │ Prerequisites:                                    │   │
│  │ • approvalStatus = "approved"                    │   │
│  │ • institutionId assigned                         │   │
│  │ • isActive = true                                │   │
│  └───────────────────────────────────────────────────┘   │
│  ┌───────────────────────────────────────────────────┐   │
│  │ Permissions:                                      │   │
│  │ • View Assigned Classes                          │   │
│  │ • Generate QR Codes (own classes)                │   │
│  │ • Approve/Reject Students                        │   │
│  │ • View Class Students                            │   │
│  │ • Create Roster Students (KG-4)                 │   │
│  └───────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          │
                          │
┌─────────────────────────▼─────────────────────────────────┐
│                     STUDENT                                │
│  ┌───────────────────────────────────────────────────┐   │
│  │ • Scan QR Code to Join Class                     │   │
│  │ • View Own Classes                              │   │
│  │ • Limited Access                                │   │
│  └───────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
kavach/
├── backend/
│   ├── src/
│   │   ├── config/          # Database, Logger
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Auth, RBAC, Validation
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   └── utils/           # Helpers
│   └── scripts/             # Migration scripts
│
├── web/
│   ├── app/
│   │   ├── admin/           # Admin pages
│   │   ├── teacher/         # Teacher pages
│   │   └── login/           # Auth pages
│   ├── components/          # React components
│   └── lib/
│       ├── api/             # API clients
│       └── store/           # Zustand stores
│
└── docs/                    # Documentation
```

---

## 🔄 Key Workflows

### 1. Teacher Approval Flow
```
Teacher Registers
    ↓
Admin Reviews
    ↓
Admin Approves/Rejects
    ↓
Teacher Gets Access (if approved)
```

### 2. Student Join Flow
```
Teacher Generates QR Code
    ↓
Student Scans QR Code
    ↓
Join Request Created
    ↓
Teacher Reviews Request
    ↓
Teacher Approves/Rejects
    ↓
Student Added to Class (if approved)
```

### 3. Class Creation Flow
```
Admin Creates Class
    ↓
System Checks for Duplicates
    ↓
If Exists → Return Existing
If Not → Create New
    ↓
Assign Teacher (optional)
    ↓
Class Ready for Use
```

---

## 🛠️ Technology Stack

**Frontend:**
- Next.js 14+ (React Framework)
- TypeScript
- Tailwind CSS
- Zustand (State Management)

**Backend:**
- Node.js
- Express.js
- MongoDB
- Mongoose (ODM)
- JWT (Authentication)
- Winston (Logging)

**Tools:**
- Git
- npm/yarn
- MongoDB Compass

---

**Last Updated:** December 1, 2025

