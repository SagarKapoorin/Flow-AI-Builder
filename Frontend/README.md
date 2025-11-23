## 📽️ Recording

You can access the full recording here:
👉 **[Click to watch the recording](https://drive.google.com/file/d/1R1hXEirP-LNZUEnPW7z-eajxMDlw05Iv/view?usp=sharing)**

## Hosted Link

You can access webiste here:
👉 **[Website](https://flow12.netlify.app)**

Made by Sagar Kapoor, sagarbadal70@gmail.com

# BiteSpeed Chatbot Flow Builder

A simple and extensible chatbot flow builder built with React and React Flow, allowing users to visually create message flows by dragging nodes and connecting them with edges.

**Features**
- Drag & drop nodes from the panel onto the canvas
- Visual flow creation with connectable edges
- Node editing via a dedicated settings panel
- Per-type connection rules (single-output vs multi-output handles)
- Validation on save only with clear errors
- Persistent storage in browser localStorage (auto-restored on load)
- Extensible architecture for adding new node types quickly
 - Delete nodes via the top-right delete button on each node
 - Responsive UI that works on mobile (drawer sidebar + touch support)

**Current Node Types**
- Text Message: simple text content
- Image Message: URL with optional caption
- Quick Reply (Button): prompt with multiple options (one output per option)
- Condition: true/false branching via two outputs

**Tech Stack**
- Framework: React + TypeScript
- Flow Library: `@xyflow/react` (React Flow v12)
- Styling: plain CSS, split into layout/panels/nodes
- State: React hooks (`useState`, `useMemo`, `useCallback`)
- Storage: Browser `localStorage`
- Build: Vite

**Project Structure**
- `src/components/FlowBuilder.tsx` — main builder with ReactFlow, node registry, DnD, restore-on-load
- `src/components/nodes/TextNode.tsx` — text message node
- `src/components/nodes/ImageNode.tsx` — image message node
- `src/components/nodes/ButtonNode.tsx` — quick reply node with per-option handles
- `src/components/nodes/ConditionalNode.tsx` — condition node with true/false handles
- `src/components/panels/NodesPanel.tsx` — drag source panel (dynamic list)
- `src/components/panels/SettingsPanel.tsx` — per-type settings UI (typed updater)
- `src/components/SaveButton.tsx` — validate-on-click + save to localStorage
- `src/hooks/useFlowValidation.ts` — `validateFlow(flow)` and a light hook wrapper
- `src/types/flow.types.ts` — discriminated union for node types and data
- `src/styles/layout.css` — app layout styles
- `src/styles/panels.css` — panels and controls styles
- `src/styles/nodes.css` — all custom node visuals

**How Persistence Works**
- On Save: `SaveButton` runs validation, then stores the JSON under `bitspeed.flow` in localStorage.
- On Load: `FlowBuilder` reconstructs nodes/edges from localStorage and sets a safe `idCounter`.

**Connection Rules**
- Text/Image nodes: at most one outgoing edge
- Button node: one source handle per option; each handle can have only one edge
- Condition node: two source handles (`true`, `false`); each can have only one edge

**Getting Started**
- Install: `npm install`
- Dev: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`
- Format: `npm run format`

Open the app, drag nodes from the Nodes panel, connect them, select a node to edit settings, then click Save Changes. Reload the page to see the saved flow restored.

**Extensibility Guide**
- Add a new type in `src/types/flow.types.ts` (data + union)
- Create a node component under `src/components/nodes/`
- Register it in `nodeTypes` inside `src/components/FlowBuilder.tsx`
- Add to `availableNodes` in `src/components/panels/NodesPanel.tsx`
- Add a settings branch in `src/components/panels/SettingsPanel.tsx`
- Provide drop defaults in `onDrop` (FlowBuilder)

This design keeps core logic stable while making node additions straightforward.

Made by Sagar Kapoor, sagarbadal70@gmail.com

**Prerequisites**
- Basic knowledge of React and TypeScript
- Node.js 16+ and npm/pnpm/yarn

**Installation**
- Clone the repository
  - `git clone <your-repo-url>`
  - `cd chatbot-flow-builder`
- Install dependencies
  - `npm install` or `pnpm install` or `yarn install`
- Start the development server
  - `npm run dev` or `pnpm dev` or `yarn dev`
- Open your browser
  - `http://localhost:5173`

**Usage Guide**
- Creating a Flow
  - Add Nodes: drag nodes from the right panel onto the canvas
  - Connect Nodes: drag from a node’s right handle (source) to another node’s left handle (target)
  - Edit Nodes: click a node to open the settings panel and edit its fields
  - Save Flow: click “Save Changes” to validate and persist your flow
  - Delete Node: click the circular delete button in a node's top-right corner
  - Mobile/Responsive: on small screens, open the nodes panel from the header menu; if drag-and-drop is limited, tap a node in the panel to add it to the canvas

**Validation Rules (on save)**
- If there is more than one node in the flow, and more than one node has no incoming connection (multiple entry points), saving is blocked with: “Cannot save Flow”.
  - Valid example: only one starting node without incoming edges
  - Invalid example: two or more nodes without any incoming edges

**Connection Constraints**
- Each source handle allows only one outgoing edge
- Most nodes have one source handle (thus one outgoing edge total)
- Button/Conditional nodes expose multiple named source handles; each handle can have exactly one outgoing edge
- Target handles can accept multiple incoming edges

**Configuration**
- Clearing saved data
  - Open DevTools (F12) and run:
    - `localStorage.removeItem('bitspeed.flow')`
    - Or clear all Storage: `localStorage.clear()`

**Customizing Node Types**
- Define the type in `src/types/flow.types.ts` (add to `NodeType` and data shape)
- Create a component under `src/components/nodes/YourNode.tsx`
- Register it in `nodeTypes` in `src/components/FlowBuilder.tsx`
- Add it to the drag list in `src/components/panels/NodesPanel.tsx`
- Add a settings branch in `src/components/panels/SettingsPanel.tsx`
- Provide sensible defaults in `onDrop` inside `FlowBuilder`

Example additions
- `NodeType` union: `'text' | 'image' | 'button' | 'conditional' | 'webhook'`
- Minimal component:
  - `export default function WebhookNode(props) { /* render */ }`
- Registration:
  - `const nodeTypes = { ..., webhook: WebhookNode }`
- Drag source:
  - `<div draggable onDragStart={(e) => onDragStart(e, 'webhook')}>🔗 Webhook</div>`

**Design Decisions**
- LocalStorage persistence avoids backend complexity and restores state across reloads
- Single entry point ensures linear chatbot starts; branching is explicit via Button/Condition nodes
- Extensible types via discriminated unions and per-type components keep core stable
- On-demand validation (on save) prevents disruptive error banners during editing
**Node and Connection Constraints**

- Node constraints
  - Source handle (right side): one edge maximum. Cannot connect to multiple nodes from the same source handle.
  - Target handle (left side): multiple edges allowed. Many nodes may connect into the same target.

  Example (source handle):
  
  ALLOWED
  Node A -> Node B
  
  NOT ALLOWED (two outgoing edges from A)
  Node A -> Node B
  Node A -> Node C

  Example (target handle):
  
  ALLOWED (two incoming edges to C)
  Node A ->
           \-> Node C
  Node B ->

- Connection constraints
  - You can
    - Linear flows: Node A -> Node B -> Node C
    - Convergence: multiple nodes connecting to one node
    - Disconnected nodes temporarily while building
  - You cannot
    - Self-loop: Node A -> Node A
    - Bidirectional loop: A -> B and B -> A
    - Multiple outgoing edges from a single source handle
    - Cycles: any circular path (A -> B -> C -> A)

- Validation constraints (on Save)
  - If there is more than 1 node in the flow, and more than one node has no incoming connection (multiple entry points), saving is blocked.
