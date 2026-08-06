# Codebase

All Buhata Booking application code lives here.

| Directory | What it is |
|---|---|
| `backend/` | FastAPI app — API, database models, business logic, email notifications |
| `frontend/` | React admin dashboard + embeddable public booking widget |

## Deployment

Both are deployed to the same DigitalOcean VPS:

- The **backend** runs as a `systemd` service under `uvicorn`, proxied by Nginx.
- The **frontend** is built to static files (`npm run build`) and served by Nginx from the same server.
- Deployment is triggered automatically via GitHub Actions on push to `main`.

## Local development

Run backend and frontend in separate terminals:

```bash
# Terminal 1 — backend
cd backend
uvicorn app.main:app --reload

# Terminal 2 — frontend (when Phase 1 Step 2 begins)
cd frontend
npm run dev
```

Backend API: http://localhost:8000
Frontend dev server: http://localhost:5173
API docs: http://localhost:8000/docs (debug mode only)
