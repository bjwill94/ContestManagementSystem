"""update result marks columns

Revision ID: update_result_marks_columns_rev
Revises: add_results_table_rev
Create Date: 2024-01-09

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'update_result_marks_columns_rev'
down_revision: str = 'add_results_table_rev'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Rename columns
    op.alter_column('results', 'mark1', new_column_name='judge1_marks', existing_type=sa.Float())
    op.alter_column('results', 'mark2', new_column_name='judge2_marks', existing_type=sa.Float())
    op.alter_column('results', 'mark3', new_column_name='judge3_marks', existing_type=sa.Float())


def downgrade() -> None:
    # Rename columns back
    op.alter_column('results', 'judge1_marks', new_column_name='mark1', existing_type=sa.Float())
    op.alter_column('results', 'judge2_marks', new_column_name='mark2', existing_type=sa.Float())
    op.alter_column('results', 'judge3_marks', new_column_name='mark3', existing_type=sa.Float())
