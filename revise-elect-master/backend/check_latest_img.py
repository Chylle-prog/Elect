import base64
from db_utils import query_db

imgs = query_db('SELECT image_id, image_data FROM review_images ORDER BY image_id DESC LIMIT 1')
if imgs:
    img = imgs[0]
    data = img['image_data']
    if hasattr(data, 'tobytes'): data = data.tobytes()
    b64 = base64.b64encode(data).decode()
    print(f"ID: {img['image_id']}")
    print(f"Data length: {len(b64)}")
    print(f"Data start: {b64[:100]}")
else:
    print("No images found")
