from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import addon, auth, booking, business, event_type, package, public, session, subscription, superadmin

app = FastAPI(
    title="Buhata Booking API",
    version="0.1.0",
    docs_url="/docs" if settings.debug else None,
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router)
app.include_router(business.router)
app.include_router(event_type.router)
app.include_router(session.router)
app.include_router(package.router)
app.include_router(addon.router)
app.include_router(booking.router)
app.include_router(public.router)
app.include_router(subscription.router)
app.include_router(superadmin.router)


@app.get("/health")
def health():
    return {"status": "ok"}
