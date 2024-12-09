@echo off
echo Creating and setting up the database...

REM Run database migrations
python -m alembic upgrade head

echo Database setup complete!
pause
