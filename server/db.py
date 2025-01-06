import firebase_admin 
from firebase_admin import credentials, firestore
import os
import base64
import json 
encoded_key = os.getenv("SERVICE_ACCOUNT_KEY_BASE64")

if encoded_key: 
        decoded_key = base64.b64decode(encoded_key).decode('utf-8')
        cert = json.loads(decoded_key)
        credential = credentials.Certificate(cert)
else: 
        raise ValueError("SERVICE_ACCOUNT_KEY_BASE64 not found in environment variables.") 
if not firebase_admin._apps:
        firebase_admin.initialize_app(credential=credential)

db = firestore.client()

