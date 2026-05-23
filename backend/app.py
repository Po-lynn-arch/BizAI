from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from werkzeug.security import generate_password_hash, check_password_hash
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import random
import string
import os

app = Flask(__name__)
CORS(app, origins="*", allow_headers=["Content-Type"], methods=["GET", "POST", "DELETE", "OPTIONS"])
limiter = Limiter(get_remote_address, app=app, default_limits=["200 per day", "50 per hour"])

def generate_code():
    return 'BIZAI-' + ''.join(random.choices(string.digits, k=4))


def get_db():
    return mysql.connector.connect(host='localhost', user='root', password='', database='bizai')


def init_db():
    conn = mysql.connector.connect(host='localhost', user='root', password='')
    cursor = conn.cursor()
    cursor.execute('CREATE DATABASE IF NOT EXISTS bizai')
    cursor.execute('USE bizai')
    cursor.execute('''CREATE TABLE IF NOT EXISTS businesses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(20) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
    cursor.execute('''CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        business_id INT DEFAULT NULL,
        FOREIGN KEY (business_id) REFERENCES businesses(id))''')
    cursor.execute('''CREATE TABLE IF NOT EXISTS stock (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        product VARCHAR(100) NOT NULL,
        qty_bought INT NOT NULL,
        cost_per_unit DECIMAL(10,2) NOT NULL,
        total_cost DECIMAL(10,2) NOT NULL,
        duration_days INT NOT NULL DEFAULT 30,
        qty_remaining INT NOT NULL,
        suggested_price DECIMAL(10,2) DEFAULT 0,
        date_added VARCHAR(50) NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id))''')
    cursor.execute('''CREATE TABLE IF NOT EXISTS sales (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        product VARCHAR(100) NOT NULL,
        qty_sold INT NOT NULL,
        price_per_unit DECIMAL(10,2) NOT NULL,
        total_earned DECIMAL(10,2) NOT NULL,
        date VARCHAR(50) NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id))''')
    cursor.execute('''CREATE TABLE IF NOT EXISTS operational_expenses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        item VARCHAR(100) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        frequency VARCHAR(20) DEFAULT 'monthly',
        is_fixed BOOLEAN DEFAULT FALSE,
        date VARCHAR(50) NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id))''')
    
    conn.commit()
    conn.close()


init_db()


# ========================
# AUTH
# ========================

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    name = data.get('name', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')
    business_name = data.get('business_name', '').strip()

    if not name or not email or not password:
        return jsonify({'error': 'All fields are required'}), 400
    if not business_name:
        return jsonify({'error': 'Business name is required'}), 400
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    hashed = generate_password_hash(password)

    # generate unique business code
    import random
    code = generate_code()

    conn = get_db()
    cursor = conn.cursor()

    try:
        cursor.execute(
            'INSERT INTO businesses (name, code) VALUES (%s, %s)',
            (business_name, code)
        )
        business_id = cursor.lastrowid
        cursor.execute(
            'INSERT INTO users (name, email, password, role, business_id) VALUES (%s, %s, %s, %s, %s)',
            (name, email, hashed, 'admin', business_id)
        )
        conn.commit()
        conn.close()
        return jsonify({
            'message': 'Account created successfully',
            'business_code': code
        }), 201

    except mysql.connector.IntegrityError:
        conn.close()
        return jsonify({'error': 'Email already exists'}), 400

@app.route('/api/login', methods=['POST'])
@limiter.limit("5 per minute")
def login():
    data = request.get_json()
    email = data.get('email', '').strip()
    password = data.get('password', '')
    if not email or not password:
        return jsonify({'error': 'All fields are required'}), 400
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT id, name, email, password, role, business_id FROM users WHERE email = %s', (email,))
    user = cursor.fetchone()
    conn.close()
    if user and check_password_hash(user[3], password):
        return jsonify({'message': 'Login successful', 'user': {
            'id': user[0], 'name': user[1], 'email': user[2], 'role': user[4], 'business_id': user[5]}}), 200
    return jsonify({'error': 'Invalid email or password'}), 401


@app.route('/api/join-business', methods=['POST'])
def join_business():
    data = request.get_json()
    name = data.get('name', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')
    code = data.get('code', '').strip().upper()

    if not name or not email or not password or not code:
        return jsonify({'error': 'All fields are required'}), 400
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    conn = get_db()
    cursor = conn.cursor()

    # find business by code
    cursor.execute('SELECT id FROM businesses WHERE code = %s', (code,))
    business = cursor.fetchone()

    if not business:
        conn.close()
        return jsonify({'error': 'Invalid business code. Check with your business owner.'}), 404

    business_id = business[0]

    # enforce 2 user limit
    cursor.execute('SELECT COUNT(*) FROM users WHERE business_id = %s', (business_id,))
    count = cursor.fetchone()[0]

    if count >= 2:
        conn.close()
        return jsonify({'error': 'This business already has the maximum of 2 users.'}), 400

    try:
        hashed = generate_password_hash(password)
        cursor.execute(
            'INSERT INTO users (name, email, password, role, business_id) VALUES (%s, %s, %s, %s, %s)',
            (name, email, hashed, 'user', business_id)
        )
        conn.commit()
        conn.close()
        return jsonify({'message': 'Successfully joined the business!'}), 201

    except mysql.connector.IntegrityError:
        conn.close()
        return jsonify({'error': 'Email already exists'}), 400

# ========================
# ADMIN
# ========================

@app.route('/api/admin/add-user', methods=['POST'])
def add_user():
    data = request.get_json()
    admin_id = data.get('admin_id')
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT role, business_id FROM users WHERE id = %s', (admin_id,))
    admin = cursor.fetchone()
    if not admin or admin[0] != 'admin':
        conn.close()
        return jsonify({'error': 'Only admins can add users'}), 403
    business_id = admin[1]
    cursor.execute('SELECT COUNT(*) FROM users WHERE business_id = %s', (business_id,))
    if cursor.fetchone()[0] >= 2:
        conn.close()
        return jsonify({'error': 'Maximum 2 users allowed per business'}), 400
    try:
        cursor.execute(
            'INSERT INTO users (name, email, password, role, business_id) VALUES (%s, %s, %s, %s, %s)',
            (data['name'], data['email'], generate_password_hash(data['password']), 'user', business_id))
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
    cursor.execute('SELECT role, business_id FROM users WHERE id = %s', (admin_id,))
    admin = cursor.fetchone()
    if not admin or admin[0] != 'admin':
        conn.close()
        return jsonify({'error': 'Unauthorized'}), 403
    cursor.execute('SELECT id, name, email, role FROM users WHERE business_id = %s', (admin[1],))
    users = cursor.fetchall()
    conn.close()
    return jsonify([{'id': u[0], 'name': u[1], 'email': u[2], 'role': u[3]} for u in users])


@app.route('/api/admin/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    data = request.get_json()
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT role FROM users WHERE id = %s', (data.get('admin_id'),))
    admin = cursor.fetchone()
    if not admin or admin[0] != 'admin':
        conn.close()
        return jsonify({'error': 'Unauthorized'}), 403
    cursor.execute('DELETE FROM users WHERE id = %s', (user_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'User deleted successfully'})


# ========================
# STOCK
# ========================

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
        'SELECT id, qty_remaining FROM stock WHERE user_id = %s AND product = %s ORDER BY id DESC LIMIT 1',
        (data['user_id'], data['product']))
    existing = cursor.fetchone()

    if existing:
        cursor.execute(
            'UPDATE stock SET qty_remaining = %s, qty_bought = qty_bought + %s, total_cost = total_cost + %s WHERE id = %s',
            (existing[1] + qty, qty, qty * cost if stock_type == 'new' else 0, existing[0]))
    else:
        cursor.execute(
            'INSERT INTO stock (user_id, product, qty_bought, cost_per_unit, total_cost, duration_days, qty_remaining, suggested_price, date_added, stock_type) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)',
            (data['user_id'], data['product'], qty, cost if stock_type == 'new' else 0,
             qty * cost if stock_type == 'new' else 0,
             duration, qty, suggested_price, data['date'], stock_type))

    conn.commit()
    conn.close()
    return jsonify({'message': 'Stock added successfully'}), 201

@app.route('/api/stock', methods=['GET'])
def get_stock():
    user_id = request.args.get('user_id')
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        'SELECT id, user_id, product, qty_bought, cost_per_unit, total_cost, duration_days, qty_remaining, suggested_price, date_added, stock_type FROM stock WHERE user_id = %s ORDER BY id DESC',
        (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return jsonify([{
        'id': r[0], 'user_id': r[1], 'product': r[2], 'qty_bought': r[3],
        'cost_per_unit': float(r[4]), 'total_cost': float(r[5]), 'duration_days': r[6],
        'qty_remaining': r[7], 'suggested_price': float(r[8] or 0),
        'date_added': r[9], 'stock_type': r[10]
    } for r in rows])

# ========================
# SALES
# ========================

@app.route('/api/sales', methods=['POST'])
def add_sale():
    data = request.get_json()
    qty_sold = int(data.get('qty_sold', 0))
    price = float(data.get('price_per_unit', 0))
    if qty_sold <= 0 or price <= 0:
        return jsonify({'error': 'Quantity and price must be greater than zero'}), 400
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        'SELECT id, qty_remaining FROM stock WHERE user_id = %s AND product = %s ORDER BY id DESC LIMIT 1',
        (data['user_id'], data['product']))
    stock = cursor.fetchone()
    if not stock:
        conn.close()
        return jsonify({'error': f"No stock found for {data['product']}. Please add stock first."}), 400
    if stock[1] < qty_sold:
        conn.close()
        return jsonify({'error': f"Not enough stock. Only {stock[1]} units available."}), 400
    cursor.execute('UPDATE stock SET qty_remaining = qty_remaining - %s WHERE id = %s', (qty_sold, stock[0]))
    cursor.execute(
        'INSERT INTO sales (user_id, product, qty_sold, price_per_unit, total_earned, date) VALUES (%s,%s,%s,%s,%s,%s)',
        (data['user_id'], data['product'], qty_sold, price, qty_sold * price, data['date']))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Sale recorded successfully'}), 201


@app.route('/api/sales', methods=['GET'])
def get_sales():
    user_id = request.args.get('user_id')
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM sales WHERE user_id = %s ORDER BY id DESC', (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return jsonify([{
        'id': r[0], 'user_id': r[1], 'product': r[2], 'qty_sold': r[3],
        'price_per_unit': float(r[4]), 'total_earned': float(r[5]), 'date': r[6]
    } for r in rows])


@app.route('/api/sales/<int:id>', methods=['DELETE'])
def delete_sale(id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT product, qty_sold, user_id FROM sales WHERE id = %s', (id,))
    sale = cursor.fetchone()
    if sale:
        cursor.execute(
            'UPDATE stock SET qty_remaining = qty_remaining + %s WHERE user_id = %s AND product = %s ORDER BY id DESC LIMIT 1',
            (sale[1], sale[2], sale[0]))
        cursor.execute('DELETE FROM sales WHERE id = %s', (id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Sale deleted and stock restored'})


# ========================
# OPERATIONAL EXPENSES
# ========================

@app.route('/api/operational-expenses', methods=['POST'])
def add_operational_expense():
    data = request.get_json()
    amount = float(data.get('amount', 0))
    if amount <= 0:
        return jsonify({'error': 'Amount must be greater than zero'}), 400
    conn = get_db()
    cursor = conn.cursor()
    is_fixed = data.get('is_fixed', False)
    frequency = data.get('frequency', 'monthly')
    cursor.execute(
    'INSERT INTO operational_expenses (user_id, item, amount, frequency, is_fixed, date) VALUES (%s,%s,%s,%s,%s,%s)',
    (data['user_id'], data['item'], amount, frequency, is_fixed, data['date'])
    )
    conn.commit()
    conn.close()
    return jsonify({'message': 'Expense recorded successfully'}), 201


@app.route('/api/operational-expenses', methods=['GET'])
def get_operational_expenses():
    user_id = request.args.get('user_id')
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM operational_expenses WHERE user_id = %s ORDER BY id DESC', (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return jsonify([{
        'id': r[0], 'user_id': r[1], 'item': r[2],
        'amount': float(r[3]), 'frequency': r[4], 'date': r[5]
    } for r in rows])


@app.route('/api/operational-expenses/<int:id>', methods=['DELETE'])
def delete_operational_expense(id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM operational_expenses WHERE id = %s', (id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Expense deleted'})

@app.route('/api/reminders', methods=['GET'])
def get_reminders():
    user_id = request.args.get('user_id')
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        'SELECT item, amount, frequency FROM operational_expenses WHERE user_id = %s AND is_fixed = TRUE',
        (user_id,)
    )
    rows = cursor.fetchall()
    conn.close()
    return jsonify([{
        'item': r[0],
        'amount': float(r[1]),
        'frequency': r[2],
        'reminder': f"Don't forget to record your {r[2]} {r[0]} of KES {float(r[1]):,.0f}"
    } for r in rows])


# ========================
# SUMMARY
# ========================

@app.route('/api/summary', methods=['GET'])
def get_summary():
    user_id = request.args.get('user_id')
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute('SELECT SUM(total_earned), COUNT(*) FROM sales WHERE user_id = %s', (user_id,))
    sales_row = cursor.fetchone()
    total_income = float(sales_row[0] or 0)
    total_sales_count = int(sales_row[1] or 0)

    from datetime import datetime
    now = datetime.now()
    today = f"{now.month}/{now.day}/{now.year}"

    cursor.execute('SELECT SUM(total_earned) FROM sales WHERE user_id = %s AND date = %s', (user_id, today))
    today_income = float((cursor.fetchone()[0]) or 0)

    cursor.execute('SELECT total_cost, duration_days FROM stock WHERE user_id = %s', (user_id,))
    stock_rows = cursor.fetchall()
    total_stock_cost = sum(float(r[0]) for r in stock_rows)
    daily_stock_cost = sum(float(r[0]) / int(r[1]) for r in stock_rows) if stock_rows else 0

    cursor.execute('SELECT amount, frequency FROM operational_expenses WHERE user_id = %s', (user_id,))
    ops_rows = cursor.fetchall()
    total_operational = 0
    daily_operational = 0
    for row in ops_rows:
        amount = float(row[0])
        frequency = row[1]
        total_operational += amount
        if frequency == 'daily':
            daily_operational += amount
        elif frequency == 'weekly':
            daily_operational += amount / 7
        else:
            daily_operational += amount / 30

    conn.close()
    return jsonify({
        'total_income': round(total_income, 2),
        'total_stock_cost': round(total_stock_cost, 2),
        'total_operational': round(total_operational, 2),
        'total_expenses': round(total_stock_cost + total_operational, 2),
        'net_profit': round(total_income - total_stock_cost - total_operational, 2),
        'today_income': round(today_income, 2),
        'today_profit': round(today_income - daily_stock_cost - daily_operational, 2),
        'daily_stock_cost': round(daily_stock_cost, 2),
        'daily_operational': round(daily_operational, 2),
        'total_transactions': total_sales_count
    })


# ========================
# ALERTS
# ========================

@app.route('/api/alerts', methods=['GET'])
def get_alerts():
    user_id = request.args.get('user_id')
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        'SELECT product, qty_bought, qty_remaining, duration_days FROM stock WHERE user_id = %s', (user_id,))
    stock_rows = cursor.fetchall()
    alerts = []
    for row in stock_rows:
        product, qty_bought, qty_remaining, duration_days = row[0], int(row[1]), int(row[2]), int(row[3])
        cursor.execute('SELECT SUM(qty_sold) FROM sales WHERE user_id = %s AND product = %s', (user_id, product))
        total_sold = int((cursor.fetchone()[0]) or 0)
        percent_remaining = (qty_remaining / qty_bought * 100) if qty_bought > 0 else 0
        avg_daily = total_sold / duration_days if total_sold > 0 else 0
        days_remaining = round(qty_remaining / avg_daily) if avg_daily > 0 else duration_days
        if percent_remaining <= 10:
            level, message = 'red', f'Only {qty_remaining} units left ({percent_remaining:.0f}%) — restock urgently!'
        elif percent_remaining <= 30:
            level, message = 'orange', f'{qty_remaining} units left — consider restocking (~{days_remaining} days remaining)'
        else:
            level, message = 'green', f'{qty_remaining} units left — stock is healthy (~{days_remaining} days remaining)'
        alerts.append({
            'product': product, 'qty_bought': qty_bought, 'qty_remaining': qty_remaining,
            'percent_remaining': round(percent_remaining, 1), 'days_remaining': days_remaining,
            'level': level, 'alert': message
        })
    conn.close()
    return jsonify(alerts)


# ========================
# PREDICTIONS
# ========================

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
            'SELECT product, SUM(total_earned) as revenue FROM sales WHERE user_id = %s GROUP BY product ORDER BY revenue DESC LIMIT 3',
            (user_id,))
        rows = cursor.fetchall()
        conn.close()
        predictions = [{'product': r[0], 'revenue': float(r[1]), 'total_qty': 0,
                        'prediction': 'High demand expected next month',
                        'confidence': 'N/A — add more data and run train.py'} for r in rows]
    return jsonify(predictions)


# ========================
# SIMULATION
# ========================

@app.route('/api/simulate', methods=['POST'])
def simulate():
    data = request.get_json()
    product = data['product']
    new_price = float(data['new_price'])
    new_qty = float(data['new_qty'])
    user_id = data.get('user_id')
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT qty_sold, price_per_unit FROM sales WHERE product = %s AND user_id = %s', (product, user_id))
    rows = cursor.fetchall()
    cursor.execute('SELECT cost_per_unit FROM stock WHERE product = %s AND user_id = %s ORDER BY id DESC LIMIT 1', (product, user_id))
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
        verdict = f"Good move! Selling {int(new_qty)} units of {product} at KES {new_price} would earn KES {projected_revenue:,.0f} with a profit of KES {projected_profit:,.0f} — that's KES {difference:,.0f} more profit ({percent:.1f}% increase)."
    elif difference < 0:
        verdict = f"Careful! This would give KES {projected_revenue:,.0f} revenue but only KES {projected_profit:,.0f} profit — KES {abs(difference):,.0f} less than before ({abs(percent):.1f}% decrease). Consider adjusting your price."
    else:
        verdict = f"No significant change. Projected profit is KES {projected_profit:,.0f}."

    return jsonify({
        'original_revenue': round(original_revenue, 2), 'projected_revenue': round(projected_revenue, 2),
        'projected_profit': round(projected_profit, 2), 'difference': round(difference, 2),
        'percent': round(percent, 1), 'verdict': verdict
    })


@app.route('/api/test', methods=['GET'])
def test():
    return jsonify({'message': 'BizAI backend is running!'})


if __name__ == '__main__':
    app.run(debug=True)