# Working video
[Watch Demo Video](https://drive.google.com/file/d/1D7i5rNfzA6_YJJ-yp-eYNTOBISEDDr_e/view?usp=sharing)

# Note
I am using the paid version of OpenAI, which is why I chose these specific models (`gpt-5.1` and `claude-3`).
Moreover i added comments in both frontend and backend code for easy understanding.

# Refold-AI2 – Chatbot Flow Builder

This repo contains a small full-stack app for visually designing chatbot flows and using OpenAI to assist with copy, images, and flow generation.

- **Frontend**: React + TypeScript (Vite) flow builder using `@xyflow/react`.
- **Backend**: Node.js + Express + TypeScript + MongoDB, with OpenAI integration.

## Quick Start

1. **Backend**
   - `cd Backend`
   - Copy `.env.example` to `.env` and set:
     - `MONGODB_URI` – MongoDB connection string
     - `OPENAI_API_KEY` – OpenAI API key
     - (optional) `OPENAI_MODEL`, `OPENAI_IMAGE_MODEL`, `PORT`, `CORS_ORIGIN`
   - Install deps: `npm install`
   - Run dev: `npm run dev`

2. **Frontend**
   - `cd Frontend`
   - Create `.env` (or `.env.local`) with:
     - `VITE_API_BASE_URL=http://localhost:4000` (or your backend URL)
   - Install deps: `npm install`
   - Run dev: `npm run dev`
   - Open `http://localhost:5173`

## Main Features

- Drag-and-drop, node-based chatbot flow builder.
- Node types: text, image, quick-reply buttons, conditional branching.
- Backend persistence of flows (create, list, open, update, delete).
- AI helpers:
  - Write node text with OpenAI.
  - Generate images.
  - Flow recommendations for the current graph.
  - Generate an entire flow from a natural-language brief, with strict graph validation.

For more details:
- Frontend docs: `Frontend/Readme.md`
- Backend docs: `Backend/Readme.md`

## Short Technical Write-up

**Question**  
Short Technical Write-up (Max 200 Words): Explain what AI model(s) you used, why you chose them, how AI is used in your app, and the basic architecture and major components.

**Answer**  
Our app uses OpenAI’s `gpt-4o-mini` for text and structured graph generation, and `gpt-image-1` for image generation. We chose `gpt-4o-mini` because it offers strong reasoning with low latency and cost, which is critical for interactive flow editing, and `gpt-image-1` to generate on-brand visual assets directly from prompts.  
AI powers four main features: (1) improving existing chatbot flows with JSON-formatted recommendations, (2) generating entire flow graphs from a brief with a validation/retry loop, (3) writing chatbot copy for messages and quick replies, and (4) creating illustrative images for image nodes.  
The architecture is a React + TypeScript + Vite frontend using `@xyflow/react` for visual flow editing, talking to a Node.js + Express + TypeScript backend. The backend stores flows in MongoDB, validates graph structure, and exposes REST endpoints that wrap the OpenAI SDK. Frontend and backend share flow types and validation rules so AI-generated graphs are always checked before being saved or rendered.

