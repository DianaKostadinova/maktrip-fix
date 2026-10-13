import requests
import json
import numpy as np
import faiss

# 1. Load dataset
with open("./dataset.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# 2. Function to get embeddings from Ollama
def get_embedding(text):
    response = requests.post(
        "http://localhost:11434/api/embeddings",
        json={"model": "llama3.2", "prompt": text}  # replace with your embedding-capable model
    )
    return response.json()["embedding"]

# 3. Generate embeddings for dataset
texts = [entry["description"] for entry in data]
embeddings = [get_embedding(txt) for txt in texts]
embeddings = np.array(embeddings).astype("float32")

# 4. Build FAISS index
index = faiss.IndexFlatL2(embeddings.shape[1])
index.add(embeddings)

# 5. Query example
query = "ancient observatory in Macedonia"
q_embed = np.array([get_embedding(query)]).astype("float32")

distances, indices = index.search(q_embed, 3)

for idx in indices[0]:
    print(data[idx]["name"], "-", data[idx]["description"])
