import pandas as pd
import numpy as np

def analyze_financials(transactions: list):
    if not transactions:
        return empty_metrics()

    df = pd.DataFrame(transactions)
    
    # Ensure standard columns
    if 'date' not in df.columns or 'amount' not in df.columns:
        return empty_metrics()

    # Convert types
    df['date'] = pd.to_datetime(df['date'])
    df['amount'] = pd.to_numeric(df['amount'])
    
    # Sort by date
    df = df.sort_values('date')
    
    # --- 1. CORE METRICS ---
    total_revenue = df[df['amount'] > 0]['amount'].sum()
    total_expenses = df[df['amount'] < 0]['amount'].sum()
    net_income = total_revenue + total_expenses # Expenses are negative
    
    # --- 2. MONTHLY AGGREGATION ---
    df['month_year'] = df['date'].dt.to_period('M')
    monthly_data = df.groupby('month_year')['amount'].sum()
    
    # Number of months in the dataset (avoid division by zero)
    num_months = max(1, len(monthly_data))

    # --- 3. BURN RATE (GROSS BURN) ---
    # We calculate how much you SPEND on average per month (regardless of income)
    # This gives a more realistic "Survival Time" if revenue stops.
    avg_monthly_expenses = abs(total_expenses) / num_months
    burn_rate = round(avg_monthly_expenses, 2)

    # --- 4. RUNWAY ---
    # Current Cash / Avg Monthly Expenses
    # We assume 'Net Income' is the 'Current Cash' for this context if no balance provided
    current_cash = net_income 
    
    if burn_rate > 0:
        runway_months = round(current_cash / burn_rate, 1)
    else:
        runway_months = 999 # No expenses? Infinite runway.

    # --- 5. MARGINS ---
    net_margin_percent = 0
    if total_revenue > 0:
        net_margin_percent = round((net_income / total_revenue) * 100, 1)

    # --- 6. TRENDS ---
    monthly_trend = {str(k): round(v, 2) for k, v in monthly_data.items()}

    return {
        "total_revenue": round(total_revenue, 2),
        "total_expenses": round(total_expenses, 2),
        "net_income": round(net_income, 2),
        "burn_rate": burn_rate,
        "runway_months": runway_months,
        "net_margin_percent": net_margin_percent,
        "monthly_trend": monthly_trend
    }

def calculate_health_score(metrics, industry):
    score = 70 # Baseline

    # 1. Profitability (+20)
    if metrics['net_margin_percent'] > 20: score += 20
    elif metrics['net_margin_percent'] > 0: score += 10
    else: score -= 10

    # 2. Runway (+20)
    # If using Gross Burn, having > 6 months is good
    if metrics['runway_months'] > 12: score += 20
    elif metrics['runway_months'] > 6: score += 10
    elif metrics['runway_months'] < 3: score -= 20

    return min(100, max(0, score))

def check_tax_compliance(transactions, industry):
    alerts = []
    # Simple logic: Check if we have transactions in typical tax months
    dates = [pd.to_datetime(t['date']) for t in transactions]
    if not dates: return []

    latest_date = max(dates)
    
    # Example Alert
    if latest_date.month in [3, 6, 9, 12]:
        alerts.append("Quarterly Tax Filing due soon.")

    return alerts

def empty_metrics():
    return {
        "total_revenue": 0, "total_expenses": 0, "net_income": 0,
        "burn_rate": 0, "runway_months": 0, "net_margin_percent": 0,
        "monthly_trend": {}
    }