from cryptography.fernet import Fernet
import os

def generate_key():
    """Generates a secret key for locking the file"""
    return Fernet.generate_key()

def encrypt_file(file_path, key):
    """
    1. Reads your file.
    2. Locks it with the Key.
    3. Saves it as 'filename.enc'
    """
    f = Fernet(key)
    
    # Read original data
    with open(file_path, "rb") as file:
        file_data = file.read()
        
    # Encrypt data
    encrypted_data = f.encrypt(file_data)
    
    # Save encrypted version
    out_path = file_path + ".enc"
    with open(out_path, "wb") as file:
        file.write(encrypted_data)
        
    return out_path

def decrypt_file(enc_file_path, key):
    """
    Unlocks the file (Used by the buyer)
    """
    f = Fernet(key)
    
    with open(enc_file_path, "rb") as file:
        encrypted_data = file.read()
        
    decrypted_data = f.decrypt(encrypted_data)
    
    # Remove .enc extension to restore original name
    out_path = enc_file_path.replace(".enc", "")
    with open(out_path, "wb") as file:
        file.write(decrypted_data)
        
    return out_path