# 1. LOAD SETTINGS FIRST
from dotenv import load_dotenv
load_dotenv()

import os
import json
import io
import re
import pandas as pd
from fastapi import FastAPI, HTTPException, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from openai import AsyncOpenAI
from pypdf import PdfReader
from docx import Document
from pydantic import BaseModel

from app.database import engine, get_db
from app import models
from app.services.financial_engine import analyze_financials, calculate_health_score, check_tax_compliance
# IMPORT MUST MATCH FUNCTION NAMES IN AGENT FILE
from app.services.categorization_agent import categorize_batch, parse_document_text, parse_receipt_image

# Create DB Tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="FinPulse API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def clean_currency(x):
    if pd.isna(x) or x == '': return 0.0
    s = str(x)
    s_clean = re.sub(r'[^\d.-]', '', s)
    try: return float(s_clean)
    except: return 0.0

class TransactionUpdate(BaseModel):
    category: str
    description: str

@app.get("/")
def health_check():
    return {"status": "FinPulse API is running"}

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return JSONResponse(content={}, status_code=200)

def get_or_create_demo_company(db: Session):
    company = db.query(models.Company).filter(models.Company.name == "Demo Corp").first()
    if not company:
        company = models.Company(id="demo-corp-id", name="Demo Corp", industry="Retail", tax_id_encrypted="Encrypted")
        db.add(company)
        db.commit()
    return company

async def map_columns_with_ai(columns: list, sample_row: dict):
    if not os.getenv("OPENAI_API_KEY"): return {}
    system_prompt = """
    Map columns to standard keys: "date", "description", "amount", "credit", "debit".
    Return JSON: { "date": "col_name", "description": "col_name", "amount": "col_name", "credit": "col_name", "debit": "col_name" }
    """
    try:
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "system", "content": system_prompt}, {"role": "user", "content": f"Cols: {columns}\nData: {sample_row}"}],
            response_format={"type": "json_object"}, temperature=0
        )
        return json.loads(response.choices[0].message.content)
    except: return {}

@app.post("/api/v1/upload-file")
async def upload_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    filename = file.filename.lower()
    content = await file.read()
    transactions_data = []

    try:
        if filename.endswith(('.csv', '.xlsx')):
            if filename.endswith('.csv'):
                try: df = pd.read_csv(io.StringIO(content.decode('utf-8')))
                except: df = pd.read_csv(io.StringIO(content.decode('latin1')))
            else:
                df = pd.read_excel(io.BytesIO(content))
            
            df.columns = [str(c).strip().lower() for c in df.columns]
            
            if 'date' not in df.columns:
                for col in df.columns:
                    if any(x in col for x in ['date', 'time']): df.rename(columns={col: 'date'}, inplace=True); break
            
            if 'description' not in df.columns:
                 for col in df.columns:
                    if any(x in col for x in ['details', 'desc', 'memo']): df.rename(columns={col: 'description'}, inplace=True); break

            if 'amount' not in df.columns:
                credit = next((c for c in df.columns if any(x in c for x in ['deposit', 'credit', 'cr'])), None)
                debit = next((c for c in df.columns if any(x in c for x in ['withdrawal', 'debit', 'dr'])), None)
                if credit and debit:
                    df[credit] = df[credit].apply(clean_currency)
                    df[debit] = df[debit].apply(clean_currency)
                    df['amount'] = df[credit] - df[debit]
                else:
                    amt = next((c for c in df.columns if 'amt' in c or 'amount' in c), None)
                    if amt: df['amount'] = df[amt].apply(clean_currency)

            if 'date' not in df.columns or 'amount' not in df.columns:
                print("Using AI mapping...")
                mapping = await map_columns_with_ai(list(df.columns), df.iloc[0].to_dict() if not df.empty else {})
                if mapping.get('amount'): df['amount'] = df[mapping['amount'].lower()].apply(clean_currency)
                elif mapping.get('credit') and mapping.get('debit'):
                    df['amount'] = df[mapping['credit'].lower()].apply(clean_currency) - df[mapping['debit'].lower()].apply(clean_currency)
                if mapping.get('date'): df.rename(columns={mapping['date'].lower(): 'date'}, inplace=True)
                if mapping.get('description'): df.rename(columns={mapping['description'].lower(): 'description'}, inplace=True)

            if 'date' not in df.columns or 'amount' not in df.columns:
                 raise HTTPException(status_code=400, detail="Could not map Date/Amount columns.")

            if 'description' not in df.columns: df['description'] = 'Unknown'
            if 'category' not in df.columns:
                descriptions = df['description'].astype(str).tolist()
                mappings = await categorize_batch(descriptions)
                cat_map = {item['description']: item['category'] for item in mappings}
                df['category'] = df['description'].map(cat_map).fillna('Uncategorized')

            for _, row in df.iterrows():
                if row['amount'] == 0: continue
                transactions_data.append({
                    "date": str(row.get('date')),
                    "description": str(row.get('description', 'Unknown')),
                    "amount": float(row['amount']),
                    "category": str(row.get('category', 'Uncategorized'))
                })

        elif filename.endswith('.pdf'):
            pdf = PdfReader(io.BytesIO(content))
            raw_text = "".join([p.extract_text() for p in pdf.pages])
            transactions_data = await parse_document_text(raw_text)
        elif filename.endswith('.docx'):
            doc = Document(io.BytesIO(content))
            raw_text = "\n".join([p.text for p in doc.paragraphs])
            transactions_data = await parse_document_text(raw_text)
        elif filename.endswith(('.jpg', '.jpeg', '.png', '.webp')):
            transactions_data = await parse_receipt_image(content)
        else:
             raise HTTPException(status_code=400, detail="Unsupported format.")

        company = get_or_create_demo_company(db)
        db.query(models.Transaction).filter(models.Transaction.company_id == company.id).delete()
        for i, txn in enumerate(transactions_data):
            try: txn_date = pd.to_datetime(txn['date']).date()
            except: continue
            db.add(models.Transaction(
                id=f"{company.id}-{i}", company_id=company.id,
                txn_date=txn_date, amount=txn['amount'],
                description=txn['description'], category=txn['category']
            ))
        db.commit()
        return {"transactions": transactions_data, "message": "Saved"}

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/api/v1/transactions/{txn_id}")
async def update_transaction(txn_id: str, update_data: TransactionUpdate, db: Session = Depends(get_db)):
    txn = db.query(models.Transaction).filter(models.Transaction.id == txn_id).first()
    if not txn: raise HTTPException(status_code=404, detail="Not found")
    txn.category = update_data.category
    txn.description = update_data.description
    db.commit()
    return {"message": "Updated"}

@app.post("/api/v1/generate-report", response_model=models.HealthReportResponse)
async def generate_report(request: models.FinancialReportRequest):
    raw_txns = [t.model_dump() for t in request.transactions]
    try:
        metrics = analyze_financials(raw_txns)
        score = calculate_health_score(metrics, request.industry)
        metrics['compliance_alerts'] = check_tax_compliance(raw_txns, request.industry)
    except Exception as e: raise HTTPException(status_code=400, detail=str(e))

    trend_summary = json.dumps(metrics.get('monthly_trend', {}))
    prompt = f"""
    Role: Senior CFO ({request.industry}). Data: Revenue ${metrics['total_revenue']}, Runway {metrics['runway_months']}mo. Trend: {trend_summary}.
    Task: 1. Analyze trend. 2. Give 3 actions. 3. Risk Level (High/Med/Low). Language: {request.language}.
    Return JSON: {{ "summary": "...", "actions": ["..."], "risk_level": "..." }}
    """
    try:
        if not os.getenv("OPENAI_API_KEY"): raise Exception("No Key")
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "system", "content": "Return valid JSON."}, {"role": "user", "content": prompt}],
            response_format={"type": "json_object"}, temperature=0.3
        )
        ai_analysis = json.loads(response.choices[0].message.content)
    except Exception as e:
        ai_analysis = { "summary": f"AI Error: {str(e)}", "actions": ["Check logs"], "risk_level": "Unknown" }

    return { "score": score, "metrics": metrics, "ai_analysis": ai_analysis }