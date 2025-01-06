from firebase_admin import firestore
from .db import db
COLLECTION_NAME = "chats"

def create_chat_session_in_firestore(chat_id: str):
    """
    Initialize a chat document in Firestore.
    """
    chat_doc = {
        "chat_id": chat_id,
        "messages": [],  # empty at the start
        "createdAt": firestore.SERVER_TIMESTAMP,
        "updatedAt": firestore.SERVER_TIMESTAMP
    }
    db.collection(COLLECTION_NAME).document(chat_id).set(chat_doc)

def append_message_to_firestore(chat_id: str, role: str, content: str, sources=None):
    """
    Append a single message (user or assistant) to the chat in Firestore.
    """
    chat_ref = db.collection(COLLECTION_NAME).document(chat_id)
    update_data = {
        "messages": firestore.ArrayUnion([{
            "role": role,
            "content": content,
            "sources": sources or []
        }]),
        "updatedAt": firestore.SERVER_TIMESTAMP
    }
    chat_ref.update(update_data)

def load_chat_messages_from_firestore(chat_id: str):
    """
    Return the chat messages array from Firestore so we can rebuild memory if needed.
    """
    chat_ref = db.collection(COLLECTION_NAME).document(chat_id).get()
    if chat_ref.exists:
        data = chat_ref.to_dict()
        return data.get("messages", [])
    return []
