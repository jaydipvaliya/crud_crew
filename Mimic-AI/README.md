# Digital Clone 🧬💬

> An AI agent trained on your own chat history that replies the way you would.

Built for **Track 1: Build Your Own Digital Clone**. Upload your exported WhatsApp chat, and get a bot that replies to new messages in your own tone, phrasing, length, and emoji style — live, in real time, on messages it's never seen before.

---

## What This Is

This is not a generic chatbot demo. Digital Clone:

1. Takes a real WhatsApp chat export (`.txt`)
2. Parses it into `(incoming message → your actual reply)` pairs
3. Uses those pairs as few-shot examples for a locally-run LLM
4. Generates new replies to unseen messages that sound like *you*

**Success bar:** someone other than the builder — a teammate, friend, or judge — should be able to open the app, upload their own export, and get a working clone. Not just on our data. Not just on our laptop.

---

## Quick Start

### Prerequisites
- [Ollama](https://ollama.com) installed locally
- Node.js / Python (adjust based on your final stack)
- A WhatsApp chat export (see [Exporting Your Chat](#exporting-your-chat) below)

### Setup

**One-command setup (recommended):**
```bash
git clone <repo-url>
cd digital-clone
cp .env.example .env
./scripts/setup.sh
```
`setup.sh` installs backend + frontend dependencies and pulls the default Ollama model.

**Manual setup:**
```bash
# Backend
cd backend
[pip install -r requirements.txt / npm install]
ollama pull llama3.2:3b

# Frontend
cd ../frontend
npm install
```

### Run
```bash
# Backend (from /backend)
[python app.py / node server.js]

# Frontend (from /frontend)
npm run dev
```

Then open `http://localhost:PORT` in your browser.

### Exporting Your Chat
1. Open WhatsApp on your phone
2. Go to a chat → **Settings → Chat → Export Chat**
3. Choose **"Without Media"**
4. Save/send the resulting `.txt` file to yourself
5. Upload it in the app

---

## How It Works

```
[Upload .txt export]
        ↓
[Parser] → cleans and extracts (incoming → reply) pairs
        ↓
[Style Profile Builder] → few-shot examples + tone summary
        ↓
[Local LLM via Ollama] ← new incoming message
        ↓
[Generated reply, in your voice]
```

- **Parsing:** Strips system messages, media placeholders, and deleted-message noise; groups multi-line messages correctly.
- **Style profiling:** Builds a short natural-language description of tone, typical phrase patterns, message length, formality, and emoji habits, plus a set of real example replies.
- **Generation:** Feeds the style profile + few-shot examples + new incoming message into a locally-running model (no cloud calls, no API key).

---

## Tech Stack

| Layer | Choice |
|---|---|
| Local LLM runtime | [Ollama](https://ollama.com) |
| Model (default) | Llama 3.2 3B *(swap for Phi-3-mini, Gemma 2, or Mistral 7B depending on hardware)* |
| Backend | *[fill in: Node/Express, Python/FastAPI, etc.]* |
| Frontend | *[fill in: React, plain HTML/JS, etc.]* |
| Parsing | Custom WhatsApp export parser (see `backend/parser/`) |
| Style profiling | See `backend/style_profile/` |
| Prompting / Ollama integration | See `backend/llm/` |

> Stretch: [Unsloth](https://github.com/unslothai/unsloth) for optional LoRA fine-tuning on a free Colab T4 GPU, compared side-by-side against the prompted version.

---

## Project Structure

```
digital-clone/
├── README.md                    # setup steps + how to run (judges will read this)
├── .env.example
├── .gitignore
│
├── backend/
│   ├── parser/                  # FR2/FR3 - .txt parsing, cleaning, pairing
│   │   └── sample_data/         # a few test exports for dev (not real personal data)
│   ├── style_profile/           # FR4 - few-shot builder, tone summary
│   ├── llm/                     # FR5 - Ollama integration + prompt templates
│   └── app.py / server.js       # API entrypoint
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── UploadScreen/    # FR1
│   │   │   └── ChatUI/          # FR7
│   │   └── App.jsx
│   └── public/
│
├── training/                    # ONLY if attempting SR4 fine-tuning stretch
│   └── notebook.ipynb           # Colab + Unsloth
│
├── docs/
│   ├── PRD.md                   # Full product requirements
│   ├── business_case.md         # one-liner + why it matters
│   └── demo_script.md           # rehearsed fallback plan, talking points
│
└── scripts/
    └── setup.sh                 # installs deps, pulls Ollama model, one command to run
```

---

## Documentation

- [`docs/PRD.md`](docs/PRD.md) — full product requirements
- [`docs/business_case.md`](docs/business_case.md) — one-liner + why this matters, for judges
- [`docs/demo_script.md`](docs/demo_script.md) — rehearsed demo flow + fallback plan if the live demo hits an issue

---

## Environment Variables

Copy `.env.example` to `.env` and fill in as needed (e.g., Ollama host/port, default model name, backend port). No cloud API keys are required for the core (non-fine-tuned) path.

---

## Demo Flow (Live Judging)

1. A judge/outsider uploads **their own** chat export.
2. The app parses it and builds a style profile — no manual setup required.
3. The judge types a brand-new message the bot has never seen.
4. The bot replies in real time, in the judge's own style.

---

## ⚠️ Ground Rules — Responsible Use

This project touches real, private conversations. These rules are non-negotiable:

- ✅ Only use chat exports from **your own** phone/account.
- ✅ The bot imitates **you only** — never the other party in a conversation.
- ✅ Get informal consent from anyone whose messages will be visible on screen during a demo.
- 🚫 This is a **sandboxed demo**. It is never connected to real, live incoming WhatsApp messages.
- ✅ Any data shown publicly on stage is data the presenter is comfortable sharing publicly.

---

## Roadmap / Stretch Goals

- [ ] Contact-aware tone adjustment (different style per person/thread)
- [ ] Simulated response delay for realism
- [ ] Email export support as a second data source
- [ ] Fine-tuned model (Unsloth/LoRA) vs. prompted model comparison — see `training/notebook.ipynb`

---

## Team

| Role | Owner |
|---|---|
| Data & Parsing | *[name]* |
| Model / AI | *[name]* |
| App / Frontend | *[name]* |
| Integration & Demo | *[name]* |

---

## License

*[Add license, e.g., MIT — or note this is hackathon/demo-only code, not for production use.]*