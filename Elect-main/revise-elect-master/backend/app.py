from flask import Flask, jsonify, request
from flask_cors import CORS
from db_utils import query_db
import os
import base64
from datetime import datetime

app = Flask(__name__)
CORS(app)

def to_bytes(b64_str):
    if not b64_str or not isinstance(b64_str, str): return None
    try:
        if ',' in b64_str: b64_str = b64_str.split(',')[1]
        return base64.b64decode(b64_str)
    except Exception as e:
        print(f"Error decoding base64: {e}")
        return None

def to_base64(binary):
    if not binary: return None
    try:
        # If it's already a memoryview (psycopg2)
        if hasattr(binary, 'tobytes'): binary = binary.tobytes()
        b64 = base64.b64encode(binary).decode('utf-8')
        return f"data:image/png;base64,{b64}"
    except: return None

@app.errorhandler(Exception)
def handle_exception(e):
    print(f"Server Error: {e}")
    return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    admin = query_db("SELECT * FROM admins WHERE email = %s AND password = %s", (email, password), one=True)
    if admin:
        return jsonify({
            "success": True,
            "message": "Login successful",
            "user": {"email": admin['email'], "role": "admin"}
        })
    else:
        return jsonify({
            "success": False,
            "message": "Invalid credentials"
        })

@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    data = request.json
    email = data.get('email')
    new_password = data.get('new_password')
    
    if not email or not new_password:
        return jsonify({"success": False, "message": "Email and new password are required"}), 400
        
    admin = query_db("SELECT * FROM admins WHERE email = %s", (email,), one=True)
    if not admin:
        return jsonify({"success": False, "message": "Admin email not found"}), 404
        
    query_db("UPDATE admins SET password = %s WHERE email = %s", (new_password, email))
    
    return jsonify({
        "success": True,
        "message": "Password reset successful"
    })

@app.route('/api/customer/login', methods=['POST'])
def customer_login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    customer = query_db("""
        SELECT * 
        FROM customers
        WHERE email = %s AND password = %s
    """, (email, password), one=True)
    if customer:
        return jsonify({
            "success": True,
            "message": "Login successful",
            "user": {
                "id": customer['customer_id'],
                "firstName": customer['first_name'],
                "lastName": customer['last_name'],
                "fullName": f"{customer['first_name']} {customer['last_name']}".strip(),
                "email": customer['email'],
                "phone": customer['phone'],
                "houseNumber": customer['house_number'],
                "purok": customer['purok'],
                "barangay": customer['barangay'],
                "landmark": customer['landmark'],
                "hasIdFront": bool(customer['id_front']),
                "hasIdBack": bool(customer['id_back'])
            }
        })
    else:
        return jsonify({
            "success": False,
            "message": "Invalid email or password"
        }), 401

@app.route('/api/customer/register', methods=['POST'])
def customer_register():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    fullName = data.get('fullName')
    phone = data.get('phone', '')

    existing = query_db("SELECT * FROM customers WHERE email = %s", (email,), one=True)
    if existing:
        return jsonify({"success": False, "message": "Email already registered"}), 400

    first_name = fullName.split(' ')[0] if fullName else ''
    last_name = ' '.join(fullName.split(' ')[1:]) if fullName and ' ' in fullName else ''

    query_db("""
        INSERT INTO customers (first_name, last_name, email, password, phone, status, id_front, id_back) 
        VALUES (%s, %s, %s, %s, %s, 'Active', %s, %s)
    """, (first_name, last_name, email, password, phone, to_bytes(data.get('idFront')), to_bytes(data.get('idBack'))))

    customer = query_db("SELECT * FROM customers WHERE email = %s", (email,), one=True)
    return jsonify({
        "success": True, 
        "message": "Registration successful",
        "user": {
            "id": customer['customer_id'],
            "firstName": customer['first_name'],
            "lastName": customer['last_name'],
            "fullName": f"{customer['first_name']} {customer['last_name']}".strip(),
            "email": customer['email']
        }
    })

def send_email(subject, body):
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart
    
    sender_email = "alexie_chyle_magbuhat@dlsl.edu.ph"
    sender_password = "blgd sxux hpen rrcd"
    receiver_email = "iskomats@gmail.com"

    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = receiver_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))

    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, receiver_email, msg.as_string())
        return True
    except Exception as e:
        sys.stderr.write(f"EMAIL ERROR: {e}\n")
        return False

@app.route('/api/stats', methods=['GET'])
def get_stats():
    # Total Revenue from COMPLETED bookings (Sum of pet services)
    total_rev = query_db("""
        SELECT SUM(s.price) as total 
        FROM bookings b
        JOIN pets p ON b.booking_id = p.booking_id
        JOIN services s ON p.service_id = s.service_id
        WHERE b.status = 'completed'
    """, one=True)
    
    # Active Clients
    active_cust = query_db("SELECT COUNT(*) as count FROM customers WHERE status = 'Active'", one=True)
    
    # Completed Services count (Total pets groomed)
    comp_services = query_db("""
        SELECT COUNT(p.pet_id) as count 
        FROM bookings b
        JOIN pets p ON b.booking_id = p.booking_id
        WHERE b.status = 'completed'
    """, one=True)
    
    # Daily Tasks (Pending or Accepted for TODAY)
    today = datetime.now().strftime('%Y-%m-%d')
    daily_tasks = query_db("""
        SELECT COUNT(*) as count FROM bookings 
        WHERE (status = 'pending' OR status = 'accepted') 
        AND booking_date::text = %s
    """, (today,), one=True)
    
    return jsonify({
        "totalRevenue": total_rev['total'] or 0,
        "activeClients": active_cust['count'] or 0,
        "completedServices": comp_services['count'] or 0,
        "dailyTasks": daily_tasks['count'] or 0,
        "monthlyGrowth": 12 # Placeholder or calculate if needed
    })

@app.route('/api/bookings', methods=['GET', 'POST'])
def handle_bookings():
    if request.method == 'POST':
        data = request.json
        first_name = data.get('firstName')
        last_name = data.get('lastName')
        
        # 1. Resolve Customer
        cust_id = data.get('customerId')
        email = data.get('email')
        cur_cust = None

        if cust_id:
            cur_cust = query_db("SELECT customer_id FROM customers WHERE customer_id = %s", (cust_id,), one=True)
        
        if not cur_cust and email:
            cur_cust = query_db("SELECT customer_id FROM customers WHERE email = %s", (email,), one=True)

        if not cur_cust:
            cur_cust = query_db("SELECT customer_id FROM customers WHERE first_name = %s AND last_name = %s", (first_name, last_name), one=True)
        
        if not cur_cust:
            cur_cust = query_db("""
                INSERT INTO customers (first_name, last_name, email, phone, house_number, purok, barangay, landmark, status, id_front, id_back) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'Active', %s, %s) RETURNING customer_id
            """, (first_name, last_name, email, data.get('phone'), data.get('houseNumber'), data.get('purok'), data.get('barangay'), data.get('landmark'), to_bytes(data.get('idFront')), to_bytes(data.get('idBack'))), one=True)
        
        cust_id = cur_cust['customer_id']

        # Update customer info
        query_db("""
            UPDATE customers SET 
            first_name = COALESCE(%s, first_name),
            last_name = COALESCE(%s, last_name),
            phone = COALESCE(%s, phone),
            house_number = COALESCE(%s, house_number),
            purok = COALESCE(%s, purok), 
            barangay = COALESCE(%s, barangay),
            middle_name = COALESCE(%s, middle_name),
            landmark = COALESCE(%s, landmark),
            id_front = COALESCE(%s, id_front),
            id_back = COALESCE(%s, id_back)
            WHERE customer_id = %s
        """, (
            first_name, last_name, data.get('phone'), data.get('houseNumber'), 
            data.get('purok'), data.get('barangay'), data.get('middleName'), data.get('landmark'), 
            to_bytes(data.get('idFront')), to_bytes(data.get('idBack')), cust_id
        ))

        # 2. Create Single Booking Header
        booking_id = query_db("""
            INSERT INTO bookings (customer_id, booking_date, booking_time, status, special_requests)
            VALUES (%s, %s, %s, %s, %s) RETURNING booking_id
        """, (cust_id, data.get('date'), data.get('time'), data.get('status', 'pending'), data.get('specialRequests')), one=True)['booking_id']

        # 3. Create Pets linked to this Booking
        pets_list = data.get('pets', [])
        if not pets_list:
            pets_list = [{
                "petName": data.get('petName'),
                "breed": data.get('breed'),
                "petSize": data.get('petSize'),
                "petAge": data.get('petAge'),
                "petAgeUnit": data.get('petAgeUnit'),
                "service": data.get('service')
            }]

        # Check for promo code and determine discount percentage
        promo_code = data.get('promoCode')
        applied_discount = False
        discount_percent = 0
        if promo_code:
            customer = query_db("SELECT reward_code, code_used FROM customers WHERE customer_id = %s", (cust_id,), one=True)
            if customer and customer['reward_code'] and customer['reward_code'].upper() == promo_code.upper():
                applied_discount = True
                code_used_count = customer.get('code_used', 0)
                
                # Tiered discount logic
                if code_used_count == 0: discount_percent = 10
                elif code_used_count == 1: discount_percent = 30
                else: discount_percent = 100
                
                # Use code and increment count
                query_db("UPDATE customers SET reward_code = NULL, code_used = COALESCE(code_used, 0) + 1 WHERE customer_id = %s", (cust_id,))

        # Prep pet data with prices
        processed_pets = []
        for p in pets_list:
            srv = query_db("SELECT service_id, price FROM services WHERE service_name = %s", (p.get('service'),), one=True)
            processed_pets.append({
                **p,
                "service_id": srv['service_id'] if srv else 1,
                "price": srv['price'] if srv else 0
            })

        # Find most expensive to discount
        max_idx = -1
        if applied_discount and processed_pets:
            max_price = -1
            for i, p in enumerate(processed_pets):
                if p['price'] > max_price:
                    max_price = p['price']
                    max_idx = i

        for idx, p in enumerate(processed_pets):
            p_price = p['price']
            if applied_discount and idx == max_idx:
                # Apply percentage discount
                reduction = (p_price * discount_percent) // 100
                final_price = p_price - reduction
            else:
                final_price = p_price

            query_db("""
                INSERT INTO pets (customer_id, booking_id, pet_name, species, breed, size, age, age_unit, service_id, price) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (cust_id, booking_id, p.get('petName'), p.get('species', 'Dog'), p.get('breed'), p.get('petSize'), p.get('petAge'), p.get('petAgeUnit'), p['service_id'], final_price))

        # Email notification for new booking
        try:
            pet_details = ""
            for i, p in enumerate(processed_pets):
                p_price = p['price']
                if applied_discount and i == max_idx:
                    reduction = (p_price * discount_percent) // 100
                    p_price = p_price - reduction
                pet_details += f"  Pet {i+1}: {p.get('petName', 'N/A')} | Breed: {p.get('breed', 'N/A')} | " \
                               f"Size: {p.get('petSize', 'N/A')} | Service: {p.get('service', 'N/A')} | " \
                               f"Price: ₱{p_price}\n"

            subject = f"New Booking #{booking_id} Received"
            body = f"A new booking has been submitted.\n\n" \
                   f"Booking ID: {booking_id}\n" \
                   f"Customer: {first_name} {last_name}\n" \
                   f"Email: {email or 'N/A'}\n" \
                   f"Phone: {data.get('phone', 'N/A')}\n" \
                   f"Date: {data.get('date')}\n" \
                   f"Time: {data.get('time')}\n" \
                   f"Status: {data.get('status', 'pending')}\n\n" \
                   f"--- Pet & Service Details ---\n" \
                   f"{pet_details}\n" \
                   f"Special Requests: {data.get('specialRequests', 'None')}\n"
            if applied_discount:
                body += f"Promo Code Applied: {promo_code} ({discount_percent}% discount)\n"
            send_email(subject, body)
        except Exception as e:
            sys.stderr.write(f"BOOKING EMAIL ERROR: {e}\n")

        return jsonify({"success": True, "message": "Booking created with pets", "bookingId": booking_id, "discountApplied": applied_discount})

    # GET: Fetch all bookings and group their pets
    rows = query_db("""
        SELECT b.*, c.first_name, c.last_name, c.middle_name, c.purok, c.landmark, c.barangay, c.house_number, c.phone, c.email,
               c.id_front, c.id_back,
               p.pet_id, p.pet_name, p.species, p.breed, p.size as pet_size, p.age as pet_age, p.age_unit as pet_age_unit,
               s.service_name, s.price
        FROM bookings b
        JOIN customers c ON b.customer_id = c.customer_id
        LEFT JOIN pets p ON b.booking_id = p.booking_id
        LEFT JOIN services s ON p.service_id = s.service_id
        ORDER BY b.booking_id DESC
    """)
    
    bookings_map = {}
    for r in rows:
        bid = r['booking_id']
        if bid not in bookings_map:
            bookings_map[bid] = {
                "id": bid,
                "customerId": r['customer_id'],
                "firstName": r['first_name'],
                "lastName": r['last_name'],
                "middleName": r['middle_name'],
                "clientName": f"{r['first_name']} {r['last_name']}".strip(),
                "phone": r['phone'],
                "email": r['email'],
                "petName": r['pet_name'],
                "species": r['species'],
                "idFront": to_base64(r['id_front']),
                "idBack": to_base64(r['id_back']),
                "purok": r['purok'],
                "barangay": r['barangay'],
                "houseNumber": r['house_number'],
                "landmark": r['landmark'],
                "date": str(r['booking_date']),
                "time": r['booking_time'],
                "status": r['status'],
                "specialRequests": r['special_requests'],
                "pets": [],
                "totalPrice": 0
            }
        
        if r['pet_id']:
            bookings_map[bid]['pets'].append({
                "id": r['pet_id'],
                "petName": r['pet_name'],
                "species": r['species'],
                "breed": r['breed'],
                "petSize": r['pet_size'],
                "petAge": r['pet_age'],
                "petAgeUnit": r['pet_age_unit'],
                "service": r['service_name'],
                "price": r['price'],
                "status": r['status']
            })
            bookings_map[bid]['totalPrice'] += (r['price'] or 0)
            
    return jsonify(list(bookings_map.values()))

@app.route('/api/bookings/<int:booking_id>', methods=['PUT', 'DELETE'])
def update_booking(booking_id):
    if request.method == 'DELETE':
        query_db("DELETE FROM bookings WHERE booking_id = %s", (booking_id,))
        return jsonify({"success": True, "message": "Booking deleted"})
    
    if request.method == 'PUT':
        data = request.json
        status = data.get('status', '').lower()
        new_date = data.get('date')
        new_time = data.get('time')
        
        if status:
            query_db("UPDATE bookings SET status = %s WHERE booking_id = %s", (status, booking_id))
            
            # Fetch booking details for status-specific actions
            booking = query_db("""
                SELECT b.*, c.first_name, c.last_name, c.email as customer_email, c.customer_id
                FROM bookings b
                JOIN customers c ON b.customer_id = c.customer_id
                WHERE b.booking_id = %s
            """, (booking_id,), one=True)
            
            # Award reward point on completion
            if status == 'completed' and booking:
                query_db("UPDATE customers SET reward_points = reward_points + 1 WHERE customer_id = %s", (booking['customer_id'],))
            
            # Email notification on cancel
            if status == 'cancelled' and booking:
                subject = f"Booking #{booking_id} Cancelled"
                body = f"A booking has been cancelled.\n\n" \
                       f"Booking ID: {booking_id}\n" \
                       f"Customer: {booking['first_name']} {booking['last_name']}\n" \
                       f"Email: {booking['customer_email']}\n" \
                       f"Date: {booking['booking_date']}\n" \
                       f"Time: {booking['booking_time']}\n"
                send_email(subject, body)
            
            return jsonify({"success": True, "message": f"Booking status updated to {status}"})

        # Simple reschedule
        if new_date and new_time:
            # Check exact match only
            conflict = query_db("""
                SELECT booking_id FROM bookings 
                WHERE booking_date::text = %s 
                AND booking_time = %s 
                AND booking_id != %s
                AND status IN ('pending', 'accepted')
            """, (new_date, new_time, booking_id), one=True)
            
            if conflict:
                return jsonify({"success": False, "message": "This time slot is already taken"}), 400
                
            query_db("UPDATE bookings SET booking_date = %s, booking_time = %s WHERE booking_id = %s", 
                     (new_date, new_time, booking_id))
            return jsonify({"success": True, "message": "Booking rescheduled successfully"})
            
        return jsonify({"success": True, "message": "Booking updated"})

@app.route('/api/customers', methods=['GET', 'POST'])
def handle_customers():
    if request.method == 'POST':
        data = request.json
        query_db("""
            INSERT INTO customers (first_name, last_name, email, phone, house_number, purok, barangay, status, total_visits, id_front, id_back)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            data.get('firstName'), data.get('lastName'), data.get('email'), data.get('phone'),
            data.get('houseNumber'), data.get('purok'),
            data.get('barangay'), data.get('status', 'Active'), data.get('totalVisits', 0),
            to_bytes(data.get('idFront')), to_bytes(data.get('idBack'))
        ))
        return jsonify({"success": True, "message": "Customer created"})

    customers = query_db("""
        SELECT * 
        FROM customers
        ORDER BY customer_id ASC
    """)
    mapped = []
    for c in customers:
        mapped.append({
            "id": c['customer_id'],
            "firstName": c['first_name'],
            "lastName": c['last_name'],
            "name": f"{c['first_name']} {c['last_name']}".strip(),
            "email": c['email'],
            "phone": c['phone'],
            "houseNumber": c['house_number'],
            "purok": c['purok'],
            "barangay": c['barangay'],
            "landmark": c['landmark'],
            "status": c['status'],
            "lastVisit": str(c['last_visit']),
            "totalVisits": c['total_visits'],
            "rewardPoints": c['reward_points'],
            "codeUsed": c['code_used'],
            "idFront": to_base64(c['id_front']),
            "idBack": to_base64(c['id_back'])
        })
    return jsonify(mapped)

@app.route('/api/customers/<int:customer_id>', methods=['GET', 'PUT', 'DELETE'])
def manage_customer(customer_id):
    if request.method == 'GET':
        c = query_db("SELECT * FROM customers WHERE customer_id = %s", (customer_id,), one=True)
        if not c: return jsonify({"error": "Not found"}), 404
        return jsonify({
            "id": c['customer_id'],
            "firstName": c['first_name'],
            "lastName": c['last_name'],
            "fullName": f"{c['first_name']} {c['last_name']}".strip(),
            "email": c['email'],
            "phone": c['phone'],
            "houseNumber": c['house_number'],
            "purok": c['purok'],
            "barangay": c['barangay'],
            "landmark": c['landmark'],
            "rewardPoints": c['reward_points'],
            "rewardCode": c['reward_code'],
            "codeUsed": c['code_used'],
            "hasIdFront": bool(c['id_front']),
            "hasIdBack": bool(c['id_back'])
        })
    
    if request.method == 'DELETE':
        query_db("DELETE FROM customers WHERE customer_id = %s", (customer_id,))
        return jsonify({"success": True, "message": "Customer deleted"})
    
    if request.method == 'PUT':
        data = request.json
        query_db("""
            UPDATE customers SET 
            first_name = %s, last_name = %s, email = %s, phone = %s, 
            house_number = %s, purok = %s, barangay = %s, status = %s,
            id_front = %s, id_back = %s
            WHERE customer_id = %s
        """, (
            data.get('firstName'), data.get('lastName'), data.get('email'), data.get('phone'),
            data.get('houseNumber'), data.get('purok'),
            data.get('barangay'), data.get('status'),
            to_bytes(data.get('idFront')), to_bytes(data.get('idBack')),
            customer_id
        ))
        return jsonify({"success": True, "message": "Customer updated"})

@app.route('/api/services', methods=['GET', 'POST'])
def handle_services():
    if request.method == 'POST':
        data = request.json
        query_db("INSERT INTO services (service_name, price, service_type) VALUES (%s, %s, %s)", 
                 (data.get('name'), data.get('price'), data.get('type', 'Other')))
        return jsonify({"success": True, "message": "Service created"})
    
    services = query_db("""
        SELECT s.*, COUNT(p.pet_id) as computed_bookings_count 
        FROM services s 
        LEFT JOIN pets p ON s.service_id = p.service_id 
        GROUP BY s.service_id 
        ORDER BY s.service_id ASC
    """)
    return jsonify([{
        "id": s['service_id'],
        "name": s['service_name'],
        "price": s['price'],
        "type": s['service_type'],
        "bookings": s['computed_bookings_count']
    } for s in services])

@app.route('/api/services/<int:service_id>', methods=['PUT', 'DELETE'])
def update_service(service_id):
    try:
        if request.method == 'DELETE':
            query_db("DELETE FROM services WHERE service_id = %s", (service_id,))
            return jsonify({"success": True, "message": "Service deleted"})
        if request.method == 'PUT':
            data = request.json
            if 'price' in data:
                query_db("UPDATE services SET price = %s WHERE service_id = %s", (data['price'], service_id))
            return jsonify({"success": True, "message": "Service updated"})
    except Exception as e:
        print(f"Error in update_service: {e}")
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/customers/<int:customer_id>', methods=['GET'])
def get_customer(customer_id):
    customer = query_db("""
        SELECT * 
        FROM customers
        WHERE customer_id = %s
    """, (customer_id,), one=True)
    if customer:
        customer['idFront'] = to_base64(customer['id_front'])
        customer['idBack'] = to_base64(customer['id_back'])
        return jsonify(customer)
    return jsonify({"error": "Customer not found"}), 404

@app.route('/api/customers/<int:customer_id>/pets', methods=['GET'])
def get_customer_pets(customer_id):
    # Only show pets that have at least one 'completed' booking
    pets = query_db("""
        SELECT DISTINCT p.pet_id, p.pet_name, p.breed 
        FROM pets p
        JOIN bookings b ON p.pet_id = b.pet_id
        WHERE p.customer_id = %s AND b.status = 'completed'
    """, (customer_id,))
    return jsonify(pets)

@app.route('/api/reviews', methods=['GET', 'POST'])
def handle_reviews():
    if request.method == 'POST':
        data = request.json
        review_id = query_db("""
            INSERT INTO reviews (customer_id, pet_id, rating, review_text)
            VALUES (%s, %s, %s, %s) RETURNING review_id
        """, (data.get('customer_id'), data.get('pet_id') or None, data.get('rating'), data.get('text')), one=True)
        
        if not review_id:
            return jsonify({"success": False, "message": "Failed to create review"}), 500
            
        rid = review_id['review_id']
        images = data.get('images', [])
        for img in images:
            b_data = to_bytes(img)
            if b_data:
                query_db("INSERT INTO review_images (review_id, image_data) VALUES (%s, %s)", (rid, b_data))
            
        return jsonify({"success": True, "message": "Review posted", "review_id": rid})

    # GET
    reviews = query_db("""
        SELECT r.*, c.first_name, c.last_name, p.pet_name, p.breed as pet_breed
        FROM reviews r
        JOIN customers c ON r.customer_id = c.customer_id
        LEFT JOIN pets p ON r.pet_id = p.pet_id
        ORDER BY r.created_at DESC
    """)
    
    mapped = []
    for r in reviews:
        imgs = query_db("SELECT image_data FROM review_images WHERE review_id = %s", (r['review_id'],))
        mapped.append({
            "id": r['review_id'],
            "name": f"{r['first_name']} {r['last_name']}".strip(),
            "rating": r['rating'],
            "text": r['review_text'],
            "pet": f"{r['pet_name']} ({r['pet_breed']})" if r['pet_name'] else "General",
            "date": r['created_at'].strftime("%Y-%m-%d"),
            "images": [to_base64(i['image_data']) for i in imgs],
            "customer_id": r['customer_id']
        })
    return jsonify(mapped)

@app.route('/api/reviews/<int:review_id>', methods=['PUT', 'DELETE'])
def update_review(review_id):
    if request.method == 'DELETE':
        query_db("DELETE FROM reviews WHERE review_id = %s", (review_id,))
        return jsonify({"success": True, "message": "Review deleted"})
    
    if request.method == 'PUT':
        data = request.json
        query_db("""
            UPDATE reviews SET rating = %s, review_text = %s 
            WHERE review_id = %s
        """, (data.get('rating'), data.get('text'), review_id))
        
        if 'images' in data:
            query_db("DELETE FROM review_images WHERE review_id = %s", (review_id,))
            for img in data['images']:
                query_db("INSERT INTO review_images (review_id, image_data) VALUES (%s, %s)", (review_id, to_bytes(img)))
                
        return jsonify({"success": True, "message": "Review updated"})

@app.route('/api/rates', methods=['GET'])
def get_rates():
    # Fetch consolidated rates from services table
    size_rates = query_db("SELECT service_name, price FROM services WHERE service_type = 'Size'")
    breed_rates = query_db("SELECT service_name, price FROM services WHERE service_type = 'Breed'")
    
    return jsonify({
        "petSizeRates": {r['service_name']: r['price'] for r in size_rates},
        "specialBreedRates": {r['service_name']: r['price'] for r in breed_rates}
    })

@app.route('/api/barangays', methods=['GET'])
def get_barangays():
    # Return hardcoded list as the table is removed
    barangays = [
        "Adya", "Anilao", "Anilao-Labac", "Antipolo Del Norte", "Antipolo Del Sur", 
        "Bagong Pook", "Balintawak", "Banaybanay", "Bolbok", "Bugtong na Pulo", 
        "Bulacnin", "Bulaklakan", "Calamias", "Cumba", "Dagatan", "Duhatan", 
        "Halang", "Inosloban", "Kayumanggi", "Labac", "Latag", "Lodlod", "Lumbang", 
        "Malagonlong", "Malitlit", "Marawoy", "Mataas Na Lupa", "Munting Pulo", 
        "Pagolingin Bata", "Pagolingin East", "Pagolingin West", "Pangao", 
        "Pinagkawitan", "Pinagtongulan", "Plaridel", "Poblacion Barangay 1", 
        "Poblacion Barangay 2", "Poblacion Barangay 3", "Poblacion Barangay 4", 
        "Poblacion Barangay 5", "Poblacion Barangay 6", "Poblacion Barangay 7", 
        "Poblacion Barangay 8", "Poblacion Barangay 9", "Poblacion Barangay 9-A", 
        "Poblacion Barangay 10", "Poblacion Barangay 11", "Poblacion Barangay 12", 
        "Pusil", "Quezon", "Rizal", "Sabang", "Sampaguita", "San Benito", 
        "San Carlos", "San Celestino", "San Francisco", "San Guillermo", 
        "San Isidro", "San Jose", "San Lucas", "San Salvador", "San Sebastian", 
        "Santo Nio", "Santo Toribio", "Sapang", "Sico", "Talisay", "Tambo", 
        "Tangob", "Tanguay", "Tibig", "Tipacan"
    ]
    return jsonify(sorted(barangays))

@app.route('/api/contact', methods=['POST'])
def handle_contact():
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart

    data = request.json
    customer_id = data.get('customer_id')
    subject_input = data.get('subject', 'Contact Support Request')
    message_body = data.get('message', '')

    # Fetch customer info for the email body
    customer = query_db("SELECT * FROM customers WHERE customer_id = %s", (customer_id,), one=True)
    customer_info = f"Customer ID: {customer_id}\n"
    if customer:
        customer_info += f"Name: {customer['first_name']} {customer['last_name']}\nEmail: {customer['email']}\n"
    
    sender_email = "alexie_chyle_magbuhat@dlsl.edu.ph"
    sender_password = "blgd sxux hpen rrcd"
    receiver_email = "iskomats@gmail.com"

    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = receiver_email
    msg['Subject'] = f"CSJ Contact Form: {subject_input}"

    body = f"You have received a new message from the CSJ Pet Grooming Contact Form:\n\n{customer_info}\nSubject: {subject_input}\nMessage:\n{message_body}"
    msg.attach(MIMEText(body, 'plain'))

    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, receiver_email, msg.as_string())
        return jsonify({"success": True, "message": "Email sent successfully"})
    except Exception as e:
        sys.stderr.write(f"EMAIL ERROR: {e}\n")
        return jsonify({"success": False, "message": "Failed to send email"}), 500

def time_to_minutes(time_str):
    try:
        t = datetime.strptime(time_str.strip(), "%I:%M %p")
        return t.hour * 60 + t.minute
    except Exception as e:
        sys.stderr.write(f"TIME PARSE ERROR: '{time_str}' - {e}\n")
        return -1 # Use -1 to avoid accidental overlap with 00:00 AM

def get_duration_minutes(duration_str):
    return 60

import sys

@app.route('/api/available-slots', methods=['GET'])
def get_available_slots():
    try:
        date_str = request.args.get('date')
        if not date_str:
            return jsonify([])

        # Standard operating hours slots
        all_slots = [
            '09:00 AM', '10:00 AM', '11:00 AM',
            '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
        ]
        
        bookings = query_db("""
            SELECT b.booking_time
            FROM bookings b
            WHERE b.booking_date::date = %s::date 
            AND b.status NOT IN ('cancelled', 'rejected')
        """, (date_str,))
        
        occupied_slots = [b['booking_time'].strip() for b in bookings]
        
        available = []
        for slot in all_slots:
            # Check for exact match only
            is_blocked = False
            for occ in occupied_slots:
                if time_to_minutes(slot) == time_to_minutes(occ):
                    is_blocked = True
                    break
            
            if not is_blocked:
                available.append(slot)
                
        return jsonify(available)
    except Exception as e:
        sys.stderr.write(f"ERROR in get_available_slots: {e}\n")
        return jsonify({"error": str(e)}), 500

@app.route('/api/customers/redeem', methods=['POST'])
def redeem_rewards():
    data = request.json
    customer_id = data.get('customerId')
    
    customer = query_db("SELECT reward_points, reward_code FROM customers WHERE customer_id = %s", (customer_id,), one=True)
    if not customer:
        return jsonify({"success": False, "message": "Customer not found"}), 404
    
    if customer['reward_code']:
        return jsonify({"success": False, "message": "You already have an active code"}), 400
        
    if customer['reward_points'] < 10:
        return jsonify({"success": False, "message": "Insufficient points"}), 400
    
    # Generate random 6-char code
    import random
    import string
    new_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    
    query_db("UPDATE customers SET reward_points = reward_points - 10, reward_code = %s WHERE customer_id = %s", (new_code, customer_id))
    
    return jsonify({
        "success": True, 
        "message": "Rewards redeemed!",
        "code": new_code
    })

@app.route('/api/customers/verify-code', methods=['POST'])
def verify_reward_code():
    data = request.json
    customer_id = data.get('customerId')
    code = data.get('code')
    
    if not customer_id or not code:
        return jsonify({"success": False, "message": "Missing info"}), 400
        
    customer = query_db("SELECT reward_code, code_used FROM customers WHERE customer_id = %s", (customer_id,), one=True)
    if not customer:
        return jsonify({"success": False, "message": "Customer not found"}), 404
        
    if customer['reward_code'] and customer['reward_code'].upper() == code.upper():
        code_used = customer.get('code_used', 0)
        
        tier = "Bronze"
        discount_percent = 10
        
        if code_used == 1:
            tier = "Silver"
            discount_percent = 30
        elif code_used >= 2:
            tier = "Gold"
            discount_percent = 100
            
        return jsonify({
            "success": True, 
            "message": f"Code verified! {tier} Tier discount ({discount_percent}%) will be applied.",
            "tier": tier,
            "discountPercent": discount_percent
        })
    else:
        return jsonify({"success": False, "message": "Invalid or expired code"}), 400

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
