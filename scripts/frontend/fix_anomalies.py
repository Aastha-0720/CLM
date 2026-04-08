import os
import re

TEXT_REPLACEMENTS = {
    # CSS plain hex values
    '#161D2A': 'var(--bg-card)',
    '#111827': 'var(--bg-card)',
    '#0E1117': 'var(--bg-dark)',
    '#1E2D3D': 'var(--border-color)',
    
    # JSX string literal values
    "'#161D2A'": "'var(--bg-card)'",
    '"#161D2A"': '"var(--bg-card)"',
    "'#111827'": "'var(--bg-card)'",
    '"#111827"': '"var(--bg-card)"',
    "'#0E1117'": "'var(--bg-dark)'",
    '"#0E1117"': '"var(--bg-dark)"',
    "'#1E2D3D'": "'var(--border-color)'",
    '"#1E2D3D"': '"var(--border-color)"',
    "'#E2E8F0'": "'var(--text-primary)'",
    '"#E2E8F0"': '"var(--text-primary)"',
    "'#64748B'": "'var(--text-muted)'",
    '"#64748B"': '"var(--text-muted)"',
    
    # Specific edge cases like border string
    "'1px solid #1E2D3D'": "'1px solid var(--border-color)'",
    '"1px solid #1E2D3D"': '"1px solid var(--border-color)"'
}

TARGET_FILES = [
    'ReviewPage.module.css',
    'LegalReview.jsx',
    'FinanceReview.jsx',
    'ComplianceReview.jsx',
    'ProcurementReview.jsx',
    'Settings.jsx'
]

base_dir = '/home/rani-sahu/Apeiro/CLM/src/components'

for root, _, files in os.walk(base_dir):
    for filename in files:
        if filename in TARGET_FILES:
            filepath = os.path.join(root, filename)
            with open(filepath, 'r') as f:
                content = f.read()

            new_content = content
            # Apply generic replacements (case-insensitive)
            for find_str, repl_str in TEXT_REPLACEMENTS.items():
                pattern = re.compile(re.escape(find_str), re.IGNORECASE)
                new_content = pattern.sub(repl_str, new_content)

            if new_content != content:
                with open(filepath, 'w') as f:
                    f.write(new_content)
                print(f"Updated generic replacements in {filename}")

print("Done.")
