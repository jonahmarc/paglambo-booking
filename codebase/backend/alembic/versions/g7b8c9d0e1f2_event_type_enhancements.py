"""event type enhancements: requires_payment and visibility

Revision ID: g7b8c9d0e1f2
Revises: f6a7b8c9d0e1
Create Date: 2026-08-21 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "g7b8c9d0e1f2"
down_revision: Union[str, None] = "f6a7b8c9d0e1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "event_types",
        sa.Column("requires_payment", sa.Boolean(), nullable=False, server_default="true"),
    )
    op.add_column(
        "event_types",
        sa.Column("visibility", sa.String(20), nullable=False, server_default="public"),
    )


def downgrade() -> None:
    op.drop_column("event_types", "visibility")
    op.drop_column("event_types", "requires_payment")
