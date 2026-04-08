import httpx
import asyncio
import sys

# Replace this with the actual port of your backend (usually 5000 in Docker)
BASE_URL = "http://localhost:5000" 

async def test_webhook(doc_id: str):
    payload = {
        "document_id": doc_id,
        "status": "signed"
    }
    
    print(f"Simulating signature for document: {doc_id}...")
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(f"{BASE_URL}/api/webhook/digink", json=payload)
            if response.status_code == 200:
                print("✅ Success! Webhook processed.")
                print(f"Response: {response.json()}")
            else:
                print(f"❌ Failed (Status {response.status_code})")
                print(f"Error: {response.text}")
        except Exception as e:
            print(f"❌ Error connecting to backend: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python verify_digink.py <DIGINK_DOC_ID>")
        print("Tip: You can find the DigInk Doc ID in the CAS page after clicking 'Send for Signature'")
        sys.exit(1)
    
    doc_id = sys.argv[1]
    asyncio.run(test_webhook(doc_id))
