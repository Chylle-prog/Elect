from db_utils import query_db

def add_gender_customer_column():
    print("Adding 'gender_customer' column to tables...")
    try:
        query_db("ALTER TABLE customers ADD COLUMN IF NOT EXISTS gender_customer VARCHAR(50)")
        query_db("ALTER TABLE addresses ADD COLUMN IF NOT EXISTS gender_customer VARCHAR(50)")
        
        # Optionally sync data if needed
        query_db("UPDATE customers SET gender_customer = gender WHERE gender_customer IS NULL AND gender IS NOT NULL")
        query_db("UPDATE addresses SET gender_customer = gender WHERE gender_customer IS NULL AND gender IS NOT NULL")
        
        print("Columns added and data synced successfully.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    add_gender_customer_column()
