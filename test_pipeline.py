import urllib.request
import json

# 1. Login
login_req = urllib.request.Request(
    'http://localhost:8080/resumeAnalyser/entry/v1/login',
    data=json.dumps({'email': 'testuser@example.com', 'password': 'password123'}).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)
with urllib.request.urlopen(login_req) as resp:
    cookie_header = resp.headers.get('Set-Cookie', '')
    token = ""
    for part in cookie_header.split(";"):
        if "entrypasstoken=" in part:
            token = part.split("entrypasstoken=")[1].strip()
            break
    print('Logged in successfully. Token:', token[:15] + '...')

# 2. Upload Resume Multipart
boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
lines = [
    f'--{boundary}'.encode('utf-8'),
    b'Content-Disposition: form-data; name="roles"\r\n',
    b'Senior Java Developer',
    f'--{boundary}'.encode('utf-8'),
    b'Content-Disposition: form-data; name="file"; filename="test-resume.pdf"',
    b'Content-Type: application/pdf\r\n'
]

with open('test-resume.pdf', 'rb') as f:
    pdf_bytes = f.read()

body = b'\r\n'.join(lines) + b'\r\n' + pdf_bytes + f'\r\n--{boundary}--\r\n'.encode('utf-8')

upload_req = urllib.request.Request(
    'http://localhost:8080/resumeAnalyserCore/service/v1/extract',
    data=body,
    headers={
        'Content-Type': f'multipart/form-data; boundary={boundary}',
        'Authorization': f'Bearer {token}'
    }
)
with urllib.request.urlopen(upload_req) as resp:
    print('Extract response status:', resp.status, resp.read().decode('utf-8'))

# 3. Fetch Last Report
report_req = urllib.request.Request(
    'http://localhost:8080/resumeAnalyserCore/service/v1/lastReport',
    headers={'Authorization': f'Bearer {token}'}
)
with urllib.request.urlopen(report_req) as resp:
    data = json.loads(resp.read().decode('utf-8'))
    print('================ REPORT VERIFIED ================')
    print('Overall Score:', data.get('score'))
    print('ATS Score:', data.get('atsoptimizationscore'))
    print('Executive Summary:', data.get('summary'))
    print('Detected Skills:', data.get('detectedSkills'))
    print('Missing Skills:', data.get('missingSkills'))
    print('Strengths (Pros):', len(data.get('pros', [])))
    print('Improvements (Cons):', len(data.get('cons', [])))
    print('Action Tips (Sug):', len(data.get('suggestions', [])))
    print('Job Recommendations:', len(data.get('jobs', [])))
    print('=================================================')
