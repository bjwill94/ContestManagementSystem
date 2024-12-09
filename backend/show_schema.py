from sqlalchemy import create_engine, text

DATABASE_URL = "postgresql://postgres:admin@localhost/judgify"

def show_schema():
    engine = create_engine(DATABASE_URL)
    with engine.connect() as connection:
        # Get all tables
        tables_query = text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """)
        
        tables = connection.execute(tables_query)
        
        for table in tables:
            table_name = table[0]
            print(f"\n\n=== Table: {table_name} ===")
            print("-" * 80)
            
            # Get columns for this table
            columns_query = text("""
                SELECT 
                    column_name,
                    data_type,
                    is_nullable,
                    column_default
                FROM information_schema.columns
                WHERE table_schema = 'public'
                AND table_name = :table_name
                ORDER BY ordinal_position;
            """)
            
            columns = connection.execute(columns_query, {"table_name": table_name})
            
            print(f"{'Column':<20} {'Type':<15} {'Nullable':<10} {'Default'}")
            print("-" * 80)
            
            for col in columns:
                print(f"{col[0]:<20} {col[1]:<15} {col[2]:<10} {str(col[3] or '')}")
            
            # Get foreign keys
            fk_query = text("""
                SELECT
                    kcu.column_name,
                    ccu.table_name AS foreign_table_name,
                    ccu.column_name AS foreign_column_name
                FROM 
                    information_schema.table_constraints AS tc 
                    JOIN information_schema.key_column_usage AS kcu
                      ON tc.constraint_name = kcu.constraint_name
                      AND tc.table_schema = kcu.table_schema
                    JOIN information_schema.constraint_column_usage AS ccu
                      ON ccu.constraint_name = tc.constraint_name
                      AND ccu.table_schema = tc.table_schema
                WHERE tc.constraint_type = 'FOREIGN KEY'
                AND tc.table_name = :table_name;
            """)
            
            foreign_keys = connection.execute(fk_query, {"table_name": table_name})
            
            fk_list = list(foreign_keys)
            if fk_list:
                print("\nForeign Keys:")
                for fk in fk_list:
                    print(f"- {fk[0]} -> {fk[1]}({fk[2]})")

if __name__ == "__main__":
    show_schema()
