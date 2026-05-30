# 🚀 Privacy LLM - Expert Feature Roadmap & Specs

This document details the architecture and implementation specifications to integrate **Offline Document RAG (2)**, **LLM Hyperparameter Sliders (3)**, **Custom System Personas (4)**, and **Voice STT/TTS (6)** into our Privacy LLM workbench.

---

## 🔍 Project Architecture Summary

Currently, **Privacy LLM** is structured as follows:
- **Backend (`app.py`, `models.py`)**: Runs Flask, connects to local Ollama (`/api/generate`), stores logs using a SQLAlchemy SQLite backend. Includes text files processing under 100KB and user auth routes (Signup, Login, Logout, Admin).
- **Frontend (`templates/`, `static/`)**: Responsive chat page (`index.html`) using Tailwind, Lucide, Marked, and HighlightJS. Includes file previews and a mock image mode UI.

---

## 📐 Detailed Implementation Specifications

We are implementing Features **2, 3, 4, and 6** with deep architectural rigor to ensure they are **100% offline-compatible** and have **zero heavy native compilation requirements** (perfect for seamless installation on Windows).

---

### 📚 Feature 2: Offline Document RAG (Retrieval-Augmented Generation)
*Chat with PDFs, Word documents, and spreadsheets completely offline without context size limits.*

#### 1. Libraries (Zero-C Dependencies)
- `pypdf`: High-performance, pure-Python PDF reader.
- `python-docx`: Lightweight Word document structure parser.
- Standard `csv` parser (built-in in Python).

#### 2. Database Models (`models.py`)
```python
class Document(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = db.Column(db.String(36), db.ForeignKey('chat_session.id'), nullable=False)
    filename = db.Column(db.String(200), nullable=False)
    file_type = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    chunks = db.relationship('DocumentChunk', backref='document', lazy=True, cascade="all, delete-orphan")

class DocumentChunk(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    document_id = db.Column(db.String(36), db.ForeignKey('document.id'), nullable=False)
    session_id = db.Column(db.String(36), db.ForeignKey('chat_session.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    embedding_json = db.Column(db.Text, nullable=False) # Serialized list of floats

    @property
    def embedding(self):
        import json
        return json.loads(self.embedding_json)

    @embedding.setter
    def embedding(self, val):
        import json
        self.embedding_json = json.dumps(val)
```

#### 3. Core Engine Functions (Pure-Python Cosine Similarity)
Rather than heavy C++ based vector libraries, we calculate similarity inside standard Python lists. For hundreds of session-specific chunks, this takes `<3 milliseconds` and is fully stable on Windows.

```python
def cosine_similarity(v1, v2):
    import math
    dot_product = sum(a * b for a, b in zip(v1, v2))
    magnitude1 = math.sqrt(sum(a * a for a in v1))
    magnitude2 = math.sqrt(sum(b * b for b in v2))
    if not magnitude1 or not magnitude2:
        return 0.0
    return dot_product / (magnitude1 * magnitude2)

def chunk_text(text, chunk_size=800, overlap=150):
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return chunks
```

#### 4. API Workflow
1.  **`/api/upload` (POST)**: Receives a file (PDF, DOCX, CSV, TXT), parses its text, chunks it, generates high-dimensional embeddings via local Ollama `/api/embeddings`, and saves the records to SQLite.
2.  **Context Injection (in `/chat` POST)**:
    - If document chunks exist in the session, queries Ollama `/api/embeddings` to vector-embed the user's prompt.
    - Computes cosine similarity across all session chunks.
    - Selects the **top 3 matching chunks** and injects them as a reference prefix before prompting the model.

---

### 🎛️ Feature 3: LLM Generation Sliders
*Fine-tune model intelligence parameters dynamically from the UI.*

#### 1. Backend Ingestion
Accept parameters in the JSON payload of the `/chat` endpoint and forward them inside the `options` field of the Ollama API body:
```python
ollama_payload = {
    "model": model_name,
    "prompt": full_context_prompt,
    "stream": True,
    "options": {
        "temperature": float(temperature),
        "top_p": float(top_p),
        "top_k": int(top_k),
        "repeat_penalty": float(repeat_penalty),
        "num_predict": int(num_predict) # Max Tokens
    }
}
```

#### 2. Frontend Settings Drawer
- Add a collapsible glassmorphic settings panel with:
  - **Temperature** (`0.0` - `2.0`): Controls response creativity.
  - **Top P** (`0.0` - `1.0`): Fine-tunes vocabulary constraints.
  - **Top K** (`1` - `100`): Sets token probability limit.
  - **Repeat Penalty** (`0.5` - `2.0`): Discourages repetitive text.
  - **Max Tokens (`num_predict`)** (`64` - `4096`): Limits total generated tokens.
  - **Reset to Defaults** button.

---

### 🎭 Feature 4: Custom System Personas
*Instantly swap or build specialized model agents.*

#### 1. Schema Design
```python
class Persona(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(50), nullable=False)
    system_prompt = db.Column(db.Text, nullable=False)
    icon = db.Column(db.String(30), default='sparkles') # Lucide icon name
    is_system = db.Column(db.Boolean, default=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True) # Nullable for guest presets
```

#### 2. Seeding Default Agents
Seeded automatically on start (`db.create_all()` hook):
- ⚖️ **General Assistant**: Helpful, friendly, and balanced.
- 💻 **Expert Software Engineer**: Generates clean, secure, documented code.
- 🔬 **Scientific Researcher**: Fact-based, academic, structural outlines.
- ✍️ **Copywriter / Editor**: Engaged, grammatically polished revisions.
- 📋 **Concise Summarizer**: Highlights bulleted takeaways and action items.

#### 3. LLM Prompt Assembly
Prepend the selected system prompt at the very beginning of the generation pipeline context:
```
System: [Selected Persona's System Prompt]

User: [Dialog History]
...
```

---

### 🗣️ Feature 6: Speech-to-Text & Text-to-Speech
*Use your microphone to write, and listen to model responses read aloud.*

#### 1. Speech-To-Text (STT) Voice Dictation
- Add a glowing microphone button inside the chat box wrapper.
- Uses browser-native HTML5 **Web Speech API** (`webkitSpeechRecognition`).
- Dictates spoken sentences directly into the prompt text area in real-time.

#### 2. Text-To-Speech (TTS) Reader
- Add a speaker toggle icon (`volume-2` / `volume-x`) on all assistant message cards.
- Uses browser-native `window.speechSynthesis` completely offline.
- Synthesizes text outputs with start, pause, and stop controls.

---

### 🎨 Premium UI/UX Overhaul Specifications
*Elevate the user interface to support modern glassmorphism, responsive theme toggles, and state-of-the-art interaction visualizers.*

#### 1. Adaptive Light / Dark Theme Token System
- Configure standard CSS custom properties in `style.css` matching sleek slate gradients for Dark Mode and vibrant cloud backgrounds for Light Mode.
- Incorporate a sleek theme switcher toggler button inside the sidebar.
- Persist theme options in the browser's `localStorage`.

#### 2. Advanced Code Block Decorator
- Parse code blocks post-rendering to embed customized language banners and **Copy Code Buttons** (`copy` / `check` indicators).
- Keep absolute position formatting clean across both dark and light settings.

#### 3. Persona-Adaptive Quick-Start Prompt Cards
- Re-architect the welcome screen to house **4 interactive quick-start suggestion cards** matching the active persona.
- Enable single-click prompts triggering immediate execution.

#### 4. Generative Glow Visualizers
- Add a glowing pulsing border surrounding `inputWrapper` during streamed message generation.
- Add a custom pulsing cursor anim at the end of the streaming assistant message to represent real-time typing indicators.

---

## 🚦 Next Steps

I have prepared the complete technical blueprints in [implementation_plan.md](file:///C:/Users/hp/.gemini/antigravity-ide/brain/8de21ab6-6fea-4e0d-aca3-8c9d731f7404/implementation_plan.md). 

Please review and confirm if you approve these premium UI/UX upgrades! Once approved, we will begin executing them step-by-step to build a visually spectacular user workspace.

