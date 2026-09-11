# localllm

Offline chat UI for local [Ollama](https://ollama.com) models. Flask backend, saved sessions, and history that stays on your machine.

No cloud API key. Point it at `ollama serve` and talk to whatever you have pulled.

## What it does

- Chat with any local Ollama model
- Keep sessions and messages in SQLite
- Optional accounts (guests can still chat)
- Personas and document uploads for extra context (PDF and Word)

## Run

```bash
ollama serve
ollama pull gemma3:1b
pip install -r requirements.txt
python app.py
```

Open http://localhost:5000

Default model is `gemma3:1b`. Change `DEFAULT_MODEL` in `app.py` if you want something else.

## Layout

```
app.py           Flask app, Ollama proxy, auth
models.py        users, sessions, messages, personas, documents
templates/       home, chat, login, admin
static/          JS and CSS
```
