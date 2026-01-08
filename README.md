# TMMR (The Mobile Mule Runner) - B2B Logistics Dashboard

## 📌 Problem Statement
Logistics companies struggle to efficiently assign parcels to trucks while strictly adhering to constraints like:
1.  **Route Validity**: Does the truck actually stop at the parcel's destination?
2.  **Capacity Limits**: Can the truck carry the additional weight?

Manual assignment is error-prone and slow. TMMR automates this validation and provides a centralized dashboard for managing assets.

## 🚀 System Overview
TMMR is a **Full-Stack B2B Application** that allows logistics managers to:
- **Manage Assets**: Create, view, and delete Routes, Trucks, and Parcels.
- **Assign Parcels**: Interface to assign parcels to trucks with **automatic validation**.
- **Monitor Alerts**: Automatically captures and displays assignment failures (e.g., "Capacity Exceeded") for review.
- **Dashboard**: Real-time summary of network statistics with system reset capability.
- **Workflow Inspection**: View step-by-step execution logs for parcel assignments.
- **Ops Summary**: Aggregated operational insights and incident detection.
- **Dark Mode**: Toggle between light and dark themes with persisted preference.

## ✨ New Features (v2.0)

### Observability Module
- **GET /api/ops/aggregate** - Comprehensive metrics: alerts by severity, workflow success rates, top failure reasons
- **GET /api/ops/summary** - Lightweight incident framing with time-windowed failure detection
- **GET /api/workflows** - Assignment workflow execution logs with step details

### DELETE Functionality
- **DELETE /api/routes/:routeID** - Remove routes (blocked if trucks assigned)
- **DELETE /api/trucks/:truckID** - Remove trucks (blocked if parcels assigned)
- **DELETE /api/parcels/:parcelID** - Remove parcels (blocked if currently assigned)

### UI Enhancements
- **Dark Mode Toggle** 🌙/☀️ - CSS variables with localStorage persistence
- **Inline Confirmation** - No browser popups; Yes/No buttons appear inline in tables
- **Message Banners** - Success/error feedback as colored banners (auto-dismiss)
- **System Reset (Dev)** - Clear all data with one click (Dashboard)

## 🛠 Tech Stack
- **Backend**: Node.js, Express (REST API)
- **Frontend**: React, Vite (Single Page Application)
- **Styling**: Vanilla CSS with CSS Variables (Dark mode support)
- **Data**: In-memory storage (Reset on restart)

## 🏃‍♂️ How to Run

### Prerequisites
- Node.js installed (v16+ recommended)

### 1. Start the Backend
```bash
cd backend
npm install
npm start
```
*Server runs on: `http://localhost:5000`*

### 2. Start the Frontend
Open a new terminal:
```bash
cd frontend
npm install
npm run dev
```
*App runs on: `http://localhost:5173` (typically)*

## 📡 API Overview (Backend)

### Core CRUD
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/api/health` | Check server status |
| **GET / POST / DELETE** | `/api/routes` | Manage Routes |
| **GET / POST / DELETE** | `/api/trucks` | Manage Trucks |
| **GET / POST / DELETE** | `/api/parcels` | Manage Parcels |
| **POST** | `/api/assignParcel` | Assign parcel to truck (Logic Core) |
| **GET** | `/api/alerts` | Retrieve assignment failure alerts |

### Observability
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/api/workflows` | Assignment workflow execution logs |
| **GET** | `/api/ops/aggregate` | Full operational metrics |
| **GET** | `/api/ops/summary` | Lightweight incident summary |

### System
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **POST** | `/api/reset` | Clear all data (DEV/DEMO only) |

## 🖥️ Frontend Pages

| Page | Route | Description |
| :--- | :--- | :--- |
| Dashboard | `/` | Stats overview, quick links, system reset |
| Routes | `/routes` | CRUD for delivery routes |
| Trucks | `/trucks` | CRUD for truck fleet |
| Parcels | `/parcels` | CRUD for parcels with assignment status |
| Assignments | `/assignments` | Assign parcels to trucks |
| Alerts | `/alerts` | View assignment failure alerts |
| Workflows | `/workflows` | Inspect assignment execution logs |
| Ops | `/ops` | Operational summary and incidents |
| Assistant | `/assistant` | Voice assistant interface |

## ⚠️ Assumptions & Limitations
- **Persistence**: Data is stored **in-memory**. All data (Routes, Trucks, Alerts) is **lost** when the backend server restarts.
- **Authentication**: Single-user mode. No login required.
- **Validation**:
    - IDs and Destinations must be non-empty strings.
    - Capacity and Weight must be positive numbers.
    - Strict checks prevent invalid assignments (Route mismatch, Capacity overflow).
    - Delete operations are blocked if dependencies exist.

---
*Built for TMMR B2B Project.*
