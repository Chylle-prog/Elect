import psycopg2
import os

def migrate():
    try:
        conn = psycopg2.connect(
            host="localhost",
            database="csj_database",
            user="postgres",
            password="secure_pass",
            port=5432
        )
        cur = conn.cursor()
        
        print("Adding code_used column to customers table...")
        cur.execute("ALTER TABLE customers ADD COLUMN IF NOT EXISTS code_used INTEGER DEFAULT 0;")
        
        conn.commit()
        cur.close()
        conn.close()
        print("Migration successful!")
    except Exception as e:
        print(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate()
