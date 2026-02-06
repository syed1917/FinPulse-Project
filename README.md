# FinPulse - AI-Powered Financial Health Dashboard

**FinPulse** is a modern, full-stack financial analytics platform designed to turn messy bank statements and receipts into actionable strategic insights. It uses **OpenAI GPT-4o** to automatically clean, categorize, and analyze financial data from virtually any source.

---

## Key Features

* **Universal File Support**: Drag & drop support for **CSV, Excel, PDF, Word Docs**, and **Image Receipts** (`.jpg`, `.png`).
* **Intelligent AI Mapping**: Automatically detects "Date" and "Amount" columns in messy CSVs and categorizes transactions (e.g., "Starbucks" → "Travel/Meals") using GPT-4o.
* **Receipt OCR**: Uses OpenAI Vision to extract transaction details directly from photos of physical receipts.
* **Real-Time Metrics**: Instantly calculates **Cash Runway**, **Burn Rate**, **Net Margin**, and **Cash Flow Trends**.
* **"Senior CFO" Insights**: An AI agent analyzes your monthly trends to provide a strategic summary, actionable advice, and a Risk Score (Low/Med/High).
* **Interactive Ledger**: Edit transaction categories and descriptions directly in the UI with instant dashboard recalculation.
* **Multilingual**: Fully translated UI for English, Spanish, French, German, and Hindi.

---

## Tech Stack

### **Frontend**
* **React (Vite)**: Fast UI framework.
* **Tailwind CSS**: Responsive styling with a collapsible sidebar.
* **Recharts**: Interactive financial charting.
* **Lucide React**: Modern iconography.
* **Axios**: API communication.

### **Backend**
* **FastAPI**: High-performance Python web framework.
* **Pandas**: Robust data processing and cleaning.
* **SQLAlchemy + SQLite**: Persistent local database storage.
* **OpenAI API (Async)**: Powers the categorization agent, document parser, receipt OCR, and CFO insights.
* **Pydantic**: Data validation.

---

## Getting Started

Follow these steps to get FinPulse running locally on your machine.

### **Prerequisites**
* **Node.js** (v16 or higher)
* **Python** (v3.9 or higher)
* **OpenAI API Key** (Required for AI features)

### **1. Backend Setup**

1.  Navigate to the backend folder:
    ```bash
    cd backend
    ```

2.  Create and activate a virtual environment:
    ```bash
    # Windows
    python -m venv venv
    venv\Scripts\activate

    # Mac/Linux
    python3 -m venv venv
    source venv/bin/activate
    ```

3.  Install dependencies:
    ```bash
    pip install fastapi uvicorn pandas sqlalchemy openai python-dotenv pypdf python-docx python-multipart
    ```

4.  **Configure Environment Variables**:
    Create a file named `.env` inside the `backend/` folder:
    ```ini
    OPENAI_API_KEY=sk-proj-YOUR-ACTUAL-KEY-HERE
    DATABASE_URL=sqlite:///./finpulse.db
    ```

5.  Start the server:
    ```bash
    uvicorn app.main:app --reload
    ```
    *The backend is now running at `http://localhost:8000`*

### **2. Frontend Setup**

1.  Open a new terminal and navigate to the frontend folder:
    ```bash
    cd frontend
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Start the development server:
    ```bash
    npm run dev
    ```
    *The app is now running at `http://localhost:5173`*

---

## Usage Guide

1.  **Upload Data**: Click **"Data Sources"** in the sidebar. You can upload a bank CSV, an Excel sheet, a PDF invoice, or an image of a receipt.
2.  **View Dashboard**: The dashboard will auto-populate with graphs. The **AI Health Score** box on the right will analyze your risk level.
3.  **Correct Mistakes**: If the AI miscategorizes a transaction, go to the **"Reports"** tab, click the **Pencil icon**, edit the category, and save. The dashboard updates instantly.
4.  **Change Language**: Use the dropdown in the top-right corner to switch languages.

---

## Project Structure

```text
FinPulse/
├── backend/
│   ├── app/
│   │   ├── main.py                # API Endpoints & Logic
│   │   ├── models.py              # Database & Pydantic Models
│   │   ├── database.py            # SQLite Connection
│   │   └── services/
│   │       ├── financial_engine.py      # Math (Burn Rate, Runway)
│   │       └── categorization_agent.py  # OpenAI Integration (Text & Vision)
│   ├── .env                       # API Keys (GitIgnored)
│   └── requirements.txt           # Python Dependencies
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── DashboardLayout.jsx # Sidebar & Shell
    │   │   ├── FinancialPulse.jsx  # Graphs & AI Cards
    │   │   └── Reports.jsx         # Editable Table
    │   ├── translations.js         # Language files
    │   └── App.jsx                 # Main Routing Logic
    └── package.json
