from db_utils import query_db

try:
    cols = query_db("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'review_images'
    """)
    print("Table: review_images")
    for c in cols:
        print(f" - {c['column_name']}: {c['data_type']}")
except Exception as e:
    print(f"Error checking table: {e}")
