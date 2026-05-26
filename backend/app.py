from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from werkzeug.security import generate_password_hash, check_password_hash
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_mail import Mail, Message
from itsdangerous import URLSafeTimedSerializer
import random, string, os
from datetime import datetime, timedelta
import threading


app = Flask(__name__)

# ── CORS ──────────────────────────────────────────────────────────────────────
CORS(app)

# ── CONFIG ────────────────────────────────────────────────────────────────────
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-key-change-in-prod')
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME', '')
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD', '')
app.config['MAIL_DEFAULT_SENDER'] = os.environ.get('MAIL_USERNAME', '')

mail = Mail(app)
limiter = Limiter(get_remote_address, app=app, default_limits=["200 per day", "50 per hour"])
serializer = URLSafeTimedSerializer(app.config['SECRET_KEY'])

MAX_ATTEMPTS = 5
LOCK_MINUTES = 10
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5173')


# ── HELPERS ───────────────────────────────────────────────────────────────────

def generate_code():
    return 'BIZAI-' + ''.join(random.choices(string.digits, k=4))


def get_db():
    return mysql.connector.connect(
        host=os.environ.get('DB_HOST', 'localhost'),
        user=os.environ.get('DB_USER', 'root'),
        password=os.environ.get('DB_PASSWORD', ''),
        database=os.environ.get('DB_NAME', 'bizai'),
        port=int(os.environ.get('DB_PORT', 3306)),
        ssl_disabled=False
    )


def get_today():
    now = datetime.now()
    return f"{now.month}/{now.day}/{now.year}"


def init_db():
    try:
        conn = mysql.connector.connect(
            host=os.environ.get('DB_HOST', 'localhost'),
            user=os.environ.get('DB_USER', 'root'),
            password=os.environ.get('DB_PASSWORD', ''),
            port=int(os.environ.get('DB_PORT', 3306)),
            ssl_disabled=False
        )
        cursor = conn.cursor()
        db_name = os.environ.get('DB_NAME', 'bizai')
        cursor.execute(f'CREATE DATABASE IF NOT EXISTS `{db_name}`')
        cursor.execute(f'USE `{db_name}`')

        cursor.execute('''CREATE TABLE IF NOT EXISTS businesses (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100),
            code VARCHAR(20) UNIQUE
        )''')

        cursor.execute('''CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100),
            email VARCHAR(100) UNIQUE,
            password VARCHAR(255),
            role VARCHAR(20) DEFAULT 'user',
            business_id INT,
            is_verified BOOLEAN DEFAULT TRUE,
            failed_attempts INT DEFAULT 0,
            locked_until DATETIME NULL,
            FOREIGN KEY (business_id) REFERENCES businesses(id)
        )''')

        cursor.execute('''CREATE TABLE IF NOT EXISTS stock (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            product VARCHAR(100),
            qty_bought INT,
            cost_per_unit DECIMAL(10,2) DEFAULT 0,
            total_cost DECIMAL(10,2) DEFAULT 0,
            duration_days INT DEFAULT 30,
            qty_remaining INT,
            suggested_price DECIMAL(10,2) DEFAULT 0,
            date_added VARCHAR(30),
            stock_type VARCHAR(20) DEFAULT 'new'
        )''')

        cursor.execute('''CREATE TABLE IF NOT EXISTS sales (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            product VARCHAR(100),
            qty_sold INT,
            price_per_unit DECIMAL(10,2),
            cost_per_unit DECIMAL(10,2) DEFAULT 0,
            total_earned DECIMAL(10,2),
            profit DECIMAL(10,2) DEFAULT 0,
            date VARCHAR(30)
        )''')

        cursor.execute('''CREATE TABLE IF NOT EXISTS operational_expenses (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            item VARCHAR(100),
            amount DECIMAL(10,2),
            frequency VARCHAR(20),
            is_fixed BOOLEAN DEFAULT FALSE,
            date VARCHAR(30)
        )''')

        migrations = [
            ('users', 'is_verified', 'BOOLEAN DEFAULT TRUE'),
            ('users', 'failed_attempts', 'INT DEFAULT 0'),
            ('users', 'locked_until', 'DATETIME NULL'),
            ('sales', 'cost_per_unit', 'DECIMAL(10,2) DEFAULT 0'),
            ('sales', 'profit', 'DECIMAL(10,2) DEFAULT 0'),
            ('stock', 'stock_type', "VARCHAR(20) DEFAULT 'new'"),
        ]
        for table, column, definition in migrations:
            try:
                cursor.execute(f'ALTER TABLE {table} ADD COLUMN {column} {definition}')
            except Exception:
                pass

        conn.commit()
        conn.close()
        print('[BizAI] Database ready')

    except Exception as e:
        print(f'[BizAI] DB not connected: {e}')


# run init_db in background so it doesn't block gunicorn startup
threading.Thread(target=init_db, daemon=True).start()


# ── AUTH ──────────────────────────────────────────────────────────────────────

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    name = data.get('name', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')
    business_name = data.get('business_name', '').strip()

    if not all([name, email, password, business_name]):
        return jsonify({'error': 'All fields required'}), 400
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    conn = get_db()
    cursor = conn.cursor()
    try:
        code = generate_code()
        cursor.execute('INSERT INTO businesses (name, code) VALUES (%s,%s)', (business_name, code))
        business_id = cursor.lastrowid
        cursor.execute(
            'INSERT INTO users (name,email,password,role,business_id,is_verified) VALUES (%s,%s,%s,%s,%s,%s)',
            (name, email, generate_password_hash(password), 'admin', business_id, False)
        )
        conn.commit()

        # Send verification email — non-blocking
        try:
            token = serializer.dumps(email, salt='verify-email')
            link = f"{FRONTEND_URL}/verify-email/{token}"
            msg = Message(
                'Verify your BizAI account',
                sender=app.config['MAIL_USERNAME'],
                recipients=[email],
                body=f"Hi {name},\n\nClick the link below to verify your email:\n{link}\n\nLink expires in 24 hours.\n\nBizAI Team"
            )
            mail.send(msg)
            print(f'[BizAI] Verification email sent to {email}')
        except Exception as e:
            print(f'[BizAI] Email not sent (non-blocking): {e}')

        return jsonify({'message': 'Account created! Check your email to verify.', 'business_code': code}), 201

    except mysql.connector.IntegrityError:
        return jsonify({'error': 'Email already exists'}), 400
    finally:
        try:
            conn.close()
        except Exception:
            pass


@app.route('/api/verify-email/<token>')
def verify_email(token):
    try:
        email = serializer.loads(token, salt='verify-email', max_age=86400)
    except Exception:
        return jsonify({'error': 'Invalid or expired link'}), 400
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('UPDATE users SET is_verified=TRUE WHERE email=%s', (email,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Email verified! You can now login.'})


@app.route('/api/resend-verification', methods=['POST'])
def resend_verification():
    email = request.get_json().get('email', '').strip()
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT name, is_verified FROM users WHERE email=%s', (email,))
    user = cursor.fetchone()
    conn.close()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    if user[1]:
        return jsonify({'message': 'Already verified'}), 200
    try:
        token = serializer.dumps(email, salt='verify-email')
        link = f"{FRONTEND_URL}/verify-email/{token}"
        msg = Message(
            'Verify your BizAI account',
            sender=app.config['MAIL_USERNAME'],
            recipients=[email],
            body=f"Hi {user[0]},\n\nVerify your email here:\n{link}\n\nBizAI Team"
        )
        mail.send(msg)
        return jsonify({'message': 'Verification email sent'})
    except Exception as e:
        print(f'[BizAI] Resend email failed: {e}')
        return jsonify({'error': 'Failed to send email'}), 500


@app.route('/api/login', methods=['POST'])
@limiter.limit("10 per minute")
def login():
    data = request.get_json()
    email = data.get('email', '').strip()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'All fields are required'}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        'SELECT id,name,email,password,role,business_id,is_verified,failed_attempts,locked_until FROM users WHERE email=%s',
        (email,)
    )
    user = cursor.fetchone()

    if not user:
        conn.close()
        return jsonify({'error': 'Invalid email or password'}), 401

    if user[8] and user[8] > datetime.now():
        conn.close()
        return jsonify({'error': f'Account locked. Try again after {LOCK_MINUTES} minutes.'}), 403

    if not user[6]:
        conn.close()
        return jsonify({'error': 'Verify email first'}), 403

    if not check_password_hash(user[3], password):
        new_attempts = user[7] + 1
        if new_attempts >= MAX_ATTEMPTS:
            lock_time = datetime.now() + timedelta(minutes=LOCK_MINUTES)
            cursor.execute('UPDATE users SET failed_attempts=%s, locked_until=%s WHERE email=%s',
                           (new_attempts, lock_time, email))
        else:
            cursor.execute('UPDATE users SET failed_attempts=%s WHERE email=%s', (new_attempts, email))
        conn.commit()
        conn.close()
        remaining = MAX_ATTEMPTS - new_attempts
        if remaining > 0:
            return jsonify({'error': f'Wrong password. {remaining} attempts remaining.'}), 401
        return jsonify({'error': f'Account locked for {LOCK_MINUTES} minutes.'}), 403

    cursor.execute('UPDATE users SET failed_attempts=0, locked_until=NULL WHERE email=%s', (email,))
    conn.commit()
    conn.close()
    return jsonify({
        'message': 'Login successful',
        'user': {'id': user[0], 'name': user[1], 'email': user[2], 'role': user[4], 'business_id': user[5]}
    })


@app.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    email = request.get_json().get('email', '').strip()
    if not email:
        return jsonify({'error': 'Email required'}), 400
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT name FROM users WHERE email=%s', (email,))
    user = cursor.fetchone()
    conn.close()
    if user:
        try:
            token = serializer.dumps(email, salt='reset-password')
            link = f"{FRONTEND_URL}/reset-password/{token}"
            msg = Message(
                'Reset your BizAI password',
                sender=app.config['MAIL_USERNAME'],
                recipients=[email],
                body=f"Hi {user[0]},\n\nClick to reset your password:\n{link}\n\nExpires in 1 hour.\n\nIf you didn't request this, ignore this email.\n\nBizAI Team"
            )
            mail.send(msg)
        except Exception as e:
            print(f'[BizAI] Forgot password email failed: {e}')
            return jsonify({'error': 'Failed to send email'}), 500
    return jsonify({'message': 'If that email exists, a reset link has been sent.'})


@app.route('/api/reset-password/<token>', methods=['POST'])
def reset_password(token):
    try:
        email = serializer.loads(token, salt='reset-password', max_age=3600)
    except Exception:
        return jsonify({'error': 'Invalid or expired token'}), 400
    new_password = request.get_json().get('password', '')
    if len(new_password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('UPDATE users SET password=%s, failed_attempts=0, locked_until=NULL WHERE email=%s',
                   (generate_password_hash(new_password), email))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Password reset successful!'})


@app.route('/api/join-business', methods=['POST'])
def join_business():
    data = request.get_json()
    name = data.get('name', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')
    code = data.get('code', '').strip().upper()
    if not all([name, email, password, code]):
        return jsonify({'error': 'All fields are required'}), 400
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT id FROM businesses WHERE code=%s', (code,))
    business = cursor.fetchone()
    if not business:
        conn.close()
        return jsonify({'error': 'Invalid business code'}), 404
    business_id = business[0]
    cursor.execute('SELECT COUNT(*) FROM users WHERE business_id=%s', (business_id,))
    if cursor.fetchone()[0] >= 2:
        conn.close()
        return jsonify({'error': 'This business already has the maximum of 2 users'}), 400
    try:
        cursor.execute(
            'INSERT INTO users (name,email,password,role,business_id,is_verified) VALUES (%s,%s,%s,%s,%s,%s)',
            (name, email, generate_password_hash(password), 'user', business_id, True)
        )
        conn.commit()
        conn.close()
        return jsonify({'message': 'Successfully joined the business!'}), 201
    except mysql.connector.IntegrityError:
        conn.close()
        return jsonify({'error': 'Email already exists'}), 400


# ── ADMIN ─────────────────────────────────────────────────────────────────────

@app.route('/api/admin/add-user', methods=['POST'])
def add_user():
    data = request.get_json()
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT role,business_id FROM users WHERE id=%s', (data.get('admin_id'),))
    admin = cursor.fetchone()
    if not admin or admin[0] != 'admin':
        conn.close()
        return jsonify({'error': 'Only admins can add users'}), 403
    business_id = admin[1]
    cursor.execute('SELECT COUNT(*) FROM users WHERE business_id=%s', (business_id,))
    if cursor.fetchone()[0] >= 2:
        conn.close()
        return jsonify({'error': 'Maximum 2 users allowed per business'}), 400
    try:
        cursor.execute(
            'INSERT INTO users (name,email,password,role,business_id,is_verified) VALUES (%s,%s,%s,%s,%s,%s)',
            (data['name'], data['email'], generate_password_hash(data['password']), 'user', business_id, True)
        )
        conn.commit()
        conn.close()
        return jsonify({'message': 'User added successfully'}), 201
    except mysql.connector.IntegrityError:
        conn.close()
        return jsonify({'error': 'Email already exists'}), 400


@app.route('/api/admin/users/<int:admin_id>', methods=['GET'])
def get_business_users(admin_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT role,business_id FROM users WHERE id=%s', (admin_id,))
    admin = cursor.fetchone()
    if not admin or admin[0] != 'admin':
        conn.close()
        return jsonify({'error': 'Unauthorized'}), 403
    cursor.execute('SELECT id,name,email,role FROM users WHERE business_id=%s', (admin[1],))
    users = cursor.fetchall()
    conn.close()
    return jsonify([{'id': u[0], 'name': u[1], 'email': u[2], 'role': u[3]} for u in users])


@app.route('/api/admin/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    data = request.get_json()
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT role FROM users WHERE id=%s', (data.get('admin_id'),))
    admin = cursor.fetchone()
    if not admin or admin[0] != 'admin':
        conn.close()
        return jsonify({'error': 'Unauthorized'}), 403
    cursor.execute('DELETE FROM users WHERE id=%s', (user_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'User deleted'})


# ── STOCK ─────────────────────────────────────────────────────────────────────

@app.route('/api/stock', methods=['POST'])
def add_stock():
    data = request.get_json()
    qty = int(data.get('qty_bought', 0))
    cost = float(data.get('cost_per_unit', 0))
    duration = int(data.get('duration_days', 30))
    suggested_price = float(data.get('suggested_price', 0))
    stock_type = data.get('stock_type', 'new')
    if qty <= 0:
        return jsonify({'error': 'Quantity must be greater than zero'}), 400
    if stock_type == 'new' and cost <= 0:
        return jsonify({'error': 'Cost must be greater than zero for new stock'}), 400
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        'SELECT id,qty_remaining FROM stock WHERE user_id=%s AND product=%s ORDER BY id DESC LIMIT 1',
        (data['user_id'], data['product'])
    )
    existing = cursor.fetchone()
    if existing:
        cursor.execute(
            'UPDATE stock SET qty_remaining=%s, qty_bought=qty_bought+%s, total_cost=total_cost+%s, cost_per_unit=%s WHERE id=%s',
            (existing[1] + qty, qty, qty * cost if stock_type == 'new' else 0,
             cost if stock_type == 'new' else 0, existing[0])
        )
    else:
        cursor.execute(
            'INSERT INTO stock (user_id,product,qty_bought,cost_per_unit,total_cost,duration_days,qty_remaining,suggested_price,date_added,stock_type) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)',
            (data['user_id'], data['product'], qty, cost if stock_type == 'new' else 0,
             qty * cost if stock_type == 'new' else 0, duration, qty, suggested_price, data['date'], stock_type)
        )
    conn.commit()
    conn.close()
    return jsonify({'message': 'Stock added successfully'}), 201


@app.route('/api/stock', methods=['GET'])
def get_stock():
    user_id = request.args.get('user_id')
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        'SELECT id,user_id,product,qty_bought,cost_per_unit,total_cost,duration_days,qty_remaining,suggested_price,date_added,stock_type FROM stock WHERE user_id=%s ORDER BY id DESC',
        (user_id,)
    )
    rows = cursor.fetchall()
    conn.close()
    return jsonify([{
        'id': r[0], 'user_id': r[1], 'product': r[2], 'qty_bought': r[3],
        'cost_per_unit': float(r[4]), 'total_cost': float(r[5]), 'duration_days': r[6],
        'qty_remaining': r[7], 'suggested_price': float(r[8] or 0),
        'date_added': r[9], 'stock_type': r[10]
    } for r in rows])


# ── SALES ─────────────────────────────────────────────────────────────────────

@app.route('/api/sales', methods=['POST'])
def add_sale():
    data = request.get_json()
    user_id = data.get('user_id')
    product = data.get('product')
    sale_date = data.get('date')
    entries = data.get('entries')

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        'SELECT id,qty_remaining,cost_per_unit FROM stock WHERE user_id=%s AND product=%s ORDER BY id DESC LIMIT 1',
        (user_id, product)
    )
    stock = cursor.fetchone()
    if not stock:
        conn.close()
        return jsonify({'error': f'No stock found for {product}. Please add stock first.'}), 400

    stock_id, qty_remaining, cost_per_unit = stock[0], int(stock[1]), float(stock[2])

    if entries:
        total_qty = sum(int(e.get('qty_sold', 0)) for e in entries if int(e.get('qty_sold', 0)) > 0)
        if qty_remaining < total_qty:
            conn.close()
            return jsonify({'error': f'Not enough stock. Only {qty_remaining} units available.'}), 400
        for e in entries:
            qty_sold = int(e.get('qty_sold', 0))
            price = float(e.get('price_per_unit', 0))
            if qty_sold <= 0 or price <= 0:
                continue
            profit = (price - cost_per_unit) * qty_sold
            cursor.execute(
                'INSERT INTO sales (user_id,product,qty_sold,price_per_unit,cost_per_unit,total_earned,profit,date) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)',
                (user_id, product, qty_sold, price, cost_per_unit, qty_sold * price, profit, sale_date)
            )
        cursor.execute('UPDATE stock SET qty_remaining=qty_remaining-%s WHERE id=%s', (total_qty, stock_id))
    else:
        qty_sold = int(data.get('qty_sold', 0))
        price = float(data.get('price_per_unit', 0))
        if qty_sold <= 0 or price <= 0:
            conn.close()
            return jsonify({'error': 'Quantity and price must be greater than zero'}), 400
        if qty_remaining < qty_sold:
            conn.close()
            return jsonify({'error': f'Not enough stock. Only {qty_remaining} units available.'}), 400
        profit = (price - cost_per_unit) * qty_sold
        cursor.execute(
            'INSERT INTO sales (user_id,product,qty_sold,price_per_unit,cost_per_unit,total_earned,profit,date) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)',
            (user_id, product, qty_sold, price, cost_per_unit, qty_sold * price, profit, sale_date)
        )
        cursor.execute('UPDATE stock SET qty_remaining=qty_remaining-%s WHERE id=%s', (qty_sold, stock_id))

    conn.commit()
    conn.close()
    return jsonify({'message': 'Sale recorded successfully'}), 201


@app.route('/api/sales', methods=['GET'])
def get_sales():
    user_id = request.args.get('user_id')
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        'SELECT id,user_id,product,qty_sold,price_per_unit,cost_per_unit,total_earned,profit,date FROM sales WHERE user_id=%s ORDER BY id DESC',
        (user_id,)
    )
    rows = cursor.fetchall()
    conn.close()
    return jsonify([{
        'id': r[0], 'user_id': r[1], 'product': r[2], 'qty_sold': r[3],
        'price_per_unit': float(r[4]), 'cost_per_unit': float(r[5]),
        'total_earned': float(r[6]), 'profit': float(r[7]), 'date': r[8]
    } for r in rows])


@app.route('/api/sales/<int:id>', methods=['DELETE'])
def delete_sale(id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT product,qty_sold,user_id FROM sales WHERE id=%s', (id,))
    sale = cursor.fetchone()
    if sale:
        cursor.execute(
            'UPDATE stock SET qty_remaining=qty_remaining+%s WHERE user_id=%s AND product=%s ORDER BY id DESC LIMIT 1',
            (sale[1], sale[2], sale[0])
        )
        cursor.execute('DELETE FROM sales WHERE id=%s', (id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Sale deleted and stock restored'})


# ── OPERATIONAL EXPENSES ──────────────────────────────────────────────────────

@app.route('/api/operational-expenses', methods=['POST'])
def add_operational_expense():
    data = request.get_json()
    amount = float(data.get('amount', 0))
    if amount <= 0:
        return jsonify({'error': 'Amount must be greater than zero'}), 400
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO operational_expenses (user_id,item,amount,frequency,is_fixed,date) VALUES (%s,%s,%s,%s,%s,%s)',
        (data['user_id'], data['item'], amount, data.get('frequency', 'monthly'), data.get('is_fixed', False), data['date'])
    )
    conn.commit()
    conn.close()
    return jsonify({'message': 'Expense recorded successfully'}), 201


@app.route('/api/operational-expenses', methods=['GET'])
def get_operational_expenses():
    user_id = request.args.get('user_id')
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        'SELECT id,user_id,item,amount,frequency,date,is_fixed FROM operational_expenses WHERE user_id=%s ORDER BY id DESC',
        (user_id,)
    )
    rows = cursor.fetchall()
    conn.close()
    return jsonify([{
        'id': r[0], 'user_id': r[1], 'item': r[2],
        'amount': float(r[3]), 'frequency': r[4], 'date': r[5], 'is_fixed': bool(r[6])
    } for r in rows])


@app.route('/api/operational-expenses/<int:id>', methods=['DELETE'])
def delete_operational_expense(id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM operational_expenses WHERE id=%s', (id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Expense deleted'})


@app.route('/api/reminders', methods=['GET'])
def get_reminders():
    user_id = request.args.get('user_id')
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        'SELECT item,amount,frequency FROM operational_expenses WHERE user_id=%s AND is_fixed=TRUE', (user_id,)
    )
    rows = cursor.fetchall()
    conn.close()
    return jsonify([{
        'item': r[0], 'amount': float(r[1]), 'frequency': r[2],
        'reminder': f"Don't forget to record your {r[2]} {r[0]} of KES {float(r[1]):,.0f}"
    } for r in rows])


# ── SUMMARY ───────────────────────────────────────────────────────────────────

@app.route('/api/summary', methods=['GET'])
def get_summary():
    user_id = request.args.get('user_id')
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute('SELECT SUM(total_earned), SUM(profit), COUNT(*) FROM sales WHERE user_id=%s', (user_id,))
    row = cursor.fetchone()
    total_income = float(row[0] or 0)
    total_profit = float(row[1] or 0)
    total_transactions = int(row[2] or 0)

    today = get_today()
    cursor.execute('SELECT SUM(total_earned), SUM(profit) FROM sales WHERE user_id=%s AND date=%s', (user_id, today))
    row = cursor.fetchone()
    today_income = float(row[0] or 0)
    today_profit = float(row[1] or 0)

    cursor.execute('SELECT amount,frequency FROM operational_expenses WHERE user_id=%s', (user_id,))
    ops = cursor.fetchall()
    total_operational = sum(float(r[0]) for r in ops)
    daily_operational = 0
    for r in ops:
        amt, freq = float(r[0]), r[1]
        if freq == 'daily': daily_operational += amt
        elif freq == 'weekly': daily_operational += amt / 7
        else: daily_operational += amt / 30

    conn.close()
    return jsonify({
        'total_income': round(total_income, 2),
        'total_profit': round(total_profit, 2),
        'total_operational': round(total_operational, 2),
        'today_income': round(today_income, 2),
        'today_profit': round(today_profit, 2),
        'daily_operational': round(daily_operational, 2),
        'total_transactions': total_transactions
    })


# ── WEEKLY REPORT ─────────────────────────────────────────────────────────────

@app.route('/api/weekly-report', methods=['GET'])
def weekly_report():
    user_id = request.args.get('user_id')
    conn = get_db()
    cursor = conn.cursor()

    days = []
    for i in range(6, -1, -1):
        d = datetime.now() - timedelta(days=i)
        days.append(f"{d.month}/{d.day}/{d.year}")

    daily = []
    for day in days:
        cursor.execute(
            'SELECT SUM(total_earned), SUM(profit), COUNT(*) FROM sales WHERE user_id=%s AND date=%s',
            (user_id, day)
        )
        r = cursor.fetchone()
        daily.append({'date': day, 'revenue': float(r[0] or 0), 'profit': float(r[1] or 0), 'transactions': int(r[2] or 0)})

    placeholders = ','.join(['%s'] * len(days))
    cursor.execute(
        f'SELECT product, SUM(total_earned), SUM(profit), SUM(qty_sold) FROM sales WHERE user_id=%s AND date IN ({placeholders}) GROUP BY product ORDER BY SUM(total_earned) DESC LIMIT 5',
        [user_id] + days
    )
    top_products = [{'product': r[0], 'revenue': float(r[1]), 'profit': float(r[2]), 'qty': int(r[3])} for r in cursor.fetchall()]

    cursor.execute(
        f'SELECT SUM(total_earned), SUM(profit), COUNT(*) FROM sales WHERE user_id=%s AND date IN ({placeholders})',
        [user_id] + days
    )
    t = cursor.fetchone()
    conn.close()
    return jsonify({
        'daily': daily,
        'top_products': top_products,
        'week_revenue': float(t[0] or 0),
        'week_profit': float(t[1] or 0),
        'week_transactions': int(t[2] or 0)
    })


# ── ALERTS ────────────────────────────────────────────────────────────────────

@app.route('/api/alerts', methods=['GET'])
def get_alerts():
    user_id = request.args.get('user_id')
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT product,qty_bought,qty_remaining,duration_days FROM stock WHERE user_id=%s', (user_id,))
    stock_rows = cursor.fetchall()
    alerts = []
    for row in stock_rows:
        product, qty_bought, qty_remaining, duration_days = row[0], int(row[1]), int(row[2]), int(row[3])
        cursor.execute('SELECT SUM(qty_sold) FROM sales WHERE user_id=%s AND product=%s', (user_id, product))
        total_sold = int((cursor.fetchone()[0]) or 0)
        percent_remaining = (qty_remaining / qty_bought * 100) if qty_bought > 0 else 0
        avg_daily = total_sold / duration_days if total_sold > 0 else 0
        days_remaining = round(qty_remaining / avg_daily) if avg_daily > 0 else duration_days
        if percent_remaining <= 10:
            level, message = 'red', f'Only {qty_remaining} units left ({percent_remaining:.0f}%) — restock urgently!'
        elif percent_remaining <= 30:
            level, message = 'orange', f'{qty_remaining} units left — consider restocking (~{days_remaining} days left)'
        else:
            level, message = 'green', f'{qty_remaining} units left — stock is healthy (~{days_remaining} days left)'
        alerts.append({
            'product': product, 'qty_bought': qty_bought, 'qty_remaining': qty_remaining,
            'percent_remaining': round(percent_remaining, 1), 'days_remaining': days_remaining,
            'level': level, 'alert': message
        })
    conn.close()
    return jsonify(alerts)


# ── PREDICTIONS ───────────────────────────────────────────────────────────────

@app.route('/api/predictions', methods=['GET'])
def get_predictions_route():
    user_id = request.args.get('user_id')
    try:
        import sys
        sys.path.append(os.path.dirname(os.path.abspath(__file__)))
        from ml.predict import get_predictions
        predictions = get_predictions(user_id)
    except Exception:
        predictions = None
    if not predictions:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            'SELECT product, SUM(total_earned) as revenue FROM sales WHERE user_id=%s GROUP BY product ORDER BY revenue DESC LIMIT 3',
            (user_id,)
        )
        rows = cursor.fetchall()
        conn.close()
        predictions = [{'product': r[0], 'revenue': float(r[1]), 'total_qty': 0,
                        'prediction': 'High demand expected next month', 'confidence': 'N/A'} for r in rows]
    return jsonify(predictions)


# ── SIMULATION ────────────────────────────────────────────────────────────────

@app.route('/api/simulate', methods=['POST'])
def simulate():
    data = request.get_json()
    product = data['product']
    new_price = float(data['new_price'])
    new_qty = float(data['new_qty'])
    user_id = data.get('user_id')
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT qty_sold,price_per_unit FROM sales WHERE product=%s AND user_id=%s', (product, user_id))
    rows = cursor.fetchall()
    cursor.execute('SELECT cost_per_unit FROM stock WHERE product=%s AND user_id=%s ORDER BY id DESC LIMIT 1', (product, user_id))
    stock_row = cursor.fetchone()
    conn.close()
    cost_per_unit = float(stock_row[0]) if stock_row else 0
    original_revenue = sum(float(r[0]) * float(r[1]) for r in rows)
    original_profit = original_revenue - (cost_per_unit * sum(r[0] for r in rows))
    projected_revenue = new_price * new_qty
    projected_profit = projected_revenue - (cost_per_unit * new_qty)
    difference = projected_profit - original_profit
    percent = ((difference / abs(original_profit)) * 100) if original_profit != 0 else 0
    if difference > 0:
        verdict = f"Good move! Selling {int(new_qty)} units at KES {new_price:,.0f} gives revenue of KES {projected_revenue:,.0f} and profit of KES {projected_profit:,.0f} — KES {difference:,.0f} more ({percent:.1f}% increase)."
    elif difference < 0:
        verdict = f"Careful! Revenue of KES {projected_revenue:,.0f} but profit only KES {projected_profit:,.0f} — KES {abs(difference):,.0f} less ({abs(percent):.1f}% decrease)."
    else:
        verdict = f"No change. Projected profit is KES {projected_profit:,.0f}."
    return jsonify({
        'original_revenue': round(original_revenue, 2), 'projected_revenue': round(projected_revenue, 2),
        'projected_profit': round(projected_profit, 2), 'difference': round(difference, 2),
        'percent': round(percent, 1), 'verdict': verdict
    })


@app.route('/api/test', methods=['GET'])
def test():
    return jsonify({'message': 'BizAI backend is running!'})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)