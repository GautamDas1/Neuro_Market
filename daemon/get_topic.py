from web3 import Web3

# The signature from your NeuroMarketV2.sol file:
# event FilePurchased(address indexed buyer, string dataTokenURI);
signature = "FilePurchased(address,string)"

# Calculate the hash
topic_hash = Web3.keccak(text=signature).hex()

print("-" * 30)
print(f"📡 Event Signature: {signature}")
print(f"🔑 CORRECT TOPIC HASH: {topic_hash}")
print("-" * 30)