# 🎓 CampusFlow – Unified Smart Campus Management Platform

**CampusFlow** is a university-level, production-grade digital campus management ecosystem connecting **Students**, **Faculty**, and **University Administrators**. It integrates campus announcements, complaint registration with full audit trails, intelligent lost-and-found matching, college event ticketing with cryptographic QR passes, concurrency-safe room/laboratory booking, and real-time Socket.IO alerts.

---

## 🌟 Key System Capabilities

1. **Role-Based Access Control (RBAC)**: Distinct dashboards and permissions for **Administrator**, **Faculty**, and **Student**.
2. **Deterministic Lost & Found Match Engine**: Multi-factor ranking algorithm incorporating tokenized text similarity ($35\%$), category matching ($30\%$), campus location proximity ($20\%$), and date proximity scoring ($15\%$) without external dependencies.
3. **Concurrency-Safe Room Booking Engine**: Prevents overlapping reservations on both `Approved` and `Pending` slots with arithmetic time-range validation.
4. **Cryptographic QR Campus Identity & Gate Check-in**:
   - Unique, revocable identity token generated for students and faculty.
   - Verifiable event entry pass with gate check-in preventing duplicate entries.
5. **Real-Time Communication**: Socket.IO channels for instant announcement broadcasts, grievance status updates, and booking notifications.
6. **Live Analytics & Visualization**: Recharts SVG charts displaying real-time database aggregations (complaint category breakdown, event turnout, and room utilization).
7. **Zero-Friction Database Resilience**: Connects to `MONGODB_URI` (local daemon or Atlas) and automatically falls back to an embedded in-memory MongoDB server if no local database is running.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router v6, Axios, Recharts, Lucide React, Socket.IO Client.
- **Backend**: Node.js (v24), Express.js, REST API architecture, Mongoose ODM, MongoDB.
- **Real-Time Protocol**: Socket.IO.
- **Authentication & Security**: JWT (JSON Web Tokens), bcryptjs password hashing, Helmet, CORS, Express-Rate-Limit.
- **Validation & Utilities**: Zod schema validation, Multer file upload handler, QRCode generator, date-fns.

---

## 📂 Monorepo Architecture

```
CampusFlow/
├── client/                     # Vite + React 18 Frontend
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── common/         # GlobalSearchModal, ProtectedRoute
│   │   │   └── layout/         # Sidebar, Navbar, DashboardLayout
│   │   ├── contexts/           # AuthContext, ThemeContext, SocketContext
│   │   ├── pages/
│   │   │   ├── announcements/  # Notice board & publication modal
│   │   │   ├── auth/           # LoginPage, RegisterPage
│   │   │   ├── bookings/       # Room booking & conflict checker
│   │   │   ├── complaints/     # Grievance tracker & status stepper
│   │   │   ├── dashboard/      # Role-specific Recharts analytics
│   │   │   ├── events/         # Campus events & QR entry pass
│   │   │   ├── identity/       # Digital ID card & Gate check-in
│   │   │   └── users/          # Student & Faculty directories
│   │   ├── services/           # Axios instance with JWT interceptor
│   │   ├── App.jsx             # Route definitions
│   │   ├── main.jsx            # Context providers & mounting
│   │   └── index.css           # Tailwind directives
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                     # Node.js + Express + Socket.IO Backend
│   ├── src/
│   │   ├── config/             # Mongoose connection & in-memory fallback
│   │   ├── controllers/        # Express request handlers
│   │   ├── middleware/         # Auth, RBAC, Multer, Error handlers
│   │   ├── models/             # Mongoose domain models
│   │   ├── routes/             # REST API routes
│   │   ├── seed/               # Realistic database seeder
│   │   ├── services/           # Matching, Booking & QR engines
│   │   ├── sockets/            # Socket.IO connection & event dispatchers
│   │   ├── validators/         # Zod validation schemas
│   │   ├── app.js              # Express app setup & middleware
│   │   └── server.js           # HTTP + Socket.IO initialization
│   ├── tests/                  # Automated verification test suite
│   ├── uploads/                # Attached grievance photos & notice files
│   ├── .env.example
│   └── package.json
│
├── .gitignore
├── .env.example
├── package.json                # Root startup & concurrency runner
└── README.md
```

---

## ⚡ Quick Start & Setup

### 1. Prerequisites
- **Node.js** v18+ (Node v24 tested)
- **npm** v9+

### 2. Installation
Run the following from the root directory:
```bash
# Install root, server, and client dependencies
npm run install:all
```

### 3. Populate Database (Seed Script)
```bash
npm run seed
```
*Note: If local MongoDB is not running, the application will automatically spin up an embedded in-memory database instance!*

### 4. Run the Full Application (Concurrent Dev Mode)
```bash
npm run dev
```
- **Frontend Portal**: `http://localhost:5173`
- **Backend API & WebSockets**: `http://localhost:5000`

---

## 🔑 Pre-Seeded Evaluator Demo Accounts

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@ce.du.ac.in` | `1234` | Dean of Academic Administration |
| **Faculty (CSE HOD)** | `prof.sharma@campusflow.edu` | `Faculty@123` | Head of Computer Science |
| **Faculty (ECE)** | `prof.verma@campusflow.edu` | `Faculty@123` | Associate Professor (ECE) |
| **Student (CSE)** | `rahul.cs21@campusflow.edu` | `Student@123` | 6th Sem, CSE Section A |
| **Student (ECE)** | `sneha.ec22@campusflow.edu` | `Student@123` | 6th Sem, ECE Section B |

*(One-click quick login buttons are also provided directly on the Login page for instant access!)*

---

## 🧪 Automated Testing

CampusFlow includes a comprehensive automated test suite verifying unit algorithms, database constraints, booking conflict detection, and QR verification:
```bash
npm run test:server
```
**Test Coverage Includes:**
- Time-to-minute arithmetic transformations
- Jaccard tokenized keyword similarity
- Campus location proximity string scoring
- Reciprocal date window proximity scoring
- Password hashing & bcrypt verification
- Booking concurrency conflict prevention
- Intelligent Lost & Found reciprocal matching
- QR identity token verification and rejection of forged tokens
- Base64 QR code image generation
- Event attendance check-in & duplicate attendance guard

---

## 📡 REST API Reference

| Endpoint Group | Methods | Purpose |
| :--- | :--- | :--- |
| `/api/auth` | `POST /login`, `POST /register`, `GET /me`, `PUT /profile`, `PUT /password` | Authentication & profile |
| `/api/announcements` | `GET /`, `POST /`, `PUT /:id`, `DELETE /:id`, `POST /:id/read` | Campus circulars & advisories |
| `/api/complaints` | `GET /`, `POST /`, `GET /:id`, `PATCH /:id/status`, `PATCH /:id/assign` | Grievance audit trail |
| `/api/lost-found` | `GET /`, `POST /`, `GET /:id/matches`, `POST /:id/claim`, `PATCH /claims/:id/verify` | Lost-item match engine |
| `/api/events` | `GET /`, `POST /`, `POST /:id/register`, `DELETE /:id/register`, `POST /:id/verify-attendance` | Events & QR passes |
| `/api/rooms` | `GET /`, `POST /` | Facility directory |
| `/api/bookings` | `GET /`, `POST /`, `PATCH /:id/status`, `DELETE /:id` | Concurrency-safe reservations |
| `/api/qr` | `GET /my-identity`, `POST /verify-identity`, `POST /regenerate` | Cryptographic QR identity |
| `/api/analytics` | `GET /admin`, `GET /faculty`, `GET /student` | Recharts KPI data |
| `/api/search` | `GET /?q=...` | Global debounced search |

---

## 🧠 Core Engineering Algorithms

### 1. Intelligent Lost-and-Found Matching
$$\text{Score} = (0.30 \times S_{\text{category}}) + (0.35 \times S_{\text{text}}) + (0.20 \times S_{\text{location}}) + (0.15 \times S_{\text{date}})$$
- **Text Similarity ($S_{\text{text}}$)**: Tokenizes title and description, eliminates stop words, and calculates Jaccard coefficient:
  $$J(A, B) = \frac{|A \cap B|}{|A \cup B|}$$
- **Location Proximity ($S_{\text{location}}$)**: Analyzes campus landmarks (e.g., "Library", "Lab", "Block C").
- **Date Window ($S_{\text{date}}$)**: Decays dynamically as report dates diverge ($\le 1\text{ day} \to 1.0$, $\le 3\text{ days} \to 0.8$, $\le 7\text{ days} \to 0.5$).

### 2. Booking Overlap Concurrency Prevention
Conflict exists if:
$$(Start_{\text{existing}} < End_{\text{requested}}) \land (End_{\text{existing}} > Start_{\text{requested}})$$
Evaluated across both `Approved` and `Pending` bookings to prevent double-booking race conditions.
