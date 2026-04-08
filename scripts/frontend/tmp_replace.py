import re
import os

path = r"c:\Users\aasth\OneDrive\Desktop\Contrax\CLM\src\services\contractService.js"
with open(path, "r") as f:
    content = f.read()

# 1. Add import
if "getAuthHeaders" not in content:
    content = content.replace("const API_BASE = '/api';", "import { getAuthHeaders } from './authHelper';\n\nconst API_BASE = '/api';")

# 2. Replace simple fetch(url)
content = re.sub(r'fetch\(([^,]+?)\);', r'fetch(\1, { headers: getAuthHeaders() });', content)

# 3. Replace fetch(url, { ... }) without headers
content = re.sub(r"fetch\(([^,]+?),\s*\{\s*method:\s*('POST'|'DELETE')(?![\s\S]*?headers:)([\s\S]*?)\}\);", r"fetch(\1, {\n            method: \2,\n            headers: getAuthHeaders(),\3});", content)

# 4. Replace fetch with json headers
content = re.sub(r"headers:\s*\{\s*'Content-Type':\s*'application/json'\s*\}", r"headers: getAuthHeaders()", content)

# 5. Replace fetch with formData (need getAuthHeaders(true))
content = re.sub(r"fetch\(([^,]+?),\s*\{\s*method:\s*'POST',\s*body:\s*(payload|formData)\s*\}\);", r"fetch(\1, {\n            method: 'POST',\n            headers: getAuthHeaders(true),\n            body: \2\n        });", content)

with open(path, "w") as f:
    f.write(content)
print("Updated contractService.js successfully")
