"""
One-time script to create the platform superadmin account.

Usage (from codebase/backend/):
    python scripts/create_superadmin.py

Run this once on the VPS (or locally) after applying migrations.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.database import SessionLocal
from app.models import SuperAdmin
from app.services.auth import create_superadmin


def main():
    email = input("Superadmin email: ").strip()
    password = input("Password (min 8 chars): ").strip()

    if len(password) < 8:
        print("Password must be at least 8 characters.")
        sys.exit(1)

    db = SessionLocal()
    try:
        if db.query(SuperAdmin).filter_by(email=email).first():
            print(f"A superadmin with email '{email}' already exists.")
            sys.exit(1)
        superadmin = create_superadmin(db, email=email, password=password)
        print(f"Superadmin created — id={superadmin.id}, email={superadmin.email}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
