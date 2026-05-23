import pandas as pd
import pickle
import mysql.connector

def get_predictions(user_id=None):
    conn = mysql.connector.connect(
        host='localhost',
        user='root',
        password='',
        database='bizai'
    )
    cursor = conn.cursor()

    if user_id:
        cursor.execute(
            'SELECT product, qty_sold, price_per_unit, total_earned FROM sales WHERE user_id = %s',
            (user_id,)
        )
    else:
        cursor.execute('SELECT product, qty_sold, price_per_unit, total_earned FROM sales')

    rows = cursor.fetchall()
    conn.close()

    if len(rows) < 5:
        return None

    try:
        with open('ml/model.pkl', 'rb') as f:
            model = pickle.load(f)
        with open('ml/encoder.pkl', 'rb') as f:
            le = pickle.load(f)
        with open('ml/metrics.pkl', 'rb') as f:
            metrics = pickle.load(f)
    except FileNotFoundError:
        return None

    df = pd.DataFrame(rows, columns=['product', 'qty_sold', 'price_per_unit', 'total_earned'])
    product_revenue = df.groupby('product')['total_earned'].sum().reset_index()
    product_revenue.columns = ['product', 'revenue']

    product_qty = df.groupby('product')['qty_sold'].sum().reset_index()
    product_qty.columns = ['product', 'total_qty']

    product_stats = product_revenue.merge(product_qty, on='product')

    known_items = list(le.classes_)
    product_stats = product_stats[product_stats['product'].isin(known_items)]

    if product_stats.empty:
        return None

    product_stats['product_encoded'] = le.transform(product_stats['product'])
    X = product_stats[['product_encoded', 'revenue', 'total_qty']]
    product_stats['demand'] = model.predict(X)

    high_demand = product_stats[product_stats['demand'] == 'High']
    top3 = high_demand.sort_values('revenue', ascending=False).head(3)

    predictions = []
    for _, row in top3.iterrows():
        predictions.append({
            'product': row['product'],
            'revenue': float(row['revenue']),
            'total_qty': int(row['total_qty']),
            'prediction': 'High demand expected next month',
            'confidence': f"F1: {metrics['f1_score']} | Accuracy: {metrics['accuracy']}"
        })

    return predictions