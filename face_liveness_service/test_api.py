import requests

url = "http://127.0.0.1:5001/check-liveness"
file_path = "hoa3.jpg"

with open(file_path, "rb") as f:
    files = {"file": f}
    response = requests.post(url, files=files)

print(response.json())
