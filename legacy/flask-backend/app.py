from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
import numpy as np
import faiss

app = Flask(__name__)
CORS(app)  # Allow React to make requests

# Load your data and build index on startup
with open("src/dataset.json", "r", encoding="utf-8") as f:
    data = json.load(f)

def get_embedding(text):
    response = requests.post(
        "http://localhost:11434/api/embeddings",
        json={"model": "llama3.2", "prompt": text}
    )
    return response.json()["embedding"]

# Build index on startup
print("Building FAISS index...")
texts = [entry["description"] for entry in data]
embeddings = [get_embedding(txt) for txt in texts]
embeddings = np.array(embeddings).astype("float32")

index = faiss.IndexFlatL2(embeddings.shape[1])
index.add(embeddings)
print("Index built!")

@app.route('/search', methods=['POST'])
def search():
    query = request.json.get('query')
    if not query:
        return jsonify({"error": "No query provided"}), 400
    
    try:
        q_embed = np.array([get_embedding(query)]).astype("float32")
        distances, indices = index.search(q_embed, 3)
        
        results = []
        for idx in indices[0]:
            results.append({
                "name": data[idx]["name"],
                "description": data[idx]["description"]
            })
        
        return jsonify({"results": results})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)