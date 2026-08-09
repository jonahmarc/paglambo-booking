"""add super_admins table

Revision ID: a1b2c3d4e5f6
Revises: 3f8a2c1d9b5e
Create Date: 2026-08-09 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "3f8a2c1d9b5e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "super_admins",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_super_admins_email"), "super_admins", ["email"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_super_admins_email"), table_name="super_admins")
    op.drop_table("super_admins")
