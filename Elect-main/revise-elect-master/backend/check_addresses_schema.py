from db_utils import query_db

def check_table_columns():
    table_name = "addresses"
    print(f"Checking columns for table '{table_name}'...")
    try:
        columns = query_db(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{table_name}'")
        for col in columns:
            print(f"Column: {col['column_name']} | Type: {col['data_type']}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_table_columns()
