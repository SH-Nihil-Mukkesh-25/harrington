# 🚛 TMMR (Transport Misroute Monitoring & Resolution)

[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen.svg)]()
[![Security](https://img.shields.io/badge/Security-Hardened-green.svg)]()
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)]()
[![AI](https://img.shields.io/badge/AI-Gemini%202.0-purple.svg)]()
[![Stack](https://img.shields.io/badge/Stack-MERN-yellow.svg)]()

**A next-generation LogiTech observability platform designed to eliminate parcel misrouting using AI-driven validation and real-time monitoring.**

---

## 🆕 What's New (v4.0)

### ✅ Issues Fixed

| Issue | Severity | Resolution |
|-------|----------|------------|
| **Hardcoded Route Optimizer** | Critical | Replaced fake Madurai/Tuticorin logic with **Gemini-powered dynamic optimization** |
| **Verification Not Enforced** | Critical | Created runtime middleware for all critical operations |
| **Hardcoded API Key** | Critical | Moved to `EXTERNAL_API_KEY` environment variable |
| **No Rate Limiting** | High | Added `express-rate-limit` (100 req/15min production) |
| **CORS Open to All** | Medium | Restricted to `ALLOWED_ORIGINS` in production |
| **Stack Traces Leaked** | Medium | Hidden in production mode |
| **Geocoding Failures** | Medium | Added 21+ Tamil Nadu cities with Gemini fallback |
| **Mutex Race Condition** | **Critical** | `/assignParcel` endpoint now checks batch lock to prevent data corruption |
| **Admin Vulnerability** | **Critical** | Protected `/reset`, DELETE routes with `X-Admin-Key` verification |

### 🚀 Latest Features

#### 🤖 Gemini-Powered Route Optimizer
The Sentinel Optimizer now uses **Google Gemini AI** for intelligent route clustering and savings calculation.
- Dynamic clustering based on Tamil Nadu geography
- Real savings estimation (fuel, tolls, time) - not hardcoded!
- Fallback to distance-based optimization when AI unavailable

#### 🗺️ Enhanced Map Geocoding
- **21+ Tamil Nadu cities** with accurate coordinates
- **Dynamic Gemini geocoding** for unknown cities
- India boundary validation (rejects non-Indian locations)

#### 🛡️ Security Hardening
- Rate limiting (100 requests/15min in production)
- CORS restrictions for production deployments  
- Body size limits (10KB) to prevent attacks
- Environment-based API key management

#### ✅ Runtime Verification Middleware
All critical operations now pass through mandatory validation:
- Assignment validation (parcel, truck, capacity, route)
- Assignment validation (parcel, truck, capacity, route)
- Admin operation validation (requires `X-Admin-Key` and confirmation)
- AI command validation
- Shared Mutex Lock for Batch vs Single Assignments

---

## 📌 Problem Statement
In the high-volume logistics industry, **manual parcel assignment is the single biggest point of failure**. 
- **The Issue**: Human operators often assign parcels to the wrong trucks or overload vehicles beyond capacity.
- **The Impact**: 
  - ❌ **Misroutes**: Parcels travel thousands of km in the wrong direction.
  - ❌ **SLA Breaches**: Delayed deliveries lead to customer churn.
  - ❌ **Operational Blindness**: Lack of real-time visibility into the "Why" of operational failures.
  - ❌ **Cost**: Wasted fuel and manpower correcting errors.

## 🚀 Why TMMR?
TMMR shifts logistics from **reactive fire-fighting** to **proactive prevention**.
Instead of fixing mistakes after they happen, TMMR's **Sentinel Engine** validates every assignment at the source, ensuring 100% route integrity and capacity compliance before a truck ever leaves the dock.

---

## 🏗️ System Architecture

TMMR is built on a robust, event-driven architecture designed for speed and reliability.

```mermaid
graph TD
    User[Logistics Manager] -->|Web UI / Voice| Client[Frontend (React + Vite)]
    Client -->|REST API| Server[Backend (Node.js + Express)]
    
    subgraph "Backend Core"
        Server -->|Assign| Validator[Sentinel Validation Engine]
        Server -->|Query/Action| AI[Zudu AI Agent (Gemini 2.0)]
        Server -->|Optimize| Optimizer[Gemini Route Optimizer]
        Server -->|Store| MemDB[(In-Memory High-Speed Store)]
    end
    
    subgraph "External Services"
        AI -.->|Generative AI| GeminiAPI[Google Gemini API]
        Optimizer -.->|Route Analysis| GeminiAPI
        Client -.->|Tiles| OSM[OpenStreetMap]
    end

    Validator -->|Success| MemDB
    Validator -->|Failure| AlertSys[Alerting System]
    AlertSys -->|Notify| Client
```

### 💻 Tech Stack
- **Frontend**: React 19, Vite, Leaflet Maps, SpeechRecognition API, CSS Variables (Dark Mode).
- **Backend**: Node.js, Express.js, Helmet, Morgan, express-rate-limit.
- **AI Engine**: Google Gemini 2.0 Flash (Route optimization, geocoding, natural language control).
- **Database**: High-performance In-Memory Data Store (Simulated for Hackathon/Demo speed).
- **DevOps**: Docker, Docker Compose.

---

## ✨ Key Features

### 1. 🛡️ Sentinel Validation Engine
- **Route Integrity**: Automatically blocks parcels destined for locations not on the truck's route.
- **Capacity Guard**: preventing overloading by checking weight limits in real-time.
- **Instant Feedback**: Provides clear, actionable error messages (SL-1 to SL-3 severity).

### 2. 🤖 "Zudu" Voice Command Center
- **Natural Language Control**: "Assign parcel P-101 to truck T-500".
- **Intelligent Querying**: "Which trucks are overloaded?", "Show me critical alerts".
- **Hands-Free Operation**: Perfect for warehouse environments.

### 3. 🗺️ Interactive Operations Map
- **Live Fleet Tracking**: Real-time visualization of trucks and routes.
- **Dynamic Geocoding**: 21+ Tamil Nadu cities with Gemini AI fallback.
- **Route Analytics**: Visual indicators of truck load and route efficiency.
- **Dark Mode Support**: Fully themed map interface for night operations.

### 4. 📊 Mission Control Dashboard
- **Real-Time metrics**: Active routes, fleet status, and alert accumulation.
- **System Health**: Connection status and AI availability indicators.
- **Operational Summary**: Aggregated insights into failure patterns (e.g., "Top Failure Reasons").

### 5. 🚀 AI Route Optimizer (NEW)
- **Gemini-Powered Clustering**: Intelligent grouping based on geography.
- **Dynamic Savings Calculation**: Real estimates for fuel, tolls, and time.
- **Network Resiliency**: Simulate road closures and see impact analysis.

---

## ⚙️ Installation & Setup

### Prerequisites
- **Node.js** (v18+)
- **npm** (v9+)
- **Docker** (Optional, for containerized run)
- **Google Gemini API Key** (Required for Voice Assistant & Route Optimizer)

### 🔑 Environment Configuration (CRITICAL)
To fully enable the **AI Voice Assistant**, **Route Optimizer**, and ensure correct map functionality, you must configure your environment variables.

1. **Backend**: Create `backend/.env`
   ```env
   PORT=5000
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   
   # Production Security (optional for dev)
   NODE_ENV=production
   EXTERNAL_API_KEY=your_secure_3pl_api_key
   ALLOWED_ORIGINS=https://your-frontend.vercel.app
   ```
   > **Note**: Without `GEMINI_API_KEY`, the Voice Assistant and Route Optimizer will operate in "Basic Mode".

2. **Frontend**: Create `frontend/.env`
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   ```

---

## 🚀 How to Run

### Method 1: Quick Start (Docker)
The easiest way to run the full stack.

```bash
# 1. Clone the repo
git clone https://github.com/SH-Nihil-Mukkesh-25/tmmr-b2b.git
cd tmmr-b2b

# 2. Add your API Key to backend/.env (as shown above)

# 3. Launch
docker-compose up --build
```

Access:
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000](http://localhost:5000)

### Method 2: Manual Setup (Development)

**1. Start Backend**
```bash
cd backend
npm install
npm start
# Server starts on port 5000
```

**2. Start Frontend**
```bash
cd frontend
npm install
npm run dev
# Client starts on port 5173 (or similar)
```

---

## ❓ Troubleshooting & Probable Errors

| Error | Probable Cause | Solution |
|-------|---------------|----------|
| **"AI Service Unavailable"** | Missing API Key | Check `backend/.env` has a valid `GEMINI_API_KEY`. Restart backend after adding. |
| **"Network Error" / API Fail** | Backend not running | Ensure backend is running on port 5000. Check console for crash logs. |
| **"Too many requests"** | Rate limiting active | Wait 15 minutes or adjust rate limit in `server.js` for development. |
| **Map Tiles Not Loading** | Internet / Firewall | The map integration requires internet access to fetch OpenStreetMap tiles. |
| **"EADDRINUSE: 5000"** | Port Conflict | Another service is using port 5000. Kill the process or change `PORT` in `.env`. |
| **Data Disappears** | Server Restart | **Intended Behavior**: TMMR uses an in-memory store for this version. Data resets on restart. Use the "🚀" button in the Dashboard to reload demo data instantly. |
| **Geocoding Returns Wrong Location** | City not in database | Use the dynamic Gemini geocoding - it will fetch correct coordinates. |

---

## 🔮 Future Roadmap
- [ ] **Persistent Database**: Integration with MongoDB/PostgreSQL.
- [ ] **Predictive Analytics**: Machine learning to forecast misroute probabilities.
- [ ] **Mobile App**: Native Android/iOS app for drivers.
- [ ] **Advanced Routing**: Turn-by-turn navigation integration.
- [x] ~~Security Hardening~~ ✅ **Completed**
- [x] ~~AI Route Optimizer~~ ✅ **Completed**

---

*Built for the TMMR Hackathon Challenge 2026*
