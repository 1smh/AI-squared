# 🧠 TruthCheck AI

An agentic AI verifier that detects hallucinations, misinformation, and logical errors across AI-generated content.

## 🚀 What It Does

TruthCheck AI takes an output from any large language model (ChatGPT, Claude, etc.) and runs it through a panel of expert agents — each with a unique perspective — to flag hallucinations, inconsistencies, safety issues, or unreadable complexity.

## 🤖 Agent Personas

These agents run in parallel, each reviewing the AI-generated response:

- 🧑‍💻 **Software Developer** – checks logic and code correctness
- 🧒 **Child** – evaluates clarity and simplicity  
- 🧠 **Philosopher** – checks reasoning and ethics
- 📰 **Investigative Journalist** – verifies facts and sources
- 🎓 **Domain Expert** – cross-checks technical correctness (topic-aware)
- 🧾 **Compliance Officer** – scans for legal, safety, or policy violations
- 🧹 **Clarity Editor** – rewrites dense text for accessibility

Each agent outputs a verdict (✅ / ⚠️ / ❌), commentary, and optionally revised text.

## 💡 Key Features

- 🔄 Agentic parallel verification
- 🔍 Fact and hallucination detection
- 🧭 Ethical and logical audit
- ✍️ Automatic simplification and rewriting
- 🧑‍⚖️ Model-agnostic input (works with any LLM output)
- 🔐 Privacy-first (user's API key stays local)

## 🛠️ Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: FastAPI or Node.js (async agent execution)
- **LLMs Used**: GMI-Cloud Deepseek
- **Hosting**: Local deployment
- **APIs**: Supports user-supplied keys for modularity

## 🎯 Use Cases

- Fact-checking content written by Deepseek
- Ensuring code snippets actually compile and work
- Simplifying dense or academic responses
- Preventing hallucinations in AI-driven apps or workflows
- Building AI trust in high-stakes domains (health, law, education)

## 🚀 Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📝 Development Status

- ✅ Frontend interface complete
- 🔄 Backend integration in progress
- 🔄 Agent implementation in progress
- 🔄 GMI-Cloud API integration pending

## 🔧 Configuration

The application will support user-supplied API keys for:
- GMI-Cloud Deepseek API
- Custom agent configurations
- Privacy-first local storage

---

Built for the South Bay Agent Hack 2025