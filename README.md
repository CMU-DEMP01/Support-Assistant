# 🤖 AI Support Assistant 

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=white)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Lucide Icons](https://img.shields.io/badge/Icons-Lucide-000000?style=flat&logo=lucide&logoColor=white)](https://lucide.dev/)
[![Streaming API](https://img.shields.io/badge/API-Streaming-blue?style=flat)]()
[![Qdrant](https://img.shields.io/badge/VectorDB-Qdrant-FF6F61?style=flat&logo=qdrant&logoColor=white)](https://qdrant.tech/)
[![Gemini API](https://img.shields.io/badge/AI-Gemini-4285F4?style=flat&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)

A **floating AI-powered hybrid chatbot assistant widget** for modern web apps.  
This component allows users to **upload PDFs, ingest URLs, and chat with an AI assistant**. Designed as a **bottom-right expandable widget**, it delivers a **seamless support experience** similar to Intercom/Drift but powered by your own AI stack.

---

## 📽️ Demo Video  
[▶ Watch Demo](./https://github.com/CMU-DEMP01/Support-Assistant/blob/main/assistant-support.mp4)
![App Screenshot](https://github.com/CMU-DEMP01/cmu-recaptcha/raw/master/pages/screenshot1.png)


---

## ✨ Features

- 📂 **Document ingestion** – Upload PDFs or enter URLs for knowledge ingestion.  
- 🔎 **Contextual AI chat** – Ask questions with responses grounded in uploaded documents.  
- 🎨 **Modern UI** – Built with **TailwindCSS + Lucide icons**.  
- ⚡ **Streaming responses** – Real-time token-by-token assistant replies.  
- 🧭 **Floating widget** – Starts as a round **bot icon** → expands into full chat window.  
- 🎚️ **Animated upload panel** – Upload section auto-hides after ingestion.  
- 🛠️ **Expandable / Collapsible** – Open/close with a single click.  

---

## 🛠️ Tech Stack

| Layer                | Technology |
|-----------------------|------------|
| **Frontend**          | [Next.js 15](https://nextjs.org/), [React 18](https://react.dev/) |
| **Styling**           | [TailwindCSS](https://tailwindcss.com/), [Lucide React Icons](https://lucide.dev/) |
| **Backend API**       | Next.js API Routes (`/api/chat`, `/api/ingest`) |
| **AI Model Serving**  | [Gemini API](https://deepmind.google/technologies/gemini/), OpenAI/GPT (pluggable) |
| **Vector Database**   | [Qdrant](https://qdrant.tech/) for document embeddings |
| **Streaming**         | Native Web Streams API for token-by-token updates |

---

## 🚀 Getting Started

### 1️⃣ Clone repo
```bash
git clone https://github.com/yourusername/ai-chat-widget.git
cd ai-chat-widget
