# index_and_server.py
from fastapi import FastAPI
from pydantic import BaseModel
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
import uvicorn
import os
from typing import List

# Use local persistent directory for chroma DB
CHROMA_DIR = os.path.join(os.path.dirname(__file__), "chroma-db")

client = chromadb.Client(Settings(chroma_db_impl="duckdb+parquet", persist_directory=CHROMA_DIR))
collection_name = "site_content"

# create or get collection
try:
    collection = client.create_collection(name=collection_name)
except Exception:
    collection = client.get_collection(collection_name)

# model for embeddings
embed_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

app = FastAPI()

class Doc(BaseModel):
    id: str
    title: str = ""
    text: str
    metadata: dict = {}

class IndexRequest(BaseModel):
    docs: List[Doc]  # list of documents to index (id,text,title,metadata)

class SearchRequest(BaseModel):
    query: str
    k: int = 5

@app.post("/index")
def index_docs(req: IndexRequest):
    ids = [d.id for d in req.docs]
    texts = [d.text for d in req.docs]
    metadatas = [d.metadata for d in req.docs]
    embeddings = embed_model.encode(texts, show_progress_bar=False).tolist()
    # upsert to collection
    collection.upsert(
        ids=ids,
        documents=texts,
        metadatas=metadatas,
        embeddings=embeddings,
    )
    client.persist()
    return {"ok": True, "count": len(ids)}

@app.post("/search")
def search(req: SearchRequest):
    q_embed = embed_model.encode([req.query], show_progress_bar=False).tolist()
    res = collection.query(
        query_embeddings=q_embed,
        n_results=req.k,
        include=["documents", "metadatas", "distances", "ids"],
    )
    # res is a dict with single-row arrays
    results = []
    if res and len(res["documents"])>0:
        docs = res["documents"][0]
        metas = res["metadatas"][0]
        dists = res["distances"][0]
        ids = res["ids"][0]
        for i in range(len(docs)):
            results.append({
                "id": ids[i],
                "text": docs[i],
                "metadata": metas[i],
                "distance": dists[i]
            })
    return {"results": results}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8001)
