# 🚀 Deploying NEXUS IQ™ to Render

NEXUS IQ™ is fully configured for deployment on [Render](https://render.com).

---

## Option 1: One-Click Blueprint Deployment (Recommended)

Because we have included a [`render.yaml`](file:///C:/Users/gobesh%20j/Desktop/ET%20AI%20HACKATHON/nexus-iq/render.yaml) file, Render can automatically set up both the backend API and frontend service.

1. Push this repository to your GitHub account:
   ```bash
   git add .
   git commit -m "Deploy NEXUS IQ to Render"
   git push origin main
   ```
2. Go to your [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** → **Blueprint**.
4. Connect your GitHub repository (`GOBESH54/ProPitch-AI` or your NEXUS IQ repo).
5. Render will automatically detect [`render.yaml`](file:///C:/Users/gobesh%20j/Desktop/ET%20AI%20HACKATHON/nexus-iq/render.yaml) and create:
   - **`nexus-iq-backend`** (Python FastAPI Web Service)
   - **`nexus-iq-frontend`** (Next.js Web Service)
6. Under **Environment Variables** for `nexus-iq-backend`, add your Gemini API key:
   - `GEMINI_API_KEY` = `your_gemini_api_key_here`
7. Click **Apply** to deploy!

---

## Option 2: Manual Web Service Deployment

If you prefer deploying just the backend separately:

1. In Render Dashboard, click **New +** → **Web Service**.
2. Connect your repository.
3. Configure settings:
   - **Root Directory**: `backend` (or `ET AI HACKATHON/nexus-iq/backend` depending on your repo structure)
   - **Environment**: `Python 3`
   - **Build Command**:
     ```bash
     pip install -r requirements.txt
     ```
   - **Start Command**:
     ```bash
     uvicorn app.main:app --host 0.0.0.0 --port $PORT
     ```
4. Add Environment Variables:
   - `PYTHON_VERSION` = `3.11.9`
   - `GEMINI_API_KEY` = `your_gemini_api_key_here`
5. Click **Create Web Service**.

---

## Option 3: Deploy via Docker

We have also generated a [`Dockerfile`](file:///C:/Users/gobesh%20j/Desktop/ET%20AI%20HACKATHON/nexus-iq/backend/Dockerfile) inside `backend/`:
- Select **Environment**: `Docker` when creating a Web Service on Render.
- Root Directory: `backend`
- Render will automatically build the container and launch FastAPI on `$PORT`.
