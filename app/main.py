import os
import json
import numpy as np
from flask import Flask, request, render_template, jsonify
from dotenv import load_dotenv
from sklearn.neighbors import NearestNeighbors
from pymongo import MongoClient

# Load .env
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
MODEL_NAME = "all-MiniLM-L6-v2"
TOP_K = 10

# ---- Load embeddings & metadata ----
META_PATH = "artifacts/articles_meta.jsonl"
EMB_PATH = "artifacts/article_embeddings.npy"

print("Loading metadata...")
articles = []
with open(META_PATH, "r", encoding="utf-8") as f:
    for line in f:
        articles.append(json.loads(line))
print("Loaded", len(articles), "articles")

print("Loading embeddings...")
embeddings = np.load(EMB_PATH)
print("Emb shape:", embeddings.shape)

# ---- Build sklearn Nearest Neighbors ----
print("Building KNN index...")
knn = NearestNeighbors(n_neighbors=TOP_K, metric="cosine")
knn.fit(embeddings)

# ---- MongoDB Connection ----
db = None
if MONGO_URI:
    try:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        client.admin.command("ping")
        db = client.get_database()
        print("Connected to MongoDB:", db.name)
    except Exception as e:
        print("MongoDB connect failed:", e)

app = Flask(__name__)
from flask import send_file

@app.route('/api/articles', methods=['GET'])
def api_articles():
    # returns the JSON array of article metadata
    meta_path = "artifacts/articles_meta.jsonl"
    articles = []
    with open(meta_path, "r", encoding="utf-8") as fh:
        for line in fh:
            if line.strip():
                articles.append(json.loads(line))
    return jsonify(articles)


# ---- Routes ----

@app.route("/")
def home():
    return "News recommender is running!"

@app.route("/api/recommend", methods=["POST"])
def recommend():
    data = request.json
    idx = data.get("article_idx")

    if idx is None or idx >= len(articles):
        return jsonify({"error": "invalid index"}), 400

    distances, indices = knn.kneighbors([embeddings[idx]])

    recs = []
    for i in indices[0]:
        recs.append({
            "title": articles[i]["title"],
            "url": articles[i]["url"],
        })

    return jsonify({"recommendations": recs})

@app.route("/api/feedback", methods=["POST"])
def feedback():
    if db is None:
        return jsonify({"error": "mongodb not connected"}), 500

    data = request.json
    db.feedback.insert_one(data)
    return jsonify({"status": "stored"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)))
