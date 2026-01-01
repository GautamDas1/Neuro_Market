import os
from crypto_manager import generate_key, encrypt_file, decrypt_file

# 1. Setup
original_file = "secret_recipe.txt"
if not os.path.exists(original_file):
    print("❌ Error: Create 'secret_recipe.txt' first!")
    exit()

print(f"📄 Original File: {original_file}")

# 2. Generate Key
key = generate_key()
print(f"🔑 Generated Key: {key.decode()}")

# 3. Encrypt
encrypted_path = encrypt_file(original_file, key)
print(f"🔒 Encrypted File saved at: {encrypted_path}")

# 4. Prove it works: Delete the original!
os.remove(original_file)
print("🗑️  Deleted original file. Now we only have the locked version.")

# 5. Decrypt
print("🔓 Decrypting...")
restored_path = decrypt_file(encrypted_path, key)

print(f"✅ Restored File: {restored_path}")
with open(restored_path, "r") as f:
    print(f"📜 Content: {f.read()}")