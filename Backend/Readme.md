# Backend – Chatbot Flow API (Node + Express)

This is the Node.js + Express + TypeScript backend for the chatbot flow builder. It stores flows in MongoDB and integrates with OpenAI for text, image, and flow‑generation features.

## Tech Stack

- Node.js + TypeScript
- Express
- MongoDB + Mongoose
- OpenAI SDK

## Setup

1. `cd Backend`
2. Copy `.env.example` to `.env` and set at least:
   - `MONGODB_URI` – MongoDB connection string
   - `OPENAI_API_KEY` – OpenAI API key
3. (Optional) override defaults:
   - `PORT` (default `4000`)
   - `OPENAI_MODEL` (default `gpt-4o-mini`)
   - `OPENAI_IMAGE_MODEL` (default `gpt-image-1`)
   - `CORS_ORIGIN` (default `http://localhost:5173`)
4. Install dependencies:
   - `npm install`
5. Run in dev mode:
   - `npm run dev`
6. Health check:
   - `GET http://localhost:4000/health` → `{ "status": "ok" }`

## Data Model & Validation

- A **Flow** consists of:
  - `nodes: AppNode[]` – typed nodes (`text`, `image`, `button`, `conditional`).
  - `edges: AppEdge[]` – directed connections between nodes.
- Mongo schema: see `src/models/Flow.ts`.
- Validation rules: implemented in `src/validation/flowValidation.ts` and enforced both:
  - In controllers (`createFlowHandler`, `updateFlowHandler`).
  - In AI helpers when generating flows from briefs.

Key rules (simplified):

- No self‑loops (edge `source === target` is invalid).
- No bidirectional pairs (if A→B exists, B→A is invalid).
- No cycles (graph must be a DAG).
- If there is more than one node, there must be exactly **one** entry node (indegree 0).
- Text/Image nodes:
  - At most one outgoing edge.
  - Cannot use named `sourceHandle`.
- Button nodes:
  - `data.buttons[].value` defines valid `sourceHandle` values.
  - Each outgoing edge from a button must use one of those values.
- Conditional nodes:
  - Outgoing edges must use `sourceHandle` `"true"` or `"false"` only.

## REST API

Base URL: `http://localhost:4000`

### Health

- `GET /health`
  - Returns `{ status: "ok" }` if the server is up.

### Flows

- `POST /api/flows`
  - Create a new flow.
  - Body: `{ name: string, description?: string, ownerId?: string, nodes: AppNode[], edges: AppEdge[] }`
  - Validates the flow; returns saved flow (with `id`).

- `GET /api/flows`
  - List flows with pagination.
  - Query: `page`, `pageSize`, `ownerId?`.
  - Response: `{ items, page, pageSize, total }`.

- `GET /api/flows/:id`
  - Get a single flow by id.
  - 404 if not found.

- `PUT /api/flows/:id`
  - Update an existing flow (same body schema as create).
  - Re‑validates the flow; returns updated flow or 404 if not found.

- `DELETE /api/flows/:id`
  - Soft‑deletes a flow by setting `deletedAt` (see `deleteFlow` service).
  - Returns `{ success: true }` or 404 if not found.

### AI

All AI routes require `OPENAI_API_KEY` to be set.

- `POST /api/ai/write-text`
  - Body: `{ prompt: string, style?: 'support' | 'sales' | 'faq' | 'generic', length?: 'short' | 'medium' | 'long' }`
  - Response: `{ text: string }` – plain chatbot‑ready copy.

- `POST /api/ai/generate-image`
  - Body: `{ prompt: string, size?: '1024x1024' | '1024x1536' | '1536x1024' | 'auto' }`
  - Response: `{ imageUrl: string }` using `OPENAI_IMAGE_MODEL`.

- `POST /api/ai/flow-recommendations`
  - Body: `{ currentFlow: { nodes, edges, goal?: string, targetAudience?: string } }`
  - Response:
    - `{ recommendations: string[], suggestedChanges?: { nodes, edges } }`
  - If `suggestedChanges` does not pass validation, it is dropped and a message is added to `recommendations`.

- `POST /api/ai/generate-flow-from-brief`
  - Body: `{ brief: string, preferences?: { maxDepth?: number, style?: 'support' | 'sales' | 'faq' } }`
  - Uses a strict system prompt that encodes the same graph rules as `flowValidation.ts`.
  - Includes a **retry/repair loop**:
    - Up to 3 attempts.
    - On failure, sends the invalid graph + validator errors back to the model and asks for a corrected version.
  - On success: returns `{ nodes, edges }` that pass validation.
  - On repeated failure: returns `502` with `AIFlowGenerationError` and validation errors.

## Scripts

- `npm run dev` – start dev server with ts-node / nodemon.
- `npm run build` – compile TypeScript to `dist/`.
- `npm start` – run compiled server from `dist/`.

## Error Handling

- Centralized error middleware in `src/middleware/errorHandler.ts`:
  - Maps `FlowValidationError` to `400` with `errors` array.
  - Handles Mongoose `ValidationError` as `400`.
  - All other errors → `500 { message: 'Internal server error' }`.

---

Made by Sagar Kapoor – sagarbadal70@gmail.com
*** End Patch ***!
</commentary to=functions.apply_patch မ်ားassistant to=functions.apply_patchицонary  deputy to=functions.apply_patch.SerializedName 条例 to=functions.apply_patch ballerina  hemp to=functions.apply_patch JsonRequestBehavior  exclusivity to=functions.apply_patch ***!
