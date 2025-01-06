import os
from pinecone import Pinecone, ServerlessSpec
from uuid import uuid4
from dotenv import load_dotenv

from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Pinecone as PineconeVectorStore
from langchain_community.chat_models import ChatOpenAI
from langchain.chains.conversational_retrieval.base import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter

load_dotenv()

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_ENV = os.getenv("PINECONE_ENVIRONMENT")
INDEX_NAME = os.getenv("PINECONE_INDEX_NAME")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

pc = Pinecone(api_key=PINECONE_API_KEY)
if INDEX_NAME not in pc.list_indexes().names(): 
        pc.create_index(
		name=INDEX_NAME,
		dimension=1536, 
		metric="cosine",
		spec=ServerlessSpec(cloud="aws", region="us-east-1")
	)
index = pc.Index(INDEX_NAME)
embedding = OpenAIEmbeddings(openai_api_key=OPENAI_API_KEY)

active_chats: dict[str, ConversationalRetrievalChain] = {}

def create_vector_store(file_path: str) -> PineconeVectorStore: 
        loader = PyPDFLoader(file_path)
        documents = loader.load()
        
        text_splitter = RecursiveCharacterTextSplitter(
		chunk_size=1000, 
		chunk_overlap=100
	)
        docs = text_splitter.split_documents(documents=documents)
        
        vec_store: PineconeVectorStore = PineconeVectorStore.from_documents(
		documents=docs, 
		embedding=embedding, 
		index_name=INDEX_NAME
	)
        return vec_store

def create_chat_session(vector_store=None): 
        chat_id = str(uuid4())
        if vector_store is None: 
                vector_store = PineconeVectorStore(
                    index, embedding.embed_query, INDEX_NAME
                )
        retriever = vector_store.as_retriever(search_kwargs={"k": 3})
        
        memory = ConversationBufferMemory(
			memory_key="chat_history",
			return_messages=True,
			output_key='answer'
		)
        
        llm = ChatOpenAI(
			openai_api_key=OPENAI_API_KEY,
			model_name="gpt-3.5-turbo",
			temperature=0.0
		)
        
        chain = ConversationalRetrievalChain.from_llm(
			llm=llm, 
			retriever=retriever,
			memory=memory,
			return_source_documents=True,
		)
        active_chats[chat_id] = chain
        
        return chat_id

def answer_question(chat_id: str, question: str): 
        if chat_id not in active_chats: 
                raise ValueError("Chat session not found.")
        
        chain = active_chats[chat_id]
        result = chain({
			"question": question
		})

        answer = result['answer']
        source_docs = result['source_documents']
        
        sources = []
        for doc in source_docs: 
                src = doc.metadata.get("source", "Unknown Source")
                page = doc.metadata.get("page", "?")
                sources.append(f"{src} (page {page})")
        return {
			"answer": answer, 
			"sources": sources
		}