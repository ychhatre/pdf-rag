from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os 
import shutil 

from chatbot import create_chat_session, create_vector_store, answer_question

app = FastAPI()
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/upload-pdf")
def upload_pdf(file: UploadFile = File(...)):
        try:
                file_location = os.path.join(UPLOAD_DIR, file.filename)

                with open(file_location, "wb") as buffer:
                    shutil.copyfileobj(file.file, buffer)

                # Create vectorstore from the uploaded PDF
                vectorstore = create_vector_store(file_location)

                # Create a new chat session that uses this vectorstore
                chat_id = create_chat_session(vector_store=vectorstore)

                return {"chat_id": chat_id, "status": "PDF indexed successfully"}
        except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))

@app.post("/new")
def new_chat(): 
        chat_id = create_chat_session()
        return {"chat_id": chat_id}

class AskQueryReq(BaseModel): 
        question: str
        
@app.post("/ask/{chat_id}")
def ask(chat_id: str, payload: AskQueryReq): 
        try: 
                result = answer_question(chat_id, payload.question)
                return {
			"response": result['answer'],
			"sources": result['sources']
		}
        except ValueError as e:
                raise HTTPException(status_code=404, detail=str(e))
        except Exception as e:
         	raise HTTPException(status_code=500, detail=str(e))