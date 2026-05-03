import psycopg2
import os
from dotenv import load_dotenv

def migrate():
    # Load env from parent directory
    load_dotenv()
    
    try:
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            database=os.getenv('DB_NAME', 'csj_database'),
            user=os.getenv('DB_USER', 'postgres'),
            password=os.getenv('DB_PASSWORD', 'secure_pass'),
            port=os.getenv('DB_PORT', '5432')
        )
        cur = conn.cursor()
        
        print("Adding gender column to customers table...")
        cur.execute("ALTER TABLE customers ADD COLUMN IF NOT EXISTS gender VARCHAR(20);")
        
        conn.commit()
        cur.close()
        conn.close()
        print("Migration successful!")
    except Exception as e:
        print(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate()
