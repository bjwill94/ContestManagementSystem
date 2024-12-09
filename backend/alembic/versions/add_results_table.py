"""add results table

Revision ID: add_results_table_rev
Revises: None
Create Date: 2024-01-17 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_results_table_rev'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('results',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('participant_id', sa.Integer(), nullable=False),
        sa.Column('event_id', sa.Integer(), nullable=False),
        sa.Column('mark1', sa.Float(), nullable=True),
        sa.Column('mark2', sa.Float(), nullable=True),
        sa.Column('mark3', sa.Float(), nullable=True),
        sa.Column('total_marks', sa.Float(), nullable=True),
        sa.Column('rank', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['participant_id'], ['participants.id'], ),
        sa.ForeignKeyConstraint(['event_id'], ['events.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_results_id'), 'results', ['id'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_results_id'), table_name='results')
    op.drop_table('results')
