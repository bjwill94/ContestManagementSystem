from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

# Database connection URL
DATABASE_URL = "postgresql://postgres:admin@localhost/judgify"

def test_connection():
    try:
        # Create engine
        engine = create_engine(DATABASE_URL)
        # Try to connect
        with engine.connect() as connection:
            print("Successfully connected to the database!")
            # Test query to get database version
            result = connection.execute(text("SELECT version();"))
            version = result.fetchone()[0]
            print(f"PostgreSQL version: {version}")
            
            # List all tables
            result = connection.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public';
            """))
            print("\nTables in database:")
            for table in result:
                print(f"- {table[0]}")
    except SQLAlchemyError as e:
        print(f"Error connecting to the database: {str(e)}")

if __name__ == "__main__":
    test_connection()
