# 📚 CampusDrop

> A crisp, modern academic dashboard designed for students and lecturers to organize lab notes, cloud checklists, and study resources week-by-week and topic-by-topic.
Demo Video https://drive.google.com/file/d/1yO1e6-eZXB1WwyQrHCuVW4beWZd2AOx5/view?usp=drive_link 
---

## ✨ Features

- **Topic & Week Filtering:** Filter instantly by category (🧪 *Lab Notes*, ☁️ *Cloud Checklist*, 📖 *Study Resource*) and week tags.
- **Full-Text Search:** Real-time debounced keyword search scanning titles, courses, markdown notes, and code snippets.
- **One-Click Snippet & Link Copy:** Copy shell commands, Terraform blocks, and resource links to your clipboard with instant visual feedback.
- **Inline Validation:** Validates required fields, lengths, and valid HTTP/HTTPS URLs before submitting, complete with helpful inline error alerts.
- **Context-Aware Empty States:** Contextual empty states with a single-click button to clear active filters and search terms.
- **Mobile-Optimized:** Horizontal-swipe week pills, touch-friendly action targets, iOS Safari zoom prevention, and zero horizontal scroll blowouts.
- **Lightweight Persistence:** Built with SQLite via `better-sqlite3` running in WAL (Write-Ahead Logging) mode, pre-seeded with 5 realistic cloud lab guides.
- **Production-Ready Container:** Configured for single-container deployment (Express dynamically serves both the `/api` endpoints and the compiled Vite frontend SPA).

---

## 🛠️ Tech Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | React 19 + Vite 8 | Fast SPA bundle, clean component architecture, debounced queries |
| **Styling** | Custom CSS | Responsive grid, accessible color contrast, swipeable pills, no bloated CSS framework |
| **Backend** | Express 5 + Node.js 20+ | RESTful API, input sanitization, body parsing limits, graceful shutdown |
| **Database** | SQLite 3 (`better-sqlite3`) | Fast embedded database with indexes and transaction safety |
| **Packaging** | Docker (Multi-stage) | Lean `node:20-slim` runtime image running as a non-root `node` user |

---

## 🚀 Getting Started (Local Development)

### Prerequisites

- [Node.js](https://nodejs.org/) v20+ (v20 or v22 LTS recommended)
- `npm` v10+

### 1. Installation

Clone or open the project folder and install dependencies:

```bash
cd CampusDrop
npm install
```

### 2. Run in Development Mode

Run the backend API and the Vite frontend dev server in separate terminal windows:

**Terminal 1 (Backend API on `:3001`):**
```bash
npm run server
```

**Terminal 2 (Frontend with Hot Module Replacement on `:5173`):**
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser. The Vite dev server automatically proxies `/api` calls to `http://localhost:3001`.

---

## 🧪 Testing the Production Build Locally

Before containerizing, verify the production build where Express serves the static frontend directly:

```bash
# 1. Build the production assets into dist/
npm run build

# 2. Start the unified production server (defaults to port 3001, or custom PORT)
PORT=8080 npm start
```

Open [http://localhost:8080](http://localhost:8080) — you will see the compiled application running entirely through the Express server without Vite running in the background.

---

## 🐳 Testing with Docker

The multi-stage `Dockerfile` compiles the client assets and packages the production backend into a secure, minimal container running under the non-root `node` user.

### Build the Image

```bash
docker build -t campusdrop:latest .
```

### Run the Container Locally

```bash
docker run -p 8080:8080 \
  -e PORT=8080 \
  -v campusdrop-data:/app/data \
  campusdrop:latest
```

Visit [http://localhost:8080](http://localhost:8080) to interact with the app, and check [http://localhost:8080/api/health](http://localhost:8080/api/health) to verify container health.

---

## ☁️ Deploying to Google Cloud Run

Google Cloud Run is an ideal serverless environment for CampusDrop. The server dynamically reads `process.env.PORT` (Cloud Run injects `8080` by default) and binds to `0.0.0.0`.

### Option A: Source-Based Direct Deploy (Fastest)

Using the Google Cloud CLI, deploy directly from source in one step:

```bash
gcloud run deploy campusdrop \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

Cloud Run will automatically invoke Google Cloud Buildpacks, build the application using `npm run build`, and launch the container via `npm start`.

### Option B: Deploying via Docker & Artifact Registry

```bash
# 1. Set your GCP Project ID and Region
export PROJECT_ID="your-gcp-project-id"
export REGION="us-central1"

# 2. Build and push image to Google Artifact Registry
gcloud artifacts repositories create campusdrop-repo \
  --repository-format=docker \
  --location=$REGION \
  --description="CampusDrop container repository"

gcloud builds submit --tag $REGION-docker.pkg.dev/$PROJECT_ID/campusdrop-repo/campusdrop:latest

# 3. Deploy the container to Cloud Run
gcloud run deploy campusdrop \
  --image $REGION-docker.pkg.dev/$PROJECT_ID/campusdrop-repo/campusdrop:latest \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 8080
```

> [!TIP]
> **Database Persistence in Cloud Run**: By default, container instances have an ephemeral container filesystem (changes persist across requests within a container instance, but reset when scaled to zero). For permanent multi-instance persistence, configure a [Cloud Run Volume Mount](https://cloud.google.com/run/docs/configuring/services/volume-mounts) to mount a Google Cloud Storage bucket or Persistent Disk to `/app/data`, or swap the SQLite driver for a managed database like Cloud SQL for PostgreSQL.

---

## ⚙️ Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3001` | The network port the Express HTTP server listens on (Cloud Run sets this to `8080`). |
| `DB_PATH` | `./server/campusdrop.db` | Absolute or relative filesystem path to the SQLite database file. In Docker, defaults to `/app/data/campusdrop.db`. |
| `NODE_ENV` | `development` | Set to `production` in live environments. |
| `VITE_API_URL` | `""` | Optional override for the API base URL. In production, defaults to relative same-origin `/api`. |

---

## 📡 REST API Reference

| Method | Endpoint | Query / Body | Description |
|---|---|---|---|
| `GET` | `/api/health` | — | Health check reporting service status, uptime, and database connection. |
| `GET` | `/api/resources` | `?q=...&category=...&week=...` | List resources with optional keyword search and filters. |
| `GET` | `/api/resources/meta` | — | Returns arrays of unique `weeks` and `courses` present in the database. |
| `GET` | `/api/resources/:id` | — | Fetch single resource by UUID. |
| `POST` | `/api/resources` | JSON `{ title, course, week, category, notes, link, snippet }` | Create a new resource card with server-side validation. |
| `PUT` | `/api/resources/:id` | JSON partial update fields | Update an existing resource. |
| `DELETE` | `/api/resources/:id` | — | Delete a resource by ID. |

---

## 🔒 Security & Code Hygiene

- **SQL Injection Prevention:** All SQL queries use parameterized prepared statements via `better-sqlite3`.
- **Payload Limits:** JSON body parser is restricted to `100kb` with error handling for malformed JSON.
- **Least Privilege:** Docker container runs as non-root user `node` (UID 1000).
- **Graceful Shutdown:** Handles `SIGTERM` and `SIGINT` signals to cleanly close database connections and flush WAL checkpoints before exit.
- **Git Hygiene:** Local `.env` files, `.db` databases, and OS/editor metadata are ignored via `.gitignore` and `.dockerignore`.

---

## 📄 License

MIT
