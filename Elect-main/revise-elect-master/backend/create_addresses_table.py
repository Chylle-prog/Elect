from db_utils import query_db

def create_addresses_table():
    print("Creating 'addresses' table...")
    try:
        query_db("""
            CREATE TABLE IF NOT EXISTS addresses (
                id SERIAL PRIMARY KEY,
                customer_id INTEGER REFERENCES customers(customer_id) ON DELETE CASCADE,
                subject VARCHAR(255),
                address TEXT,
                message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("Table 'addresses' created successfully.")
    except Exception as e:
        print(f"Error creating table: {e}")

if __name__ == "__main__":
    create_addresses_table()
