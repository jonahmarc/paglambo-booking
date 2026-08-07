from fastapi import APIRouter, Depends, HTTPException, status
from jose import JWTError
from sqlalchemy.orm import Session as DBSession

from app.database import get_db
from app.models import Business
from app.routers.deps import create_access_token, create_refresh_token, get_current_business
from app.schemas.auth import BusinessOut, LoginRequest, RefreshRequest, RegisterRequest, TokenResponse
from app.services.auth import authenticate_business, create_business
from app.services.security import decode_token

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: DBSession = Depends(get_db)):
    if db.query(Business).filter_by(email=payload.email).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    business = create_business(db, name=payload.name, email=payload.email, password=payload.password)
    return TokenResponse(
        access_token=create_access_token(business.id),
        refresh_token=create_refresh_token(business.id),
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: DBSession = Depends(get_db)):
    business = authenticate_business(db, email=payload.email, password=payload.password)
    if business is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    return TokenResponse(
        access_token=create_access_token(business.id),
        refresh_token=create_refresh_token(business.id),
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh(payload: RefreshRequest, db: DBSession = Depends(get_db)):
    unauthorized = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    try:
        token_data = decode_token(payload.refresh_token)
    except JWTError:
        raise unauthorized

    if token_data.get("type") != "refresh":
        raise unauthorized

    business = db.get(Business, int(token_data["sub"]))
    if business is None or not business.is_active:
        raise unauthorized

    return TokenResponse(
        access_token=create_access_token(business.id),
        refresh_token=create_refresh_token(business.id),
    )


@router.get("/me", response_model=BusinessOut)
def me(current_business: Business = Depends(get_current_business)):
    return current_business
