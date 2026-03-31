from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY", ""),
    base_url=os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
)
model = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")

try:
    print(f"Testing DeepSeek with model: {model}")
    print(f"Base URL: {client.base_url}")
    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": "Hello, are you working?"}],
        max_tokens=50
    )
    print("Response successful!")
    print(f"Content: {response.choices[0].message.content}")
except Exception as e:
    print(f"DeepSeek test failed: {e}")
