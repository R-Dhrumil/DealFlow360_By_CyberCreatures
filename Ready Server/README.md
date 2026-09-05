# 🚀 Hackathon Express Backend (PostgreSQL Direct SQL / pg Pool)

Supercharged, hackathon-ready backend boilerplate with **Pure Raw SQL** (`pg` connection pooling) — **100% compliant with hackathons that prohibit ORMs**.

Works seamlessly out-of-the-box with **Supabase**, **Railway**, **Neon**, **Render**, **Aiven**, **Docker**, and **Local PostgreSQL**.

Includes pre-configured JWT Auth, Email OTP, Universal File Uploads, Swagger UI, Real-time Socket.IO, Dynamic RBAC, PDF/Excel Exports, and an Exportable Frontend SDK.

---

## ⚡ Quick Start (1-Minute Launch)

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment**:
   Check `.env` file (pre-populated with universal PostgreSQL defaults):
   ```env
   PORT=5000
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hackathon_db"
   JWT_SECRET=super_secret_hackathon_jwt_key_12345
   ```
   > 💡 **Cloud DB Hosting (Supabase / Neon / Railway / Render)**: Just paste your connection string into `DATABASE_URL`! The server auto-detects cloud hosts and applies SSL (`rejectUnauthorized: false`) automatically without configuration headaches.

3. **Seed Database with Pitch-Ready Demo Accounts**:
   ```bash
   npm run seed
   ```
   *(Note: Tables and schema are created automatically on boot or seed via `schema.sql`)*

4. **Start Development Server**:
   ```bash
   npm run dev
   ```

---

## 🐘 Why Direct SQL for Hackathons?

1. **Zero ORM Restrictions**: 100% allowed in hackathons that ban Prisma or TypeORM.
2. **Zero Build/Engine Hassles**: No Prisma engine downloads or binary incompatibilities on restricted WiFi networks.
3. **Universal Cloud DB Support**: Connect to Supabase poolers, Neon serverless, Railway, or Render with zero config changes.
4. **Clean Raw SQL Data Models**: All queries are transparent in `src/models/` and `src/database/schema.sql`.

---

## 📖 Interactive Swagger API Documentation
Open in your browser:
- **Swagger UI**: `http://localhost:5000/docs`
- **OpenAPI JSON**: `http://localhost:5000/docs.json`
- Supports interactive JWT Bearer authorization directly in the browser!

---

## 📡 API Endpoints Summary

### 🔐 Authentication & Email OTP
- `POST /api/v1/auth/register` — Register a new account
- `POST /api/v1/auth/login` — Login with email & password
- `POST /api/v1/auth/send-otp` — Generate & send 6-digit email OTP *(prints in terminal in dev mode)*
- `POST /api/v1/auth/verify-otp` — Verify OTP & passwordless login/signup
- `GET  /api/v1/auth/me` — Get authenticated user profile (JWT protected)

### 📁 Universal Media / File Upload
- `POST /api/v1/upload/single` — Upload single file (Form field: `file`)
- `POST /api/v1/upload/multiple` — Upload multiple files (Form field: `files`, max 10)
- Auto-fallback to local `/uploads` folder if Cloudinary credentials are not provided.

### 👥 User Management (RBAC Protected)
- `GET  /api/v1/users` — List all users
- `POST /api/v1/users` — Create new user (Admin only)
- `GET  /api/v1/users/:id` — Get user profile
- `PATCH /api/v1/users/:id/role` — Update user role

### 📊 Role-Based Scoped Data & Export Demos
- `GET /api/v1/sample/scoped-data` — Returns data filtered dynamically based on current user role
- `GET /api/v1/sample/export/excel` — Stream downloadable `.xlsx` report
- `GET /api/v1/sample/export/pdf` — Stream downloadable `.pdf` report

---

## 🔌 Socket.IO Real-time WebSocket Service

Connect from your frontend to `ws://localhost:5000`:
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

// Join a room (e.g. order tracking, project dashboard, live chat)
socket.emit('join_room', 'room_123');

// Listen for incoming messages & notifications
socket.on('new_message', (data) => console.log(data));
socket.on('notification', (alert) => console.log(alert));

// Send a real-time message
socket.emit('send_message', { room: 'room_123', message: 'Hello from frontend!' });
```

---

## 🌉 Exportable Frontend Axios SDK

A ready-to-copy frontend SDK is included in the `./client/` directory:
- `client/apiClient.js` — Axios instance with auto JWT interceptors, login, OTP, and file upload helpers.

Simply copy `client/apiClient.js` into your Next.js / React / Vite project!
