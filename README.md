# Contest Management System

A comprehensive web application for managing competitions and events, built with FastAPI (backend) and React (frontend).

## Features

- Category Management
- Event Management
- Participant Registration
- Results Recording and Management
- Judge Scoring System
- Export Results to Excel

## Tech Stack

### Backend
- FastAPI
- SQLAlchemy
- PostgreSQL
- Alembic (for database migrations)

### Frontend
- React
- Modern JavaScript (ES6+)
- XLSX for Excel export

## Setup

### Backend Setup
1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up the database:
```bash
python setup_db.py
```

4. Run the backend server:
```bash
uvicorn app.main:app --reload
```

### Frontend Setup
1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:3000`

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
