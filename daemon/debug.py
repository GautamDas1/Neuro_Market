from web3 import Web3

# ================= CONFIGURATION =================
# 1. CONNECT
URL = "http://127.0.0.1:8545"
w3 = Web3(Web3.HTTPProvider(URL))

# 2. PASTE YOUR CURRENT MARKETPLACE ADDRESS HERE
# (From your most recent deploy output)
MARKET_ADDR = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"

# ================= DIAGNOSTIC =================
print("-" * 30)
print("🔍 DIAGNOSTIC MODE STARTING...")

# TEST 1: Connection
if w3.is_connected():
    print("✅ TEST 1: Connected to Blockchain Node.")
else:
    print("❌ TEST 1 FAILED: Cannot connect to 127.0.0.1:8545.")
    print("   -> Fix: Make sure 'npx hardhat node' is running.")
    exit()

# TEST 2: Block Height
block = w3.eth.block_number
print(f"✅ TEST 2: Current Block Height is {block}.")
if block == 0:
    print("   ⚠️ WARNING: Block 0 means the chain is fresh/empty.")
    print("   -> This explains why no sales are found. Run the simulation script!")

# TEST 3: Contract Code
code = w3.eth.get_code(MARKET_ADDR)
if code == b'\x00' or code == b'':
    print(f"❌ TEST 3 FAILED: No Contract found at {MARKET_ADDR}.")
    print("   -> Fix: You are listening to an empty address.")
    print("   -> Action: Check your 'npx hardhat run deploy.ts' output again.")
else:
    print("✅ TEST 3: Contract code found at address.")

# TEST 4: Event Logs (The big one)
# We look for ANY log from this contract
print("⏳ TEST 4: Scanning for ANY logs from this contract...")
logs = w3.eth.get_logs({
    'fromBlock': 0,
    'toBlock': 'latest',
    'address': MARKET_ADDR
})

if len(logs) > 0:
    print(f"✅ TEST 4 SUCCESS: Found {len(logs)} events!")
    print("   -> The events are there. The Listener logic was just filtering too strictly.")
    print(f"   -> Sample Log Topic: {logs[0]['topics'][0].hex()}")
else:
    print("❌ TEST 4 FAILED: 0 Events found.")
    print("   -> Conclusion: The simulation script DID NOT trigger a sale on *this specific* contract.")
    print("   -> Fix: Run 'npx hardhat run scripts/simulate_sale.ts --network localhost' NOW.")

print("-" * 30)