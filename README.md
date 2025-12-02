# AI-Powered Personalized News Recommender

End-to-end personalized news recommendation system using:

- BBC RSS ingestion (via Colab)
- SentenceTransformers embeddings
- FAISS vector search
- Flask web API + frontend
- MongoDB Atlas for user profiles + feedback
- Docker + Render deployment

## Features
- Real-time recommendations based on text query or user profile.
- User feedback loop: click/like updates user profile instantly.
- FAISS-powered fast vector similarity search.
- Deployed as a Docker container.

## Run locally

```bash
pip install -r requirements.txt
export $(grep -v '^#' .env | xargs)
python app/main.py
