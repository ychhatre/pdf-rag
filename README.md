# RAG Chatbot

A **Retrieval-Augmented Generation (RAG)** chatbot that lets users upload PDFs and then query the contents in a conversational manner. The bot uses **LangChain**, **Pinecone** for vector storage, **OpenAI** for LLM embeddings/chat, a **FastAPI** backend, and a **Next.js** (React) frontend. Chat sessions are persisted in **Firebase**, so users can revisit old conversations.

## Features

1. **Upload PDFs**  
   - Users can upload PDF documents from the frontend (Next.js).  
   - The PDFs are chunked, embedded, and stored in **Pinecone** for retrieval.

2. **Conversational Memory**  
   - Each chat session uses **LangChain**’s `ConversationBufferMemory` for context-aware conversation.  
   - The bot can answer follow-up questions using the same context.

3. **Multiple Chat Sessions**  
   - Each chat is assigned a unique `chatId`.  
   - Users can share links to rejoin specific chats or for others to view them.

4. **Firebase Integration**   
   - Conversation logs (user messages, assistant answers) can be stored in **Firestore** for persistence.  
   - When a user revisits a chat, it loads historical messages from Firestore.

5. **LocalStorage for “My Chats”**  
   - The frontend also uses localStorage to track which `chatId`s the user has visited.  
   - A “My Chats” list on the homepage helps users re-open recent or saved chats.

6. **Hosting**  
   - **Frontend**: Deployed on **Vercel**.  
   - **Backend**: Hosted on **Heroku**.  
   - The frontend fetches data from the backend’s URL.

## Tech Stack

- **Next.js (React)** for the frontend UI.  
- **Python** + **FastAPI** for backend APIs.  
- **LangChain** for orchestrating the RAG logic, memory, and chaining.  
- **OpenAI** for GPT-3.5 (or GPT-4) embeddings and text generation.  
- **Pinecone** as a vector database for storing document embeddings.  
- **Firebase** (Firestore) to store user queries and assistant responses.  
- **LocalStorage** for local session management and chat indexing.

## Usage Instructions

1. **Clone the Repo & Install Dependencies**
   ```bash
   git clone https://github.com/<YourUser>/<YourRepo>.git
   cd <YourRepo>
### Backend (FastAPI)
1. **Go to server/**
   ```bash
   cd server/
2. **Create a `.env` file**
   ```dotenv
   OPENAI_API_KEY=sk-xxxx
   PINECONE_API_KEY=xxxx
   PINECONE_ENVIRONMENT=us-east-1
   PINECONE_INDEX_NAME=xxxxx
   SERVICE_ACCOUNT_KEY_BASE64=xxxx
3. **Install Dependencies**
   ```bash
   pip install -r requirements.txt 
4. **Run Locally**
   ```
   uvicorn main:app --reload
### Frontend (Next.js)
1. **Go to client/**
   ```bash
   cd client/
2. **Install Dependencies**
   ```bash
   npm install 
3. **Run Locally**
   ```bash
   npm run dev
## Architecture Diagram
[Architecture Diagram](https://excalidraw.com/#json=GbGL04CaAd1rsoX_pZLR9,YWFUqCJy4WbddYC-jq5wEg)
## Demo Video
[Click here to watch the demo video](https://www.loom.com/share/ac96707e1fa34a07b02bbc7a0ca450b7?sid=2974bd14-c6b5-44ad-8d6d-6bcdd600989d)
## Live Demo 
[Click here to interact with the live demo](https://pdf-rag-cl6t.vercel.app/)

## Significant Dependencies

- **LangChain**: Orchestrates the retrieval + LLM calls with memory.
- **OpenAI**: Embeddings and chat completions.
- **Pinecone**: Vector storage for the PDF embeddings.
- **Firebase (Firestore)**: Optional conversation storage for multi-session or multi-user.
- **FastAPI**: Backend framework for endpoints.
- **Next.js**: React-based frontend with SSR capabilities.
- **LocalStorage**: Basic user-level storage for “My Chats.”

**Feel free to customize** this `README.md` for your specific environment details, including additional instructions or removing sections you don’t need. Add your actual architecture diagram in place of the placeholder. 

Enjoy your RAG Chatbot!