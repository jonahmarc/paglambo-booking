# Backend

FastAPI application serving the Buhata Booking API.

## Stack

| Layer | Tech |
|---|---|
| Framework | FastAPI |
| ORM | SQLAlchemy 2.x |
| Migrations | Alembic |
| Database | PostgreSQL |
| Auth | JWT via `python-jose` |
| Email | Resend |
| File uploads | `python-multipart` (receipt screenshots) |

## Local setup

### Prerequisites

- Python 3.11+
- PostgreSQL running locally

### Install dependencies

```bash
cd codebase/backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Configure environment

```bash
cp .env.example .env
# Edit .env — at minimum set DATABASE_URL and SECRET_KEY
```

### Run database migrations

```bash
alembic upgrade head
```

### Start the dev server

```bash
uvicorn app.main:app --reload
```

- API: http://localhost:8000
- Interactive docs: http://localhost:8000/docs (only in `DEBUG=true` mode)

## Project structure

```
backend/
├── app/
│   ├── main.py          App factory, middleware, router registration
│   ├── config.py        Settings loaded from .env
│   ├── database.py      SQLAlchemy engine, session, Base
│   ├── models/          ORM models (one file per domain entity)
│   ├── schemas/         Pydantic request/response schemas
│   ├── routers/         Route handlers (thin — delegate to services)
│   └── services/        Business logic, decoupled from HTTP
├── alembic/             Migration scripts
├── alembic.ini
├── tests/
├── .env.example
└── requirements.txt
```

## Domain model overview

| Model | What it represents |
|---|---|
| `Business` | A client using the platform (the cooking school, the events company) |
| `EventType` | A template — one-time, recurring, or package |
| `Session` | An individual date/time a class or event runs |
| `Package` | A bundle of sessions sold together |
| `Booking` | A customer's reservation (`pending → awaiting_payment → confirmed`) |
| `Payment` | Proof of payment — receipt upload, then admin approve/reject |
| `Customer` | Contact details, scoped per business |

## Connecting to the VPS database

To inspect or query the production PostgreSQL database from your local machine, open an SSH tunnel — this forwards a local port through SSH to the VPS's Postgres port without exposing 5432 publicly.

### 1. Open the tunnel

```bash
ssh -L 5433:localhost:5432 root@<your-vps-ip> -N
```

- `-L 5433:localhost:5432` — local port 5433 maps to port 5432 on the VPS
- `-N` — no shell, just the tunnel
- Leave this terminal open while you need the connection

### 2. Connect with a DB client

Point any Postgres client (DBeaver, TablePlus, pgAdmin, psql) at:

| Setting | Value |
|---|---|
| Host | `localhost` |
| Port | `5433` |
| Database | `buhata_booking` |
| User | `buhata` |
| Password | *(from VPS `.env`)* |

### 3. Run Alembic migrations against the VPS

With the tunnel open, override `DATABASE_URL` to use the tunnel port:

```bash
DATABASE_URL=postgresql://buhata:<password>@localhost:5433/buhata_booking alembic upgrade head
```

### Close the tunnel

`Ctrl+C` in the terminal running the `ssh -N` command.

## Running tests

```bash
pytest
```

## Environment variables

See [.env.example](.env.example) for all required variables.

## Deployment

Deployment is automated via GitHub Actions on push to `main`. The workflow:

1. SSHs into the DigitalOcean VPS
2. Pulls the latest code
3. Installs/updates dependencies in the virtualenv
4. Runs `alembic upgrade head`
5. Restarts the `buhata-api` systemd service
