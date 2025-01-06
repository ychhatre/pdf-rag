import firebase_admin 
from firebase_admin import credentials, firestore

credential = credentials.Certificate("./service-account-key.json")
firebase_admin.initialize_app(credential=credential)

db = firestore.client()

