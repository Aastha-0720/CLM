import asyncio
import os
from database import db # This will trigger load_dotenv(find_dotenv())
import digink_service

async def test_create():
    # Create a dummy text file
    file_path = "test_doc.txt"
    with open(file_path, "w") as f:
        f.write("This is a test document for DigInk signature integration.")
    
    print(f"Testing DigInk document creation with {file_path}...")
    
    recipients = [
        {"email": "Aastha.Pradhan@apeiro.digital", "name": "Aastha Pradhan", "role": "signer"}
    ]
    
    try:
        # Use Aastha as the sender to match current backend logic
        result = await digink_service.create_document(
            sender_email="Aastha.Pradhan@apeiro.digital",
            title="E2E Test - Rani Signature",
            file_path=file_path,
            recipients=recipients
        )
        print(f"\nAPI Response: {result}")
        print(f"\nSuccess! DigInk Document ID: {result.get('document_id') or result.get('id')}")
    except Exception as e:
        print(f"\nFailed to create document: {e}")
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

if __name__ == "__main__":
    asyncio.run(test_create())
