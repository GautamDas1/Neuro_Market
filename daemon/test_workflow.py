import os
from crypto_manager import generate_key, encrypt_file
from ipfs_manager import upload_to_ipfs

def main():
    print("🚀 STARTING FULL WORKFLOW TEST...")

    # 1. Create a dummy file
    filename = "my_dataset.csv"
    with open(filename, "w") as f:
        f.write("Date,Price,Volume\n2025-01-01,100,500\n2025-01-02,105,600")
    print(f"📄 Created dummy file: {filename}")

    # 2. Encrypt it
    print("🔒 Encrypting...")
    key = generate_key()
    encrypted_path = encrypt_file(filename, key)
    print(f"🔑 Key generated: {key.decode()}")
    print(f"📦 Encrypted file: {encrypted_path}")

    # 3. Upload to IPFS
    print("☁️  Uploading to IPFS...")
    ipfs_hash = upload_to_ipfs(encrypted_path)

    if ipfs_hash:
        print("\n🎉 SUCCESS!")
        print(f"🌍 The file is live at: ipfs://{ipfs_hash}")
        print(f"🔑 The Key to unlock it is: {key.decode()}")
        print("---------------------------------------------------")
        print("Save these two values! In the next step, we will")
        print("put this IPFS Hash onto the Blockchain.")
    else:
        print("\n❌ Failed to upload.")

    # Cleanup (Optional)
    # os.remove(filename)
    # os.remove(encrypted_path)

if __name__ == "__main__":
    main()