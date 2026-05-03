from db_utils import query_db

def update_addresses_column():
    print("Updating 'addresses' table column name to 'gender_contacts'...")
    try:
        # Add gender_contacts column
        query_db("ALTER TABLE addresses ADD COLUMN IF NOT EXISTS gender_contacts VARCHAR(50)")
        
        # Sync data from gender or gender_customer
        query_db("UPDATE addresses SET gender_contacts = COALESCE(gender_customer, gender)")
        
        print("Column 'gender_contacts' added and data synced successfully.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    update_addresses_column()
