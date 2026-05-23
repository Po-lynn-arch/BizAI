import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import precision_score, recall_score, f1_score, accuracy_score
import pickle, mysql.connector, os


def get_sales_data():
    conn = mysql.connector.connect(host='localhost', user='root', password='', database='bizai')
    cursor = conn.cursor()
    cursor.execute('SELECT product, qty_sold, price_per_unit, total_earned FROM sales')
    rows = cursor.fetchall()
    conn.close()
    return pd.DataFrame(rows, columns=['product', 'qty_sold', 'price_per_unit', 'total_earned'])


def train_model():
    df = get_sales_data()
    if len(df) < 5:
        print('Not enough data — add at least 5 sales entries first')
        return

    product_revenue = df.groupby('product')['total_earned'].sum().reset_index()
    product_revenue.columns = ['product', 'revenue']
    product_qty = df.groupby('product')['qty_sold'].sum().reset_index()
    product_qty.columns = ['product', 'total_qty']
    product_stats = product_revenue.merge(product_qty, on='product')

    median_revenue = product_stats['revenue'].median()
    product_stats['demand'] = product_stats['revenue'].apply(lambda x: 'High' if x >= median_revenue else 'Low')

    le = LabelEncoder()
    product_stats['product_encoded'] = le.fit_transform(product_stats['product'])
    X = product_stats[['product_encoded', 'revenue', 'total_qty']]
    y = product_stats['demand']

    if len(X) >= 4:
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    else:
        X_train, X_test, y_train, y_test = X, X, y, y

    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)

    metrics = {
        'accuracy': round(accuracy_score(y_test, y_pred), 2),
        'precision': round(precision_score(y_test, y_pred, pos_label='High', zero_division=0), 2),
        'recall': round(recall_score(y_test, y_pred, pos_label='High', zero_division=0), 2),
        'f1_score': round(f1_score(y_test, y_pred, pos_label='High', zero_division=0), 2)
    }

    print('--- Model Performance ---')
    for k, v in metrics.items():
        print(f"{k}: {v}")

    os.makedirs('ml', exist_ok=True)
    with open('ml/model.pkl', 'wb') as f: pickle.dump(model, f)
    with open('ml/encoder.pkl', 'wb') as f: pickle.dump(le, f)
    with open('ml/metrics.pkl', 'wb') as f: pickle.dump(metrics, f)
    print('Model trained and saved successfully!')


if __name__ == '__main__':
    train_model()