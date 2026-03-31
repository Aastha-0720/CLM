import os
from dotenv import load_dotenv

# Try to load default .env
load_dotenv()
print(f"Loading default .env (CWD): {os.getcwd()}")
print(f"DIGINK_CLIENT_ID: {os.getenv('DIGINK_CLIENT_ID')}")

# Try to load from parent
load_dotenv("../.env")
print(f"\nLoading from ../.env:")
print(f"DIGINK_CLIENT_ID: {os.getenv('DIGINK_CLIENT_ID')}")
