import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv

basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, '.env'))

def get_db_connection():
    return psycopg2.connect(
        host=os.getenv('DB_HOST'),
        database=os.getenv('DB_NAME'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'),
        port=os.getenv('DB_PORT')
    )

def query_db(query, args=(), one=False):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute(query, args)
        conn.commit()
        if cur.description:
            rv = cur.fetchall()
            return (rv[0] if rv else None) if one else rv
        return None
    except Exception as e:
        print(f"Database Error: {e}")
        conn.rollback()
        raise e
    finally:
        cur.close()
        conn.close()
