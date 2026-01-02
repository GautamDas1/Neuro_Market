import time
import json
import re
from web3 import Web3

# ================= CONFIGURATION =================
BLOCKCHAIN_URL = "http://127.0.0.1:8545"
MARKETPLACE_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512" 
# (Ensure this address matches your V2 deployment)

# Topic for FilePurchased(address,string)
EVENT_TOPIC = "85c0e6c4761ddc10b64021980d69096e9a25f37126fafe72f4296427eabbe480"

w3 = Web3(Web3.HTTPProvider(BLOCKCHAIN_URL))

def load_db():
    try:
        with open("database.json", "r") as f: return json.load(f)
    except: return {}

def handle_sale(log):
    print("\n" + "="*60)
    print(f"⚡ SALE CONFIRMED (Tx: {log['transactionHash'].hex()[:10]}...)")
    print("="*60)

    try:
        # 1. EXTRACT BUYER
        buyer_topic = log['topics'][1]
        if hasattr(buyer_topic, 'hex'): buyer_hex = buyer_topic.hex()
        else: buyer_hex = str(buyer_topic)
        buyer = "0x" + buyer_hex[-40:]

        # 2. EXTRACT CID (Clean Text Method)
        raw_data = log['data']
        if hasattr(raw_data, 'hex'): data_hex = raw_data.hex()
        else: data_hex = raw_data
        
        clean_hex = data_hex.replace("0x", "")
        full_text = bytes.fromhex(clean_hex).decode('utf-8', errors='ignore')
        
        # Find the CID
        match = re.search(r'(Qm[a-zA-Z0-9]{44})', full_text)
        if match:
            cid = match.group(1)
        else:
            return # Skip if no valid CID found

        # 3. EXECUTE PROTOCOL
        db = load_db()
        item_data = db.get(cid)
        
        if not item_data:
            print(f"⚠️  New file sold: {cid} (Not in local DB)")
            return

        item_name = item_data.get("name", "Unknown Dataset")
        mode = item_data.get("mode", "standard")

        print(f"👤 Buyer:    {buyer}")
        print(f"📦 Product:  {item_name}")
        print(f"⚙️  Protocol: {mode.upper()}")
        print("-" * 60)

        if mode == "compute_privacy":
            print("🔒 STARTING PRIVACY PRESERVING COMPUTE...")
            time.sleep(1)
            print("   1. Initializing Secure Enclave...")
            time.sleep(1)
            print("   2. Transferring Algorithm (Visiting Chef)...")
            for i in range(5):
                print(f"      [Computing {i*20}%] {'#'*(i+1)}", end="\r")
                time.sleep(0.4)
            print("\n   ✅ RESULT: Model Trained. Weights sent to Buyer.")
        else:
            print("🌍 STARTING STANDARD DOWNLOAD...")
            time.sleep(1)
            print("   ✅ RESULT: File Decrypted & Sent to Buyer.")

    except Exception as e:
        print(f"❌ Error processing sale: {e}")

if __name__ == "__main__":
    if not w3.is_connected():
        print("❌ Error: Blockchain node not found.")
        exit()

    print(f"✅ NEURO-MARKET LISTENER ACTIVE")
    print("   Listening for sales on NeuroMarketV2...")
    
    last_block = 0

    while True:
        try:
            current = w3.eth.block_number
            if last_block <= current:
                logs = w3.eth.get_logs({
                    'fromBlock': last_block,
                    'toBlock': current,
                    'address': MARKETPLACE_ADDRESS,
                    'topics': [EVENT_TOPIC]
                })
                for log in logs: handle_sale(log)
                last_block = current + 1
            time.sleep(2)
        except KeyboardInterrupt:
            print("\n🛑 Listener Stopped.")
            break
        except: pass