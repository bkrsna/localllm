from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime
import uuid

db = SQLAlchemy()

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)

    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)

class ChatSession(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    title = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    messages = db.relationship('ChatMessage', backref='session', lazy=True, cascade="all, delete-orphan")
    
    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)

    # helper to get dict
    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "created_at": self.created_at.isoformat(),
            "messages": [m.to_dict() for m in self.messages]
        }

class ChatMessage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(36), db.ForeignKey('chat_session.id'), nullable=False)
    role = db.Column(db.String(20), nullable=False) # user, assistant
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    prompt_tokens = db.Column(db.Integer, nullable=True)
    eval_tokens = db.Column(db.Integer, nullable=True)

    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)

    def to_dict(self):
        return {
            "role": self.role,
            "content": self.content,
            "prompt_tokens": self.prompt_tokens,
            "eval_tokens": self.eval_tokens
        }

class Persona(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(50), nullable=False)
    system_prompt = db.Column(db.Text, nullable=False)
    icon = db.Column(db.String(30), default='sparkles') # Lucide icon name
    is_system = db.Column(db.Boolean, default=False)   # True for seeded templates
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True) # Null for system-wide presets

    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "system_prompt": self.system_prompt,
            "icon": self.icon,
            "is_system": self.is_system
        }

class Document(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = db.Column(db.String(36), db.ForeignKey('chat_session.id'), nullable=False)
    filename = db.Column(db.String(200), nullable=False)
    file_type = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    chunks = db.relationship('DocumentChunk', backref='document', lazy=True, cascade="all, delete-orphan")

    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)

    def to_dict(self):
        return {
            "id": self.id,
            "filename": self.filename,
            "file_type": self.file_type,
            "created_at": self.created_at.isoformat()
        }

class DocumentChunk(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    document_id = db.Column(db.String(36), db.ForeignKey('document.id'), nullable=False)
    session_id = db.Column(db.String(36), db.ForeignKey('chat_session.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    embedding_json = db.Column(db.Text, nullable=False) # Serialized list of floats

    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)

    @property
    def embedding(self):
        import json
        return json.loads(self.embedding_json)

    @embedding.setter
    def embedding(self, val):
        import json
        self.embedding_json = json.dumps(val)
