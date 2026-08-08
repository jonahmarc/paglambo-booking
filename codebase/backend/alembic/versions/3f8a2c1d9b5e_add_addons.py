"""add addons

Revision ID: 3f8a2c1d9b5e
Revises: 9c5d671b963a
Create Date: 2026-08-08 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "3f8a2c1d9b5e"
down_revision: Union[str, None] = "9c5d671b963a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "add_ons",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("event_type_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("price", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["event_type_id"], ["event_types.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_add_ons_event_type_id"), "add_ons", ["event_type_id"], unique=False)

    op.create_table(
        "booking_addons",
        sa.Column("booking_id", sa.Integer(), nullable=False),
        sa.Column("addon_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["booking_id"], ["bookings.id"]),
        sa.ForeignKeyConstraint(["addon_id"], ["add_ons.id"]),
        sa.PrimaryKeyConstraint("booking_id", "addon_id"),
    )


def downgrade() -> None:
    op.drop_table("booking_addons")
    op.drop_index(op.f("ix_add_ons_event_type_id"), table_name="add_ons")
    op.drop_table("add_ons")
