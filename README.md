# TMMR (The Mobile Mule Runner) - B2B Logistics Dashboard

## 📌 Problem Statement
Logistics companies struggle to efficiently assign parcels to trucks while strictly adhering to constraints like:
1.  **Route Validity**: Does the truck actually stop at the parcel's destination?
2.  **Capacity Limits**: Can the truck carry the additional weight?

Manual assignment is error-prone and slow. TMMR automates this validation and provides a centralized dashboard for managing assets.

## 🚀 System Overview
TMMR is a **Full-Stack B2B Application** that allows logistics managers to:
- **Manage Assets**: Create and view Routes, Trucks, and Parcels.
- **Assign Parcels**: Interface to assign parcels to trucks with **automatic validation**.
- **Monitor Alerts**: Automatically captures and displays assignment failures (e.g., "Capacity Exceeded") for review.
- **Dashboard**: Real-time summary of network statistics.

## 🛠 Tech Stack
- **Backend**: Node.js, Express (REST API)
- **Frontend**: React, Vite (Single Page Application)
- **Styling**: Vanilla CSS (Clean, responsive layout)
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

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/api/health` | Check server status |
| **GET / POST** | `/api/routes` | Manage Routes |
| **GET / POST** | `/api/trucks` | Manage Trucks |
| **GET / POST** | `/api/parcels` | Manage Parcels |
| **POST** | `/api/assignParcel` | Assign parcel to truck (Logic Core) |
| **GET** | `/api/alerts` | Retrieve assignment failure alerts |

## ⚠️ Assumptions & Limitations
- **Persistence**: Data is stored **in-memory**. All data (Routes, Trucks, Alerts) is **lost** when the backend server restarts.
- **Authentication**: Single-user mode. No login required.
- **Validation**:
    - IDs and Destinations must be non-empty strings.
    - Capacity and Weight must be positive numbers.
    - Strict checks prevent invalid assignments (Route mismatch, Capacity overflow).

---
*Built for TMMR B2B Project.*
