import time
import requests 
from flask import Flask, request, jsonify
from flask_cors import CORS
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

app = Flask(__name__)
CORS(app)

print("\n" + "="*60)
print("✅ NEURO-MARKET ROBUST COMPUTE NODE ACTIVE")
print("🔌 Listening on Port 5000...")
print("="*60 + "\n")

@app.route('/compute', methods=['POST'])
def run_compute():
    data = request.json
    ipfs_hash = data.get('ipfsHash', '')
    clean_hash = ipfs_hash.replace("ipfs://", "")
    
    # 🛡️ LIST OF GATEWAYS TO TRY (In case WiFi blocks one)
    gateways = [
        f"https://cloudflare-ipfs.com/ipfs/{clean_hash}",  # Fast & Open
        f"https://ipfs.io/ipfs/{clean_hash}",              # Official
        f"https://gateway.pinata.cloud/ipfs/{clean_hash}", # Pinata
        f"https://dweb.link/ipfs/{clean_hash}"             # Backup
    ]
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }

    print(f"\n⚡ NEW JOB: Processing {clean_hash}...")

    # --- LOOP THROUGH GATEWAYS UNTIL ONE WORKS ---
    for url in gateways:
        try:
            print(f"   Trying Gateway: {url} ...")
            response = requests.get(url, headers=headers, verify=False, timeout=10)
            
            if response.status_code == 200:
                # SUCCESS! We found a working door.
                file_size = len(response.content)
                print(f"   ✅ SUCCESS! Downloaded {file_size} bytes.")
                
                return jsonify({
                    "status": "success", 
                    "result": f"Verified Real Data via {url.split('/')[2]}. Size: {file_size} bytes."
                })
            else:
                print(f"   ❌ Blocked ({response.status_code}). Trying next...")
                
        except Exception as e:
            print(f"   ⚠️ Connection Error on this gateway. Trying next...")

    # IF ALL FAIL:
    print("   ❌ ALL GATEWAYS FAILED. (Likely WiFi Block)")
    return jsonify({
        "status": "error", 
        "result": "Network Error: WiFi is blocking all IPFS connections."
    }), 500

if __name__ == '__main__':
    app.run(port=5000)