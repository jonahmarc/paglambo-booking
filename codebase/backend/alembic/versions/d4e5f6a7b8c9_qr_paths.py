"""add paypal_qr_path and wise_qr_path to businesses

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-08-20 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "d4e5f6a7b8c9"
down_revision: Union[str, None] = "c3d4e5f6a7b8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("businesses", sa.Column("paypal_qr_path", sa.String(500), nullable=True))
    op.add_column("businesses", sa.Column("wise_qr_path", sa.String(500), nullable=True))


def downgrade() -> None:
    op.drop_column("businesses", "wise_qr_path")
    op.drop_column("businesses", "paypal_qr_path")
