from db_utils import query_db

def add_gender_to_addresses():
    print("Adding 'gender' column to 'addresses' table...")
    try:
        query_db("ALTER TABLE addresses ADD COLUMN IF NOT EXISTS gender VARCHAR(50)")
        print("Column 'gender' added successfully.")
    except Exception as e:
        print(f"Error adding column: {e}")

if __name__ == "__main__":
    add_gender_to_addresses()
