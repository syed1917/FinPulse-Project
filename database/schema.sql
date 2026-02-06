-- database/schema.sql

-- NOTE: Create the database manually first if it doesn't exist
-- CREATE DATABASE finpulse_db;

-- Run the following lines INSIDE the 'finpulse_db' database:

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(50) NOT NULL,
    tax_id_encrypted TEXT, 
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id),
    txn_date DATE NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_txn_date ON transactions(txn_date);