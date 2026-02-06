from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, Text, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
from pydantic import BaseModel
from typing import List, Optional, Dict

# DATABASE MODELS
class Company(Base):
    __tablename__ = "companies"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    industry = Column(String, nullable=False)
    tax_id_encrypted = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    transactions = relationship("Transaction", back_populates="company")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, index=True)
    company_id = Column(String, ForeignKey("companies.id"))
    txn_date = Column(Date, nullable=False)
    amount = Column(Float, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    company = relationship("Company", back_populates="transactions")

# API SCHEMAS
class TransactionInput(BaseModel):
    date: str
    amount: float
    description: str
    category: Optional[str] = None

class FinancialReportRequest(BaseModel):
    company_name: str
    industry: str
    transactions: List[TransactionInput]
    language: str = "en"

class AIInsight(BaseModel):
    summary: str
    actions: List[str]
    risk_level: str

class HealthReportResponse(BaseModel):
    score: int
    metrics: Dict
    ai_analysis: AIInsight