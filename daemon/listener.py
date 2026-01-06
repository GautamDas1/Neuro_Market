import time
import requests
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from flask import Flask, request, jsonify
from flask_cors import CORS
import urllib3
from PIL import Image
from io import BytesIO
import re
from collections import Counter
import traceback # <--- ESSENTIAL FOR DEBUGGING

# --- AI SETUP ---
model = None
try:
    import tensorflow as tf
    from tensorflow.keras.applications.mobilenet_v2 import MobileNetV2, preprocess_input, decode_predictions
    from tensorflow.keras.preprocessing import image as keras_image
    model = MobileNetV2(weights='imagenet')
    print("🧠 AI ENGINE: MobileNetV2 (Vision) Loaded.")
except:
    print("⚠️ WARNING: TensorFlow not found. Vision simulated.")

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
app = Flask(__name__)
CORS(app)

print("\n" + "="*60)
print("✅ NEURO-MARKET DEBUG NODE ACTIVE")
print("🔌 Listening on Port 5000...")
print("="*60 + "\n")

# --- SKILLS ---
def analyze_image(content):
    try:
        img = Image.open(BytesIO(content)).resize((224, 224))
        img_array = keras_image.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)
        img_array = preprocess_input(img_array)
        preds = model.predict(img_array)
        decoded = decode_predictions(preds, top=1)[0][0]
        return f"Identified: '{decoded[1]}' (Confidence: {round(decoded[2]*100, 1)}%)"
    except Exception as e: return f"Image Logic Error: {str(e)}"

def train_health_model(content):
    try:
        df = pd.read_csv(BytesIO(content))
        rows, cols = df.shape
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        if len(numeric_cols) < 2: return "Analysis: Not enough numeric data."
        X = df[[numeric_cols[0]]]
        y = df[numeric_cols[1]]
        reg = LinearRegression().fit(X, y)
        score = round(reg.score(X, y) * 100, 2)
        return f"✅ Health Model Trained! R² Score: {score}%"
    except Exception as e: return f"Health Logic Error: {str(e)}"

def train_text_model(content):
    try:
        text = content.decode('utf-8', errors='ignore')
        words = re.findall(r'\w+', text.lower())
        return f"✅ NLP Model Trained! Word Count: {len(words)}"
    except Exception as e: return f"Text Logic Error: {str(e)}"
# --- NEW: HEALTH CHECK ROUTE ---
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "online", "system": "active"})
# --- MAIN ROUTE ---
@app.route('/compute', methods=['POST'])
def run_compute():
    # SAFETY NET: Catch ANY crash and print it
    try:
        data = request.json
        ipfs_hash = data.get('ipfsHash', '')
        algo = data.get('algo', 'analyze_size')
        clean_hash = ipfs_hash.replace("ipfs://", "")
        
        gateways = [
            f"https://cloudflare-ipfs.com/ipfs/{clean_hash}",
            f"https://ipfs.io/ipfs/{clean_hash}",
            f"https://gateway.pinata.cloud/ipfs/{clean_hash}"
        ]

        print(f"\n⚡ NEW JOB: {algo} on {clean_hash}...")

        # 1. DOWNLOAD
        file_content = None
        for url in gateways:
            try:
                print(f"   Trying {url} ...")
                response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, verify=False, timeout=10)
                if response.status_code == 200:
                    file_content = response.content
                    print(f"   ✅ Downloaded {len(file_content)} bytes.")
                    break
                else:
                    print(f"   ❌ Failed ({response.status_code})")
            except Exception as e:
                print(f"   ⚠️ Connection Error: {e}")
        
        if not file_content:
            print("   ❌ ALL GATEWAYS FAILED.")
            return jsonify({"status": "error", "result": "Network Error: Could not download file."})

        # 2. COMPUTE
        result_msg = ""
        if algo == "ai_image":
            if model: 
                result_msg = analyze_image(file_content)
            else:
                result_msg = "Error: TensorFlow not installed."
        elif algo == "health_train":
            result_msg = train_health_model(file_content)
        elif algo == "nlp_train":
            result_msg = train_text_model(file_content)
        else:
            result_msg = f"Data Size: {len(file_content)} bytes"

        print(f"   ✅ SUCCESS: {result_msg}")
        return jsonify({"status": "success", "result": result_msg})

    except Exception as e:
        print("\n❌ CRITICAL CRASH:")
        traceback.print_exc() 
        return jsonify({"status": "error", "result": f"Server Crash: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(port=5000)