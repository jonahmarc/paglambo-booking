"""discount codes and booking discount fields

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-08-21 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "f6a7b8c9d0e1"
down_revision: Union[str, None] = "e5f6a7b8c9d0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "discount_codes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("business_id", sa.Integer(), nullable=False),
        sa.Column("code", sa.String(50), nullable=False),
        sa.Column(
            "type",
            sa.Enum("flat", "percentage", name="discount_type"),
            nullable=False,
        ),
        sa.Column("value", sa.Numeric(10, 2), nullable=False),
        sa.Column("max_uses", sa.Integer(), nullable=True),
        sa.Column("use_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["business_id"], ["businesses.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_discount_codes_business_id", "discount_codes", ["business_id"])
    op.create_index("ix_discount_codes_code", "discount_codes", ["code"])

    op.add_column("bookings", sa.Column("discount_code", sa.String(50), nullable=True))
    op.add_column("bookings", sa.Column("discount_amount", sa.Numeric(10, 2), nullable=True))


def downgrade() -> None:
    op.drop_column("bookings", "discount_amount")
    op.drop_column("bookings", "discount_code")
    op.drop_index("ix_discount_codes_code", table_name="discount_codes")
    op.drop_index("ix_discount_codes_business_id", table_name="discount_codes")
    op.drop_table("discount_codes")
    op.execute("DROP TYPE IF EXISTS discount_type")
