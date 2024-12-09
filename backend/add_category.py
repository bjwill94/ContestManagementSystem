from sqlalchemy import create_engine, text

DATABASE_URL = "postgresql://postgres:admin@localhost/judgify"

def add_category_field():
    engine = create_engine(DATABASE_URL)
    with engine.connect() as connection:
        # Start a transaction
        with connection.begin():
            # Add category_id column
            connection.execute(text("""
                ALTER TABLE participants 
                ADD COLUMN IF NOT EXISTS category_id INTEGER;
            """))
            
            # Add foreign key constraint
            connection.execute(text("""
                ALTER TABLE participants 
                ADD CONSTRAINT fk_participant_category 
                FOREIGN KEY (category_id) 
                REFERENCES categories(id);
            """))
            
            print("Successfully added category_id field to participants table!")

if __name__ == "__main__":
    add_category_field()
