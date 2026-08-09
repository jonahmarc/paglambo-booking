"""add subscription model, plans, and platform settings

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-08-09 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add subscription columns to businesses.
    # Existing rows get status='active' so they retain full access.
    op.add_column("businesses", sa.Column("plan", sa.String(20), nullable=False, server_default="standard"))
    op.add_column("businesses", sa.Column("status", sa.String(30), nullable=False, server_default="active"))
    op.add_column("businesses", sa.Column("trial_ends_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("businesses", sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True))

    # Platform-wide key-value settings
    op.create_table(
        "platform_settings",
        sa.Column("key", sa.String(100), nullable=False),
        sa.Column("value", sa.String(1000), nullable=False),
        sa.PrimaryKeyConstraint("key"),
    )

    # Seed default settings
    op.execute("INSERT INTO platform_settings (key, value) VALUES ('require_approval', 'true')")
    op.execute("INSERT INTO platform_settings (key, value) VALUES ('trial_duration_days', '60')")

    # Subscription payment receipts (businesses paying Buhata Booking)
    op.create_table(
        "subscription_payments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("business_id", sa.Integer(), nullable=False),
        sa.Column("receipt_path", sa.String(500), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("review_note", sa.Text(), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("reviewed_by_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["business_id"], ["businesses.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["reviewed_by_id"], ["super_admins.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("subscription_payments")
    op.drop_table("platform_settings")
    op.drop_column("businesses", "approved_at")
    op.drop_column("businesses", "trial_ends_at")
    op.drop_column("businesses", "status")
    op.drop_column("businesses", "plan")
