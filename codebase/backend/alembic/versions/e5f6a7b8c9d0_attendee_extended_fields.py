"""attendee extended fields for travel use case

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-08-21 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "e5f6a7b8c9d0"
down_revision: Union[str, None] = "d4e5f6a7b8c9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("attendees", sa.Column("id_or_passport", sa.String(100), nullable=True))
    op.add_column("attendees", sa.Column("nationality", sa.String(100), nullable=True))
    op.add_column("attendees", sa.Column("date_of_birth", sa.Date(), nullable=True))
    op.add_column("attendees", sa.Column("special_requirements", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("attendees", "special_requirements")
    op.drop_column("attendees", "date_of_birth")
    op.drop_column("attendees", "nationality")
    op.drop_column("attendees", "id_or_passport")
