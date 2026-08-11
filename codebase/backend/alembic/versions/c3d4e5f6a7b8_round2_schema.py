"""round 2 schema — slug, party_size, attendees

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-08-11 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "c3d4e5f6a7b8"
down_revision: Union[str, None] = "b2c3d4e5f6a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Slug for the hosted public booking page (/book/<slug>)
    op.add_column("businesses", sa.Column("slug", sa.String(100), nullable=True))
    op.create_unique_constraint("uq_businesses_slug", "businesses", ["slug"])
    op.create_index("ix_businesses_slug", "businesses", ["slug"])

    # Party size — how many people are included in the booking
    op.add_column(
        "bookings",
        sa.Column("party_size", sa.Integer(), nullable=False, server_default="1"),
    )

    # Individual attendees per booking (optional — not required for booking creation)
    op.create_table(
        "attendees",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("booking_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("phone", sa.String(50), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["booking_id"], ["bookings.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_attendees_booking_id", "attendees", ["booking_id"])


def downgrade() -> None:
    op.drop_index("ix_attendees_booking_id", table_name="attendees")
    op.drop_table("attendees")
    op.drop_column("bookings", "party_size")
    op.drop_index("ix_businesses_slug", table_name="businesses")
    op.drop_constraint("uq_businesses_slug", "businesses", type_="unique")
    op.drop_column("businesses", "slug")
