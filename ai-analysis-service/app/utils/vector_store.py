import os
import uuid
from typing import List, Dict, Any, Optional
import chromadb
from chromadb.config import Settings
# from pymilvus import model  # Moved to lazy loading in VectorStoreManager

from app.config import settings

class VectorStoreManager:
    """Manages local (ChromaDB) or cloud (Pinecone) vector storage."""
    
    def __init__(self):
        self.provider = settings.vector_db_provider.lower()
        self._embedding_fn = None
        self.client = None
        self.collection = None
        self.pinecone_index = None
        
        if self.provider == "pinecone":
            self._init_pinecone()
        else:
            self._init_chroma()

    @property
    def embedding_fn(self):
        """Lazy load the embedding function only when needed."""
        if self._embedding_fn is None:
            print("🚀 Loading embedding model (lazy-load)...")
            from pymilvus import model
            self._embedding_fn = model.DefaultEmbeddingFunction()
        return self._embedding_fn


    def _init_chroma(self):
        try:
            db_path = "chroma_db"
            self.client = chromadb.PersistentClient(path=db_path)
            self.collection = self.client.get_or_create_collection(
                name="contract_segments",
                metadata={"hnsw:space": "cosine"}
            )
            print(f"✅ Initialized ChromaDB at: {db_path}")
        except Exception as e:
            print(f"❌ ChromaDB Init Error: {e}")

    def _init_pinecone(self):
        try:
            from pinecone import Pinecone, ServerlessSpec
            pc = Pinecone(api_key=settings.pinecone_api_key)
            
            index_name = settings.pinecone_index_name
            if index_name not in [idx.name for idx in pc.list_indexes()]:
                pc.create_index(
                    name=index_name,
                    dimension=768, # Default dimension for Milvus DefaultEmbeddingFunction
                    metric="cosine",
                    spec=ServerlessSpec(cloud="aws", region="us-east-1")
                )
            self.pinecone_index = pc.Index(index_name)
            print(f"✅ Initialized Pinecone Index: {index_name}")
        except Exception as e:
            print(f"❌ Pinecone Init Error: {e}")
            print("Falling back to ChromaDB...")
            self.provider = "chroma"
            self._init_chroma()

    def add_document(self, text: str, metadata: Dict[str, Any]):
        """
        Split text into chunks and add to vector store.
        Metadata MUST include user_id, analysis_id, and contract_name.
        """
        try:
            # Chunking logic
            chunks = [c.strip() for c in text.split('\n\n') if len(c.strip()) > 50]
            if not chunks:
                chunks = [text[i:i+1000] for i in range(0, len(text), 1000)]

            embeddings = self.embedding_fn.encode_documents(chunks)
            
            user_id = str(metadata.get("user_id", "anonymous"))
            analysis_id = str(metadata.get("analysis_id", str(uuid.uuid4())))
            
            if self.provider == "pinecone" and self.pinecone_index:
                vectors = []
                for i, (chunk, emb) in enumerate(zip(chunks, embeddings)):
                    vectors.append({
                        "id": f"{analysis_id}_{i}",
                        "values": emb.tolist() if hasattr(emb, 'tolist') else emb,
                        "metadata": {
                            "text": chunk,
                            "user_id": user_id,
                            "analysis_id": analysis_id,
                            "contract_name": str(metadata.get("contract_name", "")),
                            "category": str(metadata.get("category", "")),
                            "chunk_index": i
                        }
                    })
                self.pinecone_index.upsert(vectors=vectors, namespace="contracts")
            
            elif self.collection:
                ids = [f"{analysis_id}_{i}" for i in range(len(chunks))]
                flat_metadatas = [
                    {
                        "user_id": user_id,
                        "analysis_id": analysis_id,
                        "contract_name": str(metadata.get("contract_name", "")),
                        "category": str(metadata.get("category", "")),
                        "chunk_index": i
                    }
                    for i in range(len(chunks))
                ]
                self.collection.add(
                    ids=ids,
                    embeddings=embeddings,
                    documents=chunks,
                    metadatas=flat_metadatas
                )
            
            print(f"✅ Indexed {len(chunks)} chunks for user {user_id}")
        except Exception as e:
            print(f"❌ Indexing Error: {e}")

    def search(self, query: str, user_id: str, limit: int = 5, category: Optional[str] = None) -> List[Dict[str, Any]]:
        """Search for similar text segments scoped to a specific user."""
        try:
            query_emb = self.embedding_fn.encode_queries([query])[0]
            formatted_results = []

            if self.provider == "pinecone" and self.pinecone_index:
                filter_dict = {"user_id": user_id}
                if category:
                    filter_dict["category"] = category
                
                results = self.pinecone_index.query(
                    vector=query_emb.tolist() if hasattr(query_emb, 'tolist') else query_emb,
                    top_k=limit,
                    include_metadata=True,
                    filter=filter_dict,
                    namespace="contracts"
                )
                
                for res in results["matches"]:
                    formatted_results.append({
                        "text": res["metadata"]["text"],
                        "metadata": res["metadata"],
                        "score": res["score"]
                    })

            elif self.collection:
                where_dict = {"user_id": user_id}
                if category:
                    where_dict["category"] = category

                results = self.collection.query(
                    query_embeddings=[query_emb],
                    n_results=limit,
                    where=where_dict
                )
                
                if results and results['documents']:
                    for i in range(len(results['documents'][0])):
                        formatted_results.append({
                            "text": results['documents'][0][i],
                            "metadata": results['metadatas'][0][i],
                            "score": 1 - results['distances'][0][i] if 'distances' in results else None
                        })

            return formatted_results
        except Exception as e:
            print(f"❌ Search Error: {e}")
            return []

# Singleton instance
vector_store = VectorStoreManager()
