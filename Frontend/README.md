# Frontend – Chatbot Flow Builder (React)

This is the React + TypeScript frontend for the chatbot flow builder. It uses `@xyflow/react` (React Flow v12) to visually design chatbot flows and talk to the backend for persistence and AI‑powered helpers.

## Tech Stack

- React + TypeScript + Vite
- `@xyflow/react` (React Flow v12)
- Plain CSS (`layout.css`, `panels.css`, `nodes.css`)

## Setup

1. `cd Frontend`
2. Install dependencies:
   - `npm install`
3. Configure API base URL (optional; defaults to `http://localhost:4000`):
   - Create `.env` or `.env.local`:
     - `VITE_API_BASE_URL=http://localhost:4000`
4. Run dev server:
   - `npm run dev`
5. Open: `http://localhost:5173`

## Features

- Drag & drop nodes onto a canvas (text, image, quick‑reply button, conditional).
- Connect nodes with edges; per‑type connection rules enforced in the UI.
- Node editing via a right‑side settings panel.
- Flow validation before saving (mirrors backend rules).
- Backend persistence:
  - Create / update flows with “Save Changes”.
  - List all flows, open one, or delete from the “Saved flows” dialog.
- AI helpers (via backend):
  - “Let AI write this” for text and button nodes (`/api/ai/write-text`).
  - “Generate image with AI” for image nodes (`/api/ai/generate-image`).
  - “AI flow tips” for recommendations on the current graph (`/api/ai/flow-recommendations`).
  - “AI generate full flow” button (in Nodes panel) to create a new flow from a brief (`/api/ai/generate-flow-from-brief`).
- Responsive layout:
  - Collapsible sidebar on small screens.
  - Header buttons wrap and shrink on narrow viewports.

## Key Files

- `src/components/FlowBuilder.tsx` – main canvas, node registry, DnD, connection rules, header actions.
- `src/components/nodes/*.tsx` – implementations for Text, Image, Button, Conditional nodes.
- `src/components/panels/NodesPanel.tsx` – node palette + “AI generate full flow” button.
- `src/components/panels/SettingsPanel.tsx` – per‑type settings and AI actions.
- `src/components/SaveButton.tsx` – validates the current flow and persists it via backend APIs.
- `src/hooks/useFlowValidation.ts` – frontend validation mirroring backend `flowValidation` rules.
- `src/types/flow.types.ts` – React Flow node/edge typings used across the app.
- `src/styles/layout.css` – app layout and responsive header/sidebar.
- `src/styles/panels.css` – header buttons, panels, and form controls.
- `src/styles/nodes.css` – visual styles for node cards and image previews.

## Connection & Validation Rules (frontend)

The frontend enforces the same structural rules the backend uses:

- No self‑loops (`source === target` is blocked).
- No bidirectional edges (if there is A→B, you cannot create B→A).
- No cycles (a new edge is refused if it would create a cycle).
- Text / Image nodes:
  - At most one outgoing edge.
  - Cannot use named `sourceHandle`.
- Button nodes:
  - Each button option (`value`) corresponds to a handle.
  - Each handle can have only one outgoing edge.
- Conditional nodes:
  - Outgoing edges must use `sourceHandle` `"true"` or `"false"`.

On save, additional validation is performed in the frontend and then re‑checked in the backend before writing.

## Extending the UI

To add a new node type:

1. Define its data in `src/types/flow.types.ts`.
2. Create a node component under `src/components/nodes/`.
3. Register it in `nodeTypes` inside `FlowBuilder.tsx`.
4. Add it to `availableNodes` in `NodesPanel.tsx`.
5. Add an editor branch in `SettingsPanel.tsx`.
6. Add sensible defaults in `onDrop` and mobile “fb-add-node” handler.

---

Made by Sagar Kapoor – sagarbadal70@gmail.com
*** End Patch`}/>
]})
