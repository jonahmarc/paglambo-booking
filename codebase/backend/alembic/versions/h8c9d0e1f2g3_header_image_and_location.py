"""header image and event type location

Revision ID: h8c9d0e1f2g3
Revises: g7b8c9d0e1f2
Create Date: 2026-08-25

"""
from alembic import op
import sqlalchemy as sa

revision = 'h8c9d0e1f2g3'
down_revision = 'g7b8c9d0e1f2'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('businesses', sa.Column('header_image_path', sa.String(500), nullable=True))
    op.add_column('event_types', sa.Column('location', sa.String(500), nullable=True))


def downgrade() -> None:
    op.drop_column('businesses', 'header_image_path')
    op.drop_column('event_types', 'location')
