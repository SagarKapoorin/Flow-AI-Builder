# Refold-AI2 – Chatbot Flow Builder

This repo contains a small full‑stack app for visually designing chatbot flows and using OpenAI to assist with copy, images, and flow generation.

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

- Drag‑and‑drop node‑based chatbot flow builder.
- Node types: text, image, quick‑reply buttons, conditional branching.
- Backend persistence of flows (create, list, open, update, delete).
- AI helpers:
  - Write node text with OpenAI.
  - Generate images.
  - Flow recommendations for the current graph.
  - Generate an entire flow from a natural‑language brief, with strict graph validation.

For more details:
- Frontend docs: `Frontend/Readme.md`
- Backend docs: `Backend/Readme.md`
