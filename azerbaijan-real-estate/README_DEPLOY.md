# 🚀 DEPLOYMENT GUIDE: Netlify (Frontend) + Render (Backend) + MongoDB Atlas (Database)

This guide walks you through deploying this professional Azerbaijan Real Estate application to public production environments completely on free-tier services.

---

## 🗺️ Architecture Overview
*   **Frontend (Netlify)**: Houses the static React SPA. It is extremely fast, served over global CDNs, and auto-routes fallbacks to `index.html`.
*   **Backend (Render)**: Runs a continuous, self-healing Node.js + Express web service.
*   **Database (MongoDB Atlas)**: Stores and synchronizes properties, user favorites, and support tickets in a high-availability cloud cluster.

---

## 🗄️ Part 1: MongoDB Atlas Setup (Free Tier)

1.  **Create an Account**: Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign up for a free account.
2.  **Deploy a Free Cluster**:
    *   Click **"Create a Database"**.
    *   Choose the **M0 (Free)** shared tier.
    *   Select your preferred cloud provider (e.g., AWS or GCP) and region (e.g., Frankfurt/Ireland for European latency, or N. Virginia).
    *   Click **"Create"**.
3.  **Database Access (Security)**:
    *   Create a database user (e.g., `db_user`) and a secure password. Remember or copy these credentials.
4.  **Network Access (IP Whitelist)**:
    *   Go to **Security > Network Access** in your Atlas Sidebar.
    *   Click **"Add IP Address"**.
    *   Select **"Allow Access from Anywhere"** (`0.0.0.0/0`). This is necessary because Render's dynamic IP addresses rotate.
5.  **Retrieve Connection URI**:
    *   Go to **Database** and click **"Connect"** on your Cluster.
    *   Choose **"Drivers"** (Node.js).
    *   Copy the connection string. It will look like this:
        ```text
        mongodb+srv://db_user:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
        ```
    *   Replace `<password>` with the password you created for the database user, and optionally specify a database name (e.g., `/mydom` before `?`). This is your **`MONGODB_URI`**.

---

## ⚙️ Part 2: Deploying the Backend on Render

1.  **Create a Web Service**:
    *   Sign up/Log in to [Render](https://render.com).
    *   Click **New +** and select **Web Service**.
    *   Connect your GitHub repository containing this project.
2.  **Configure Build & Runtime Settings**:
    *   **Runtime**: `Node`
    *   **Region**: Same region as your MongoDB Atlas cluster (recommended for fast queries).
    *   **Build Command**: `npm install && npm run build`
    *   **Start Command**: `npm start` (This launches the compiled, lightweight Express server via `node dist/server.cjs`).
3.  **Configure Environment Variables**:
    *   Go to the **Environment** tab on your Render dashboard and click **"Add Environment Variable"**:
        *   `MONGODB_URI` = `your_mongodb_connection_string_from_part_1`
        *   `NODE_ENV` = `production`
4.  **Deploy**:
    *   Click **"Deploy Web Service"**. Once built, copy your service's URL (e.g., `https://mydom-backend.onrender.com`).

---

## 🌐 Part 3: Deploying the Frontend on Netlify

1.  **Create a Site**:
    *   Log in to [Netlify](https://www.netlify.com).
    *   Click **"Add new site"** > **"Import an existing project"**.
    *   Select your Git provider and select the repository.
2.  **Configure Build Settings**:
    *   **Build Command**: `npm run build` (This runs `vite build` to generate the highly optimized client SPA assets in `dist/`).
    *   **Publish directory**: `dist`
3.  **Configure Environment Variables**:
    *   Go to **Site Configuration > Environment variables** on Netlify.
    *   Add a variable:
        *   `VITE_API_URL` = `https://mydom-backend.onrender.com` *(The URL of your Render backend)*
4.  **Redirections (SPA Routing)**:
    *   No manual steps are required! We have pre-configured a `public/_redirects` file. Netlify will automatically detect this file and route all custom react paths (like `/listings`, `/dashboard`, etc.) cleanly to `index.html` on browser refresh.
5.  **Deploy**:
    *   Click **"Deploy site"**. Once deployment is complete, your real estate portal will be live!

---

## 🔍 Diagnostics & Monitoring

Once everything is deployed, you can verify your configuration at any time by visiting the backend diagnostics endpoint:
```text
https://your-backend.onrender.com/api/diagnostics
```
This endpoint will report a live JSON representation of:
*   `mongodb.connected` (`true`/`false`)
*   `mongodb.isActive` (`true`/`false`)
*   `dataCounts` (Total properties, users, and support tickets synchronized)
*   `uptime` and `nodeVersion`

If you encounter any database errors, check that the IP whitelist `0.0.0.0/0` is set up correctly in MongoDB Atlas and that you replaced the `<password>` placeholder in your `MONGODB_URI` on Render.
