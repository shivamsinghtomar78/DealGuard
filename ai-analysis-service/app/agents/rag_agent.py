from app.utils.llm_factory import get_llm
from langchain_core.prompts import ChatPromptTemplate
from app.utils.vector_store import vector_store
from typing import List, Dict, Any

class RAGAgent:
    """Agent to answer questions based on retrieved contract context (RAG)"""
    
    def __init__(self):
        self.llm = get_llm(temperature=0)
        
    def answer_question(self, query: str, user_id: str, limit: int = 5) -> Dict[str, Any]:
        """
        Retrieves relevant segments for the user and answers the query.
        """
        # Retrieve context
        search_results = vector_store.search(query, user_id, limit=limit)
        
        if not search_results:
            return {
                "answer": "I couldn't find any relevant clauses in your contract history to answer this question.",
                "sources": []
            }
            
        context_text = "\n\n".join([
            f"--- Source: {res['metadata'].get('contract_name')} ---\n{res['text']}" 
            for res in search_results
        ])
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are DealGuard's Elite Legal Analyst. 
            You are helping a user understand their contract history.
            
            Use the following retrieved contract segments to answer the user's question.
            If the context doesn't contain the answer, say that you don't have enough information in the contract history.
            
            Maintain a professional, expert, and protective tone.
            """),
            ("user", """
            Context from my contracts:
            {context}
            
            Question: {question}
            
            Answer concisely based ONLY on the provided context:
            """)
        ])
        
        chain = prompt | self.llm
        response = chain.invoke({
            "context": context_text,
            "question": query
        })
        
        return {
            "answer": response.content,
            "sources": [res['metadata'] for res in search_results]
        }
