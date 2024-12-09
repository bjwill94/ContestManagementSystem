# Judgify Backend

This is the backend service for the Judgify application, built with FastAPI and PostgreSQL.

## Setup Instructions

1. Create a PostgreSQL database:
```sql
CREATE DATABASE judgify;
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Initialize the database:
```bash
alembic upgrade head
```

4. Run the server:
```bash
uvicorn app.main:app --reload
```

The API will be available at http://localhost:8000

## API Documentation

After starting the server, visit http://localhost:8000/docs for the interactive API documentation.

### Available Endpoints:

#### Categories
- GET /categories/ - List all categories
- POST /categories/ - Create a new category
- GET /categories/{id} - Get category details

#### Events
- GET /events/ - List all events (can filter by category_id)
- POST /events/ - Create a new event

#### Participants
- GET /participants/ - List all participants (can filter by category_id or event_id)
- POST /participants/ - Register a new participant

#### Results
- GET /results/ - List all results (can filter by category_id or event_id)
- POST /results/ - Enter marks for a participant

## Database Schema

The application uses the following main tables:
- categories (id, name, min_age, max_age, description)
- events (id, name, category_id, date, venue)
- participants (id, name, age, sex, chest_number, church, district, region, state)
- results (id, participant_id, event_id, judge1_marks, judge2_marks, judge3_marks, total_marks, rank)
