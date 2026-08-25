"""event type photos

Revision ID: i9d0e1f2g3h4
Revises: h8c9d0e1f2g3
Create Date: 2026-08-25

"""
import sqlalchemy as sa
from alembic import op

revision = 'i9d0e1f2g3h4'
down_revision = 'h8c9d0e1f2g3'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'event_type_photos',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('event_type_id', sa.Integer(), nullable=False),
        sa.Column('file_path', sa.String(500), nullable=False),
        sa.Column('sort_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['event_type_id'], ['event_types.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_event_type_photos_event_type_id', 'event_type_photos', ['event_type_id'])


def downgrade() -> None:
    op.drop_index('ix_event_type_photos_event_type_id', table_name='event_type_photos')
    op.drop_table('event_type_photos')
