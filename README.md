<div align="center">

# 🚀 DealFlow360

### **Next-Gen Multi-Tenant B2B CPQ, Deal Lifecycle & Negotiation Platform**
*Developed by Team **Cyber Creatures** for the **Odoo Hackathon 2026***

[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.19-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Real--Time-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)

<br />

**[🎯 Problem & Solution](#-the-problem--solution) • [⚡ Core Innovations](#-key-features--innovations) • [🛠️ Architecture](#-system-architecture) • [🚀 Quickstart](#-getting-started)**

---

</div>

## 📌 Executive Summary

Modern enterprise B2B sales cycles are plagued by disjointed tooling, unmonitored discounting that erodes profit margins, bureaucratic multi-day approval bottlenecks, and disconnected customer negotiation channels.

**DealFlow360** is a full-lifecycle B2B SaaS platform that bridges the gap between **CRM, CPQ (Configure, Price, Quote), Inventory Logistics, and Billing**. It provides sales reps with real-time margin guardrails and AI/heuristic cross-sell recommendations, enforces automated multi-tiered approval chains, enables live bilateral customer negotiation via WebSockets, coordinates distributed warehouse fulfillment splits, and automates hybrid recurring/one-time billing.

---

## 🏆 The Problem & Solution

| The Enterprise Problem | The DealFlow360 Solution |
| :--- | :--- |
| **Rogue Discounting & Margin Leakage**<br>Sales reps give aggressive discounts without visibility into floor margins or blended deal profitability. | **Real-Time Guardrail Engine & Risk Scoring**<br>Instant margin calculations, customer tier limits (Bronze–Platinum), category discount ceilings, and algorithmic 0–10 risk scoring. |
| **Approval Bottlenecks**<br>Quotes get stuck in endless email chains waiting for manager and finance sign-offs. | **Dynamic Multi-Level Approval Escalation**<br>Configurable threshold triggers (e.g., >10% discount routes to Sales Manager, >20% escalates to Finance). Real-time approval queues with audit reasons. |
| **Friction in Negotiations**<br>Static PDF revisions sent back and forth cause deals to stall or drop off. | **Live Collaborative Customer Portal**<br>External customers receive an interactive quote view, submit counter-proposals in real-time, and negotiate via WebSockets with zero page refreshes. |
| **Complex Fulfillment across Depots**<br>Single-warehouse limits force sales to reject large purchase orders when local stock is insufficient. | **Smart Multi-Warehouse Fulfillment Split**<br>Allocate quantities across multiple geographical warehouses with real-time stock deductions and weight-based shipping adjustments. |
| **Hybrid Monetization Mess**<br>Selling physical hardware alongside software licenses and SLAs requires multiple incompatible invoices. | **Unified Hybrid Billing Engine**<br>One quote seamlessly combines capital expenditure (one-time items) with operating expenditure (monthly/annual recurring subscription schedules). |

---

## 🔄 End-to-End Deal Lifecycle

```mermaid
flowchart LR
    A[Public Marketplace / Inquiries] --> B[CPQ Quotation Builder]
    B --> C{Margin & Risk Engine}
    C -->|Within Floor Limit| D[Direct Send to Customer]
    C -->|Exceeds Threshold| E[Manager / Finance Approval Queue]
    E -->|Approved| D
    D --> F[Live Customer Portal]
    F -->|Counter-Offer| G[Real-Time WebSocket Negotiation]
    G --> D
    F -->|Accepted| H[Multi-Warehouse Fulfillment Split]
    H --> I[Hybrid Billing & Invoicing]
    I --> J[Checkout / QR Payment & PDF Export]
    J --> K[Deal Pipeline Analytics & Audit Trail]
```

---

## ⚡ Key Features & Innovations

- 🧠 **Intelligent CPQ Engine** — Real-time margin guardrails, customer discount tiers (Bronze–Platinum), category ceilings, smart cross-sell recommendations, and automated 0–10 deal risk scoring.
- 🛡️ **Dynamic Multi-Stage Approvals** — Threshold-based automated routing to Sales and Finance managers with full margin impact context and audit logging.
- 💬 **Live Customer Negotiation Portal** — External customer portal with real-time bi-directional WebSocket negotiation, live counter-proposals, and zero-reload updates.
- 📦 **Smart Multi-Warehouse Fulfillment** — Automated split-shipment allocation across global depots (East/West Coast, EMEA) with weight-based freight adjustments.
- 🔄 **Unified Hybrid Billing** — Cohesive quotation of capital expenditures (hardware) and recurring operating subscriptions (software licenses & SLAs) on one invoice.
- 🌐 **Public B2B Marketplace** — External product discovery catalog with instant RFQ submission and 1-click conversion into active sales quotations.
- 💳 **Integrated Checkout & Multi-Currency** — Mock QR code instant payment collection, multi-currency engine (USD/EUR/GBP/INR), and server-side PDF invoice generation (`pdfkit`).
- 🏢 **Multi-Tenant SaaS Isolation** — Strict database tenant segregation, dedicated SuperAdmin workspace, and an immutable compliance audit trail.


## 🛠️ System Architecture

```
dealflow360/
├── client/                     # Modern React 19 Frontend
│   ├── src/
│   │   ├── api/                # Axios instance with Wi-Fi auto-discovery & auth interceptors
│   │   ├── components/         # Reusable UI components (Layout, ProtectedRoute, Modals)
│   │   ├── contexts/           # Notification, Alert, and Currency State Providers
│   │   ├── pages/              # 18+ Comprehensive Views
│   │   │   ├── QuotationBuilder.jsx  # Intelligent CPQ builder with real-time calculations
│   │   │   ├── ApprovalQueue.jsx     # Multi-stage manager & finance approval workspace
│   │   │   ├── CustomerPortal.jsx    # Interactive live negotiation portal for clients
│   │   │   ├── FulfillmentSplit.jsx  # Multi-warehouse allocation interface
│   │   │   ├── Marketplace.jsx       # Public B2B discovery catalog
│   │   │   ├── Pipeline.jsx          # Kanban deal pipeline with drag & drop stages
│   │   │   ├── SuperAdminConsole.jsx # SaaS multi-company management suite
│   │   │   └── ...
│   │   └── ...
│   └── vite.config.js          # Vite configuration with Tailwind CSS v4 & host binding
│
├── server/                     # Node.js & Express Enterprise Backend
│   ├── db/
│   │   ├── migrate.js          # Schema migration scripts (PostgreSQL)
│   │   ├── seed.js             # Non-destructive initial seed loader
│   │   └── seeds/001_seed.sql  # Seed data for companies, users, products, tiers, stock
│   ├── src/
│   │   ├── config/             # Database pool & environment configuration
│   │   ├── middlewares/        # JWT auth, tenant isolation, RBAC, error handlers
│   │   ├── routes/             # RESTful API routers (Quotes, Approvals, Payments, etc.)
│   │   ├── services/           # Core domain logic
│   │   │   ├── quotation.service.js  # CPQ calculation engine & discount validator
│   │   │   ├── approval.service.js   # Approval routing & escalation matrix
│   │   │   ├── socket.service.js     # Real-time WebSocket event broadcaster
│   │   │   ├── riskScore.service.js  # Deal risk algorithmic scorer
│   │   │   └── ...
│   │   └── utils/              # PDF generator, Excel exporter, logger
│   └── server.js               # Express & Socket.io server with auto-seed on startup
```

---

## 💻 Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev/) + [Vite 8](https://vitejs.dev/) (Ultra-fast HMR)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + Material Symbols
- **Routing**: [React Router DOM v7](https://reactrouter.com/)
- **Icons & Visuals**: [Lucide React](https://lucide.dev/) + [QRCode.react](https://github.com/zpao/qrcode.react)
- **Networking**: [Axios](https://axios-http.com/) (with dynamic host discovery for team Wi-Fi demos)
- **Real-Time Client**: [Socket.IO Client](https://socket.io/)

### Backend
- **Runtime**: [Node.js](https://nodejs.org/) (ES6+ / CommonJS)
- **Framework**: [Express 4.19](https://expressjs.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) via [`pg`](https://node-postgres.com/) (Hosted on Supabase)
- **Real-Time Engine**: [Socket.IO](https://socket.io/) (Bi-directional events)
- **Security**: [Helmet](https://helmetjs.github.io/), [Bcrypt](https://www.npmjs.com/package/bcrypt), [JWT](https://jwt.io/), [Express Rate Limit](https://www.npmjs.com/package/express-rate-limit)
- **Document Generation**: [PDFKit](https://pdfkit.org/) (Custom vector invoices) & [ExcelJS](https://github.com/exceljs/exceljs)
- **Media Storage**: [Cloudinary](https://cloudinary.com/)

---

## 🚀 Getting Started

Follow these steps to run the complete DealFlow360 platform locally on your machine.

### 📋 Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- An internet connection (to connect to the cloud PostgreSQL database)

---

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/R-Dhrumil/DealFlow360_By_CyberCreatures.git
cd DealFlow360_By_CyberCreatures
```

---

### 2️⃣ Backend Setup
```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# (Optional) Verify environment variables
# A pre-configured cloud database is already connected in .env
# If creating your own .env, reference .env.example:
# PORT=5001
# DATABASE_URL=postgresql://postgres:...@db...supabase.co:5432/postgres
# DB_SSL=true
# JWT_SECRET=super_secret_jwt_key_change_in_production
# CORS_ORIGIN=*

# Start backend server
npm run dev
```

> 💡 **Auto-Init Feature**: On first startup, the server automatically checks the database, executes schema migrations (`db/migrate.js`), and populates the sample seed dataset (`db/seed.js`). The API will be available at `http://localhost:5001`.

---

### 3️⃣ Frontend Setup
Open a new terminal window:
```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

> 🌐 The application will be running at **`http://localhost:5173`**.



## 🧪 Quick Test-Drive Walkthrough (For Hackathon Judges)

To experience the power of DealFlow360 in under 3 minutes:

1. **Create an Aggressive Quote (Sales Rep)**:
   - Click **Quick Login** ➔ **Sales Rep** (`sales@cybercreatures.com`).
   - Navigate to **Create Quote**, select **Acme Corp**, add **Edge Compute Node X1** and **Firewall Appliance**.
   - Type a high discount (e.g., `25%`). Notice the **Deal Risk Score** jump into the red zone and the indicator display **"Requires Finance Approval"**. Click **Submit Quote**.
2. **Review & Approve (Sales Manager & Finance Manager)**:
   - Switch user to **Finance Manager** (`financemanager@cybercreatures.com`).
   - Open **Approval Queue**, review the quote's margin impact, and click **Approve Discount**.
3. **Live Negotiation (Customer Portal)**:
   - Open an Incognito window and navigate to `/portal` or log in as **Customer** (`customer@acme.com`).
   - Review the approved quotation, propose a counter-offer, or click **Accept Proposal**.
   - Watch the Sales Rep dashboard update in real-time via WebSockets!
4. **Fulfillment Split**:
   - As Sales Rep or Admin, click **Split Fulfillment** to distribute 50 units across the East Coast (35 units) and West Coast (15 units) warehouses.
5. **Download PDF & Receipt**:
   - Click **Export PDF** to view the pixel-perfect generated quote document with payment terms, signature blocks, and line items.

---

## 👥 Meet Team Cyber Creatures

Built with passion, late-night coffee, and clean code for the **Odoo Hackathon 2026**:

- 🎨 **Rajat** — UI & Frontend Development
- ⚡ **Dhrumil** — API Development & Backend Engineering
- 📋 **Kunj** — Product Management & Requirements Architecture

---
