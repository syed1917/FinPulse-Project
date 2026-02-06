import os
import json
import base64
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

STANDARD_CATEGORIES = [
    "Revenue", "COGS", "Payroll", "Rent", "Software", 
    "Marketing", "Travel", "Utilities", "Uncategorized", 
    "Operational", "Financial", "Legal"
]

async def categorize_batch(descriptions: list[str]):
    if not os.getenv("OPENAI_API_KEY"):
        return [{"description": d, "category": "Uncategorized"} for d in descriptions]

    system_prompt = f"""
    You are an accountant. Map these transaction descriptions to exactly one category from this list:
    {json.dumps(STANDARD_CATEGORIES)}
    
    Return JSON format: {{ "mappings": [{{ "description": "text", "category": "cat" }}] }}
    """
    
    try:
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": json.dumps(descriptions)}
            ],
            response_format={"type": "json_object"},
            temperature=0
        )
        return json.loads(response.choices[0].message.content).get("mappings", [])
    except Exception as e:
        print(f"AI Categorization Error: {e}")
        return [{"description": d, "category": "Uncategorized"} for d in descriptions]

async def parse_document_text(raw_text: str):
    if not os.getenv("OPENAI_API_KEY"): return []
    
    # Truncate to avoid token limits
    truncated_text = raw_text[:15000]

    system_prompt = f"""
    Extract financial transactions from the text below.
    Ignore headers, footers, and page numbers.
    
    Return a strictly valid JSON object with a list "transactions". 
    Each transaction must have:
    - "date" (YYYY-MM-DD)
    - "description" (string)
    - "amount" (number, negative for expenses, positive for deposits)
    - "category" (Guess based on description from: {json.dumps(STANDARD_CATEGORIES)})
    
    JSON Format: {{ "transactions": [ ... ] }}
    """

    try:
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": truncated_text}
            ],
            response_format={"type": "json_object"},
            temperature=0
        )
        data = json.loads(response.choices[0].message.content)
        return data.get("transactions", [])
    except Exception as e:
        print(f"AI Parse Error: {e}")
        return []

async def parse_receipt_image(file_content: bytes):
    if not os.getenv("OPENAI_API_KEY"): return []

    # Encode image to Base64
    base64_image = base64.b64encode(file_content).decode('utf-8')

    system_prompt = f"""
    You are a receipt scanner. Extract the transaction details from this image.
    Return a strictly valid JSON object with a list "transactions" containing one item.
    The item must have:
    - "date" (YYYY-MM-DD)
    - "description" (Merchant Name)
    - "amount" (number, negative for expenses)
    - "category" (Guess based on merchant from: {json.dumps(STANDARD_CATEGORIES)})
    
    JSON Format: {{ "transactions": [ ... ] }}
    """

    try:
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": [
                    {"type": "text", "text": "Extract data from this receipt."},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                ]}
            ],
            response_format={"type": "json_object"},
            temperature=0
        )
        data = json.loads(response.choices[0].message.content)
        return data.get("transactions", [])
    except Exception as e:
        print(f"Vision AI Error: {e}")
        return []