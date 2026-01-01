import json
import time
import os
from web3 import Web3
from ipfs_manager import download_from_ipfs
from crypto_manager import decrypt_file

# ================= CONFIGURATION =================
# 1. Connect to Local Blockchain
w3 = Web3(Web3.HTTPProvider("http://127.0.0.1:8545"))

# 2. Paste addresses from your Deployment (Phase 2)
# ===> MAKE SURE THESE ARE CORRECT! <===
MARKETPLACE_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"

# We go up one level (..), then into 'neuro-market', then 'artifacts'
with open("../neuro-market/artifacts/contracts/NeuroMarketplace.sol/NeuroMarketplace.json") as f:
    market_abi = json.load(f)["abi"]

contract = w3.eth.contract(address=MARKETPLACE_ADDRESS, abi=market_abi)
# =================================================

def handle_event(event):
    print("\n🔔 NEW SALE DETECTED!")
    
    # 1. Extract Details
    buyer = event['args']['buyer']
    dataToken = event['args']['dataToken']
    print(f"💰 Buyer: {buyer}")
    print(f"KZ Token Address: {dataToken}")

    # 2. Get Data Details from Blockchain
    # We ask the contract: "What is the CID for this token?"
    # (Note: In a real app, we'd map Token -> CID. Here, we'll assume a test CID for the demo)
    # FOR DEMO: We will use the CID we just put in database.json
    cid = "QmSeygQMq7tGcrGXer2qtWZgjRrkT3FYDk9hsLDobZdWTT" 
    print(f"📦 Content CID: {cid}")

    # 3. Look up Key in Database
    try:
        with open("database.json", "r") as db:
            keys = json.load(db)
        
        if cid in keys:
            secret_key = keys[cid]
            print("🔑 Key found in Vault!")
            
            # 4. DOWNLOAD & DECRYPT
            # Create a downloads folder
            if not os.path.exists("downloads"):
                os.makedirs("downloads")
            
            encrypted_path = f"downloads/{cid}.enc"
            
            # A. Download
            if download_from_ipfs(cid, encrypted_path):
                # B. Decrypt
                print("🔓 Decrypting file for Buyer...")
                final_path = decrypt_file(encrypted_path, secret_key.encode())
                print(f"🚀 DELIVERY COMPLETE! File ready at: {final_path}")
            
        else:
            print("❌ Error: Key not found for this file.")

    except Exception as e:
        print(f"❌ Processing Error: {e}")

def main_loop():
    print("👀 Listening for Sales on the Blockchain...")
    
    # Create a filter for the specific event "AccessPurchased"
    event_filter = contract.events.AccessPurchased.create_filter(from_block='latest')
    
    while True:
        # Check for new logs
        for event in event_filter.get_new_entries():
            handle_event(event)
        time.sleep(2)

if __name__ == "__main__":
    if w3.is_connected():
        print("✅ Connected to Blockchain")
        main_loop()
    else:
        print("❌ Failed to connect to Blockchain")