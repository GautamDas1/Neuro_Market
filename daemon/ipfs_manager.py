import requests
import os
import json
import urllib3

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# ================= CONFIGURATION =================
MOCK_MODE = False 
PINATA_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI1MDIyMjdjMC02MGZhLTRiNmMtOTg0MC04OGM5MWNkZGE3NDIiLCJlbWFpbCI6ImdhdXRhbWtkNTc2QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiJkYmE2ODk1ZDUyYWQyNjEzMmE3NCIsInNjb3BlZEtleVNlY3JldCI6IjRjNDMzMmJlODc0NWFkYWM2MGJiZTMwMTdjNjVkYmY4NGM2YjQ2YmY1ZjYxNGNjOGM1MDhkYWRmNTIwN2Q3ODkiLCJleHAiOjE3OTg3OTEyNzh9.RzHVbZF7QEnDQVWNvMRcU289FCHeEs0yDU7r8M-IkJk"
# =================================================

def upload_to_ipfs(file_path):
    # Standard upload logic
    if MOCK_MODE: return "QmMockHash"
    
    url = "https://api.pinata.cloud/pinning/pinFileToIPFS"
    if not os.path.exists(file_path): return None
    headers = { "Authorization": f"Bearer {PINATA_JWT}" }
    with open(file_path, "rb") as file_data:
        files = {"file": file_data}
        try:
            response = requests.post(url, headers=headers, files=files)
            if response.status_code == 200:
                print(f"✅ Upload Successful! CID: {response.json()['IpfsHash']}")
                return response.json()['IpfsHash']
            return None
        except Exception: return None

def download_from_ipfs(cid, output_path):
    """
    Tries multiple IPFS Gateways. With VPN, one of these WILL work.
    """
    clean_cid = cid.strip()
    folder = os.path.dirname(output_path)
    if folder and not os.path.exists(folder):
        os.makedirs(folder)

    # The Gateway Army: We try all of them!
    gateways = [
        f"https://ipfs.io/ipfs/{clean_cid}",           # Official
        f"https://gateway.pinata.cloud/ipfs/{clean_cid}", # Your Pinata
        f"https://cf-ipfs.com/ipfs/{clean_cid}",       # Cloudflare
        f"https://dweb.link/ipfs/{clean_cid}"          # Backup
    ]

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124 Safari/537.36"
    }

    print(f"⬇️  Starting Download for CID: {clean_cid}")

    for url in gateways:
        try:
            print(f"   Trying: {url} ...")
            # We use verify=False to prevent Windows SSL errors
            response = requests.get(url, headers=headers, verify=False, timeout=10)
            
            if response.status_code == 200:
                with open(output_path, "wb") as f:
                    f.write(response.content)
                print(f"✅ Success! Downloaded from: {url}")
                return True
            else:
                print(f"   ❌ Failed ({response.status_code})")
        except Exception:
            print(f"   ⚠️  Connection Error. Skipping...")

    print("❌ CRITICAL: All gateways failed. Check VPN connection.")
    return False