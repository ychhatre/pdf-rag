import os
from pinecone import Pinecone 
from uuid import uuid4
from dotenv import load_dotenv

from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Pinecone as PineconeVectorStore
from langchain_community.chat_models import ChatOpenAI
from langchain.chains.conversational_retrieval.base import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter

from firebase import load_chat_messages_from_firestore, create_chat_session_in_firestore, append_message_to_firestore
load_dotenv()

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
INDEX_NAME = os.getenv("PINECONE_INDEX_NAME")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

pc = Pinecone(api_key=PINECONE_API_KEY)

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

def create_chain(vector_store=None, memory=None) -> ConversationalRetrievalChain: 
        if memory is None: 
                memory = ConversationBufferMemory(
				memory_key="chat_history",
				return_messages=True,
				output_key='answer'
			)
        if vector_store is None: 
                vector_store = PineconeVectorStore(
                    index, embedding.embed_query, INDEX_NAME
                )
        retriever = vector_store.as_retriever(search_kwargs={"k": 3})

        llm = ChatOpenAI(
			openai_api_key=OPENAI_API_KEY,
			model_name="gpt-3.5-turbo",
			temperature=0.0
		)
        chain = ConversationalRetrievalChain.from_llm(
			llm=llm, 
			retriever=retriever,
			memory=memory,
			return_source_documents=True
		)
        return chain 

def create_chat_session(vector_store=None): 
        chat_id = str(uuid4())
        active_chats[chat_id] = create_chain(vector_store=vector_store)
        create_chat_session_in_firestore(chat_id=chat_id)
        return chat_id

def answer_question(chat_id: str, question: str): 
        if chat_id in active_chats: 
                chain = active_chats[chat_id]
        else: 
                old_messages = load_chat_messages_from_firestore(chat_id)
                if old_messages: 
                        mem = preload_old_messages(chat_id)
                        chain = create_chain(memory=mem)
                        active_chats[chat_id] = chain
                else: 
                        raise ValueError("Chat ID not found in memory or Firestore.")

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
        append_message_to_firestore(chat_id=chat_id, role="user", content=question)
        append_message_to_firestore(chat_id=chat_id, role="assistant", content=answer)
        
        return {
			"answer": answer, 
			"sources": sources
		}

def preload_old_messages(chat_id: str) -> ConversationBufferMemory: 
        messages = load_chat_messages_from_firestore(chat_id=chat_id)
        memory = ConversationBufferMemory(return_messages=True)
        for message in messages: 
                role = message['role']
                content = message['content']
                if role == 'user': 
                        memory.chat_memory.add_user_message(content)
                else: 
                        memory.chat_memory.add_ai_message(content)
        return memory 