"""initial migration

Revision ID: initial_migration
Revises: 
Create Date: 2023-11-20 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'initial_migration'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Create categories table
    op.create_table(
        'categories',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('min_age', sa.Integer(), nullable=False),
        sa.Column('max_age', sa.Integer(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index('ix_categories_id', 'categories', ['id'])
    op.create_index('ix_categories_name', 'categories', ['name'])

    # Create events table
    op.create_table(
        'events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('category_id', sa.Integer(), nullable=False),
        sa.Column('date', sa.String(), nullable=True),
        sa.Column('venue', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_events_id', 'events', ['id'])
    op.create_index('ix_events_name', 'events', ['name'])

    # Create participants table
    op.create_table(
        'participants',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('age', sa.Integer(), nullable=False),
        sa.Column('sex', sa.String(), nullable=False),
        sa.Column('chest_number', sa.String(), nullable=False),
        sa.Column('church', sa.String(), nullable=True),
        sa.Column('district', sa.String(), nullable=True),
        sa.Column('region', sa.String(), nullable=True),
        sa.Column('state', sa.String(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('chest_number')
    )
    op.create_index('ix_participants_id', 'participants', ['id'])
    op.create_index('ix_participants_name', 'participants', ['name'])
    op.create_index('ix_participants_chest_number', 'participants', ['chest_number'])

    # Create participant_event association table
    op.create_table(
        'participant_event',
        sa.Column('participant_id', sa.Integer(), nullable=False),
        sa.Column('event_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['event_id'], ['events.id'], ),
        sa.ForeignKeyConstraint(['participant_id'], ['participants.id'], ),
        sa.PrimaryKeyConstraint('participant_id', 'event_id')
    )

    # Create results table
    op.create_table(
        'results',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('participant_id', sa.Integer(), nullable=False),
        sa.Column('event_id', sa.Integer(), nullable=False),
        sa.Column('judge1_marks', sa.Float(), nullable=False),
        sa.Column('judge2_marks', sa.Float(), nullable=False),
        sa.Column('judge3_marks', sa.Float(), nullable=False),
        sa.Column('total_marks', sa.Float(), nullable=False),
        sa.Column('rank', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['event_id'], ['events.id'], ),
        sa.ForeignKeyConstraint(['participant_id'], ['participants.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_results_id', 'results', ['id'])

def downgrade() -> None:
    op.drop_table('results')
    op.drop_table('participant_event')
    op.drop_table('participants')
    op.drop_table('events')
    op.drop_table('categories')
