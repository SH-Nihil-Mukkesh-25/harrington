# 🚀 Full Stack Deployment Guide: TMMR

This guide covers deploying the **Backend to Render** and **Frontend to Vercel**.

This guide will help you deploy the **TMMR Backend** to Render.com, a free cloud hosting platform.

---

## Option 1: The "Magical" Blueprint Way (Recommended)
We have added a `render.yaml` file to your repository which automates the configuration.
    
1.  **Sign Up/Login**: Go to [dashboard.render.com](https://dashboard.render.com/) and log in.
2.  **New Blueprint**: Click **New +** button and select **"Blueprint"**.
3.  **Connect Repo**: Select your `tmmr-b2b` repository.
4.  **Accept**: Render will detect `render.yaml` and show you the `tmmr-backend` service. Click **Apply**.
5.  **Environment Variables**:
    - Go to the **Dashboard** → Click on the new `tmmr-backend` service.
    - Click **Environment** on the left menu.
    - Add `GEMINI_API_KEY` with your actual API key.
    - Click **Save Changes**.
6.  **Done!**: Your backend will deploy. You will get a URL like `https://tmmr-backend.onrender.com`.

---

## Option 2: Manual Setup

1.  **New Web Service**:
    - Go to Render Dashboard.
    - Click **New +** → **Web Service**.
2.  **Connect Repo**: Select `tmmr-b2b`.
3.  **Configure**:
    - **Name**: `tmmr-backend`
    - **Root Directory**: `backend` (Important!)
    - **Runtime**: `Node`
    - **Build Command**: `npm install`
    - **Start Command**: `npm start`
4.  **Environment Variables**:
    - Add `GEMINI_API_KEY`: `your_key_here`
5.  **Create Web Service**: Click the button at the bottom.

---

## 🔗 Connecting Frontend
Once deployed, you need to tell your local (or deployed) frontend where the backend lives.

1.  Copy your new Render URL (e.g., `https://tmmr-backend-xyz.onrender.com`).
2.  Update your `frontend/.env` file:
    ```env
    VITE_API_BASE_URL=https://tmmr-backend-xyz.onrender.com/api
    ```
3.  Restart your frontend.

---

## ⚠️ Important Note
Render's free tier spins down after inactivity. The first request might take **50+ seconds** to wake it up. This is normal for free instances.

---

# 🌐 Frontend Deployment (Vercel)

Now that your backend is running, deploy the React frontend.

1.  **Sign Up/Login**: Go to [vercel.com](https://vercel.com) and log in.
2.  **Add New Project**: Click **"Add New..."** -> **"Project"**.
3.  **Connect Repo**: Import your `tmmr-b2b` repository.
4.  **Configure Project**:
    - **Framework Preset**: Vercel should auto-detect "Vite".
    - **Root Directory**: Click "Edit" and select `frontend`. **(CRITICAL STEP)**
    - **Environment Variables**:
      - Add `VITE_API_BASE_URL` with your **Render Backend URL** (e.g., `https://tmmr-backend-xyz.onrender.com/api`).
5.  **Deploy**: Click **Deploy**.

### 🎉 Success!
Your full stack application is now live!
- **Frontend**: `https://tmmr-b2b.vercel.app` (or similar)
- **Backend**: `https://tmmr-backend.onrender.com`

