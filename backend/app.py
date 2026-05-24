from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from werkzeug.security import generate_password_hash, check_password_hash
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import random
import string
import os
import re
from dotenv import load_dotenv

from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity
)

load_dotenv()

# ========================
# APP INIT (FIXED ORDER)
# ========================
app = Flask(__name__)

app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "dev-secret")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = 60 * 60 * 24  # 1 day

jwt = JWTManager(app)

CORS(
    app,
    origins="*",
    allow_headers=["Content-Type", "Authorization"],
    methods=["GET", "POST", "DELETE", "OPTIONS"]
)

limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per day", "50 per hour"]
)

# ========================
# VALIDATION
# ========================
EMAIL_REGEX = r"^[^@]+@[^@]+\.[^@]+$"

def sanitize_string(value, max_length=255):
    if not isinstance(value, str):
        return ""
    return value.strip()[:max_length]

def validate_email(email):
    return re.match(EMAIL_REGEX, email) is not None

def safe_int(value, field_name):
    try:
        return int(value)
    except:
        raise ValueError(f"Invalid {field_name}")

def safe_float(value, field_name):
    try:
        return float(value)
    except:
        raise ValueError(f"Invalid {field_name}")

def generate_code():
    return 'BIZAI-' + ''.join(random.choices(string.digits, k=4))

# ========================
# DATABASE
# ========================
def get_db():
    return mysql.connector.connect(
        host=os.environ.get('DB_HOST', 'localhost'),
        user=os.environ.get('DB_USER', 'root'),
        password=os.environ.get('DB_PASSWORD', ''),
        database=os.environ.get('DB_NAME', 'bizai'),
        connection_timeout=5
    )

# ========================
# INIT DB
# ========================
def init_db():
    conn = mysql.connector.connect(host='localhost', user='root', password='')
    cursor = conn.cursor()

    cursor.execute("CREATE DATABASE IF NOT EXISTS bizai")
    cursor.execute("USE bizai")

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS businesses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(20) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        business_id INT DEFAULT NULL,
        FOREIGN KEY (business_id) REFERENCES businesses(id)
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS stock (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        product VARCHAR(100) NOT NULL,
        qty_bought INT NOT NULL,
        cost_per_unit DECIMAL(10,2) NOT NULL,
        total_cost DECIMAL(10,2) NOT NULL,
        duration_days INT NOT NULL DEFAULT 30,
        qty_remaining INT NOT NULL,
        suggested_price DECIMAL(10,2) DEFAULT 0,
        stock_type VARCHAR(20) DEFAULT 'new',
        date_added VARCHAR(50) NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
    """)

    conn.commit()
    conn.close()

init_db()

# ========================
# AUTH - REGISTER
# ========================
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()

    name = sanitize_string(data.get('name'), 100)
    email = sanitize_string(data.get('email'), 100)
    password = sanitize_string(data.get('password'), 255)
    business_name = sanitize_string(data.get('business_name'), 100)

    if not all([name, email, password, business_name]):
        return jsonify({"error": "All fields required"}), 400

    if not validate_email(email):
        return jsonify({"error": "Invalid email"}), 400

    if len(password) < 6:
        return jsonify({"error": "Password too short"}), 400

    hashed = generate_password_hash(password)
    code = generate_code()

    conn = get_db()
    cursor = conn.cursor()

    try:
        cursor.execute("INSERT INTO businesses (name, code) VALUES (%s, %s)", (business_name, code))
        business_id = cursor.lastrowid

        cursor.execute("""
            INSERT INTO users (name, email, password, role, business_id)
            VALUES (%s, %s, %s, %s, %s)
        """, (name, email, hashed, "admin", business_id))

        conn.commit()
        conn.close()

        return jsonify({
            "message": "Account created",
            "business_code": code
        }), 201

    except mysql.connector.IntegrityError:
        return jsonify({"error": "Email already exists"}), 400

# ========================
# AUTH - LOGIN (FIXED JWT)
# ========================
@app.route('/api/login', methods=['POST'])
@limiter.limit("5 per minute")
def login():
    data = request.get_json()

    email = sanitize_string(data.get('email'))
    password = sanitize_string(data.get('password'))

    if not email or not password:
        return jsonify({"error": "Missing fields"}), 400

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, name, email, password, role, business_id
        FROM users WHERE email = %s
    """, (email,))

    user = cursor.fetchone()
    conn.close()

    if user and check_password_hash(user[3], password):

        token = create_access_token(identity={
            "id": user[0],
            "name": user[1],
            "email": user[2],
            "role": user[4],
            "business_id": user[5]
        })

        return jsonify({
            "message": "Login successful",
            "access_token": token,
            "user": {
                "id": user[0],
                "name": user[1],
                "email": user[2],
                "role": user[4],
                "business_id": user[5]
            }
        })

    return jsonify({"error": "Invalid credentials"}), 401

# ========================
# JOIN BUSINESS
# ========================
@app.route('/api/join-business', methods=['POST'])
def join_business():
    data = request.get_json()

    name = sanitize_string(data.get('name'), 100)
    email = sanitize_string(data.get('email'), 100)
    password = sanitize_string(data.get('password'), 255)
    code = sanitize_string(data.get('code'), 20).upper()

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM businesses WHERE code=%s", (code,))
    business = cursor.fetchone()

    if not business:
        return jsonify({"error": "Invalid business code"}), 404

    business_id = business[0]

    cursor.execute("SELECT COUNT(*) FROM users WHERE business_id=%s", (business_id,))
    if cursor.fetchone()[0] >= 2:
        return jsonify({"error": "Business full"}), 400

    hashed = generate_password_hash(password)

    try:
        cursor.execute("""
            INSERT INTO users (name, email, password, role, business_id)
            VALUES (%s,%s,%s,%s,%s)
        """, (name, email, hashed, "user", business_id))

        conn.commit()
        conn.close()

        return jsonify({"message": "Joined business"}), 201

    except mysql.connector.IntegrityError:
        return jsonify({"error": "Email exists"}), 400

# ========================
# STOCK (PROTECTED)
# ========================
@app.route('/api/stock', methods=['POST'])
@jwt_required()
def add_stock():

    current_user = get_jwt_identity()
    user_id = current_user["id"]

    data = request.get_json()

    try:
        qty = safe_int(data.get('qty_bought'), 'qty')
        cost = safe_float(data.get('cost_per_unit'), 'cost')
        duration = safe_int(data.get('duration_days', 30), 'duration')
        suggested_price = safe_float(data.get('suggested_price', 0), 'price')
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    product = sanitize_string(data.get('product'), 100)

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, qty_remaining FROM stock
        WHERE user_id=%s AND product=%s
        ORDER BY id DESC LIMIT 1
    """, (user_id, product))

    existing = cursor.fetchone()

    if existing:
        cursor.execute("""
            UPDATE stock
            SET qty_remaining=%s,
                qty_bought=qty_bought+%s,
                total_cost=total_cost+%s
            WHERE id=%s
        """, (existing[1] + qty, qty, qty * cost, existing[0]))

    else:
        cursor.execute("""
            INSERT INTO stock (
                user_id, product, qty_bought,
                cost_per_unit, total_cost,
                duration_days, qty_remaining,
                suggested_price, date_added, stock_type
            )
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (
            user_id, product, qty,
            cost, qty * cost,
            duration, qty,
            suggested_price, data.get("date", ""), "new"
        ))

    conn.commit()
    conn.close()

    return jsonify({"message": "Stock added"})

# ========================
# ME (TEST JWT)
# ========================
@app.route('/api/me', methods=['GET'])
@jwt_required()
def me():
    return jsonify(get_jwt_identity())

# ========================
# ERROR HANDLER
# ========================
@app.errorhandler(Exception)
def handle_error(e):
    print("ERROR:", e)
    return jsonify({"error": "Server error"}), 500

# ========================
# RUN
# ========================
if __name__ == '__main__':
    app.run(debug=True)