# 🤖 Offline Ollama LLM Chat Interface

A complete offline Flask-based web application that connects to your local Ollama LLM instance with automatic chat history storage.

## 📋 Features

✅ **Offline-First**: Works completely offline using local Ollama instance  
✅ **Flask Backend**: REST API with comprehensive error handling  
✅ **Chat History**: Automatic JSON storage of all conversations  
✅ **Modern UI**: Clean, responsive interface with real-time updates  
✅ **Model Selection**: Switch between different Ollama models  
✅ **Error Handling**: Graceful handling of connection issues and errors  
✅ **Auto-Save**: Every conversation is automatically saved to JSON

## 🏗️ Project Structure

```
localllm/
├── app.py                  # Flask backend server
├── requirements.txt        # Python dependencies
├── chat_history.json       # Auto-created chat history storage
├── README.md              # This file
├── templates/
│   └── index.html         # Main chat interface
└── static/
    ├── script.js          # Frontend JavaScript logic
    └── style.css          # Styling and animations
```

## 📦 Architecture

### Backend (Flask)
- **`/` (GET)**: Serves the chat interface
- **`/chat` (POST)**: Main chat endpoint
  - Accepts: `{"prompt": "user message", "model": "llama3"}`
  - Returns: `{"reply": "AI response", "model": "llama3", "timestamp": "..."}`
- **`/history` (GET)**: Retrieves all chat history

### Chat History Format
```json
[
  {
    "timestamp": "2025-12-27 17:58:00",
    "user": "Hello!",
    "model": "llama3",
    "assistant": "Hi! How can I help you?"
  }
]
```

### Error Handling
- Ollama not running → 503 Service Unavailable
- Model not found → 404 Not Found with pull instructions
- Empty prompt → 400 Bad Request
- Connection timeout → 504 Gateway Timeout
- Corrupted JSON → Auto-backup and create new file

## 🚀 Setup Instructions

### Prerequisites
- Python 3.8 or higher
- Ollama installed on your system

### Step 1: Install Ollama

**Windows:**
```powershell
# Download from: https://ollama.ai/download
# Or use winget:
winget install Ollama.Ollama
```

**macOS:**
```bash
brew install ollama
```

**Linux:**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

### Step 2: Start Ollama Service

```bash
# Start Ollama service (runs in background)
ollama serve
```

Leave this terminal running, or run as a system service.

### Step 3: Pull an LLM Model

```bash
# Pull the default model (llama3)
ollama pull llama3

# Or try other models:
ollama pull llama2
ollama pull mistral
ollama pull codellama
ollama pull phi
```

### Step 4: Install Python Dependencies

```bash
# Navigate to project directory
cd r:\localllm

# Install dependencies
pip install -r requirements.txt
```

### Step 5: Start Flask Server

```bash
# Run the Flask application
python app.py
```

You should see:
```
==================================================
Ollama Chat Interface Server
==================================================
Server starting...
Using model: llama3
Chat history file: chat_history.json
Ollama API: http://localhost:11434/api/generate
==================================================
 * Running on http://0.0.0.0:5000
```

### Step 6: Access the Interface

Open your web browser and navigate to:
```
http://localhost:5000
```

## 💡 Usage

1. **Select Model**: Choose your preferred Ollama model from the dropdown
2. **Type Message**: Enter your prompt in the input field
3. **Send**: Click "Send" or press Enter
4. **View Response**: AI response appears in the chat window
5. **History**: All conversations are automatically saved to `chat_history.json`

## 🔧 Configuration

Edit `app.py` to customize:

```python
# Change Ollama API URL
OLLAMA_API_URL = "http://localhost:11434/api/generate"

# Change default model
DEFAULT_MODEL = "llama3"

# Change history file name
CHAT_HISTORY_FILE = "chat_history.json"

# Change server port
app.run(host='0.0.0.0', port=5000, debug=True)
```

## 🐛 Troubleshooting

### Error: "Cannot connect to Ollama"
**Solution**: Make sure Ollama is running
```bash
ollama serve
```

### Error: "Model 'llama3' not found"
**Solution**: Pull the model first
```bash
ollama pull llama3
```

### Error: "Chat history corrupted"
**Solution**: The app automatically backs up corrupted files and creates a new one. Check for `chat_history_backup_*.json` files.

### Slow Responses
- Larger models take longer to respond
- First response is slower (model loading)
- Try a smaller model like `phi` for faster responses

### Port Already in Use
**Solution**: Change the port in `app.py`:
```python
app.run(host='0.0.0.0', port=5001, debug=True)
```

## 📊 Viewing Chat History

### Method 1: Direct File Access
Open `chat_history.json` in any text editor

### Method 2: API Endpoint
```bash
curl http://localhost:5000/history
```

### Method 3: Python Script
```python
import json

with open('chat_history.json', 'r') as f:
    history = json.load(f)
    for entry in history:
        print(f"{entry['timestamp']} - User: {entry['user']}")
        print(f"AI ({entry['model']}): {entry['assistant']}\n")
```

## 🔒 Security Notes

- This is designed for **local use only**
- No authentication implemented
- Don't expose to public internet without adding security
- All data stays on your machine (100% offline)

## 📝 Available Models

Popular Ollama models you can use:
- `llama3` - Meta's latest LLM (recommended)
- `llama2` - Previous generation
- `mistral` - Fast and efficient
- `codellama` - Specialized for coding
- `phi` - Small and fast
- `gemma` - Google's LLM
- `neural-chat` - Intel's model

Pull any model with:
```bash
ollama pull <model-name>
```

## 🎨 Customization

### Change Color Scheme
Edit `static/style.css`:
```css
/* Change gradient colors */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Add Custom Models
Edit `templates/index.html`:
```html
<select id="modelSelect">
    <option value="llama3">llama3</option>
    <option value="your-model">Your Custom Model</option>
</select>
```

## 📄 License

This project is free to use and modify for personal and commercial purposes.

## 🤝 Contributing

Feel free to:
- Report bugs
- Suggest features
- Submit improvements

## ✨ Credits

Built with:
- **Flask** - Python web framework
- **Ollama** - Local LLM runner
- **Vanilla JavaScript** - No frameworks needed
- **Modern CSS** - Gradient designs and animations

---

**Made with ❤️ for offline AI enthusiasts**
