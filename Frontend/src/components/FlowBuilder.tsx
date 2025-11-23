import '@xyflow/react/dist/style.css'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  type Connection,
  type ReactFlowInstance,
  type NodeTypes,
} from '@xyflow/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import NodesPanel from './panels/NodesPanel'
import SettingsPanel from './panels/SettingsPanel'
import TextNode from './nodes/TextNode'
import ImageNode from './nodes/ImageNode'
import ButtonNode from './nodes/ButtonNode'
import ConditionalNode from './nodes/ConditionalNode'
import SaveButton from './SaveButton'
import type { Flow, AppRFNode, RFEdge } from '../types/flow.types'
import type { ButtonNodeData, NodeType } from '../types/flow.types'

let idCounter = 1
const nextId = () => `node_${idCounter++}`
//added default flow when no saved data exists
function defaultFlow(): Flow {
  const firstId = nextId()
  const secondId = nextId()
  return {
    nodes: [
      {
        id: firstId,
        type: 'text',
        position: { x: 100, y: 100 },
        data: { text: 'test message 1' },
      },
      {
        id: secondId,
        type: 'text',
        position: { x: 400, y: 100 },
        data: { text: 'test message 2' },
      },
    ],
    edges: [
      {
        id: `e-${firstId}-${secondId}`,
        source: firstId,
        target: secondId,
        type: 'default',
      },
    ],
  }
}

const nodeTypes: NodeTypes = {
  text: TextNode,
  image: ImageNode,
  button: ButtonNode,
  conditional: ConditionalNode,
}
//added registry pattern to easily register new nodes

export default function FlowBuilder() {
  const apiBase = (import.meta).env?.VITE_API_BASE_URL || 'http://localhost:4000'
  const initial = useMemo(() => defaultFlow(), [])
  const [nodes, setNodes, onNodesChange] = useNodesState<AppRFNode>(initial.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState<RFEdge>(initial.edges)
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>()
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const rf = useRef<ReactFlowInstance<AppRFNode, RFEdge> | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [flowName, setFlowName] = useState<string>('Main Chatbot Flow')
  const [flowDescription, setFlowDescription] = useState<string>('')
  const [flowId, setFlowId] = useState<string | undefined>(undefined)
  const [metaDialogOpen, setMetaDialogOpen] = useState(false)
  const [flowsDialogOpen, setFlowsDialogOpen] = useState(false)
  const [flowsLoading, setFlowsLoading] = useState(false)
  const [flows, setFlows] = useState<Array<{ id: string; name: string; description?: string }>>([])
  const [aiDialogOpen, setAiDialogOpen] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiRecommendations, setAiRecommendations] = useState<string[]>([])
  //Closex sidebar when nodes panel starts a drag on small screens
  //(NodesPanel dispatches a custom event during dragstart)
  useEffect(() => {
    const handler = () => {
      if (window.innerWidth <= 768) setSidebarOpen(false)
    }
    window.addEventListener('fb-close-sidebar', handler as EventListener)
    return () => window.removeEventListener('fb-close-sidebar', handler as EventListener)
  }, [])
  //Mobile: click-to-add from NodesPanel
  useEffect(() => {
    const addHandler = (e: Event) => {
      const anyEvt = e as CustomEvent<{ type: string }>
      const t = anyEvt?.detail?.type
      if (!t || !isNodeType(t)) return
      const rect = wrapperRef.current?.getBoundingClientRect()
      const center = rect
        ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
        : { x: window.innerWidth / 2, y: window.innerHeight / 2 }
      const position = rf.current?.screenToFlowPosition(center) || { x: 0, y: 0 }
      const id = nextId()
      let node: AppRFNode
      if (t === 'text') node = { id, type: t, position, data: { text: 'message' } }
      else if (t === 'image') node = { id, type: t, position, data: { imageUrl: '', caption: '' } }
      else if (t === 'button')
        node = {
          id,
          type: t,
          position,
          data: {
            text: 'Choose an option',
            buttons: [
              { label: 'Yes', value: 'yes' },
              { label: 'No', value: 'no' },
            ],
          },
        }
      else node = { id, type: t, position, data: { variable: 'answer', condition: '== "yes"' } }
      setNodes((nds) => nds.concat(node))
      setSelectedNodeId(id)
      if (window.innerWidth <= 768) setSidebarOpen(true)
    }
    window.addEventListener('fb-add-node', addHandler as EventListener)
    return () => window.removeEventListener('fb-add-node', addHandler as EventListener)
  }, [setNodes])

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId),
    [nodes, selectedNodeId]
  )

  const isValidConnection = useCallback(
    (edgeOrConn: RFEdge | Connection) => {
      const sourceId = edgeOrConn.source
      if (!sourceId) return false
      const targetId = (edgeOrConn).target as string | null | undefined
      // Disallow self-loop
      if (targetId && targetId === sourceId) return false
      // Disallow bidirectional loop (A->B and B->A)
      if (targetId && edges.some((e) => e.source === targetId && e.target === sourceId)) return false
      const sameSource = edges.filter((e) => e.source === sourceId)
      // unique connection per handle (button/conditional)
      if (edgeOrConn.sourceHandle) {
        const sameHandle = sameSource.filter((e) => e.sourceHandle === edgeOrConn.sourceHandle)
        if (sameHandle.length > 0) return false
      }
      // type-based constraints
      const source = nodes.find((n) => n.id === sourceId)
      if (source) {
        if (source.type === 'button' || source.type === 'conditional') {
          if (!edgeOrConn.sourceHandle) return false
        } else {
          if (sameSource.length > 0) return false
        }
      }

      // Cycle check: if target exists, ensure adding this edge does not create a cycle
      if (targetId) {
        const adj = new Map<string, string[]>()
        const push = (a: string, b: string) => {
          if (!adj.has(a)) adj.set(a, [])
          adj.get(a)!.push(b)
        }
        for (const e of edges) push(e.source, e.target)
        // include the proposed edge
        push(sourceId, targetId)
        const seen = new Set<string>()
        const stack: string[] = [targetId]
        while (stack.length) {
          const cur = stack.pop()!
          if (cur === sourceId) return false
          if (seen.has(cur)) continue
          seen.add(cur)
          const next = adj.get(cur)
          if (next) for (const n of next) stack.push(n)
        }
      }
      return true
    },
    [edges, nodes]
  )
  //added per node type connection rules and per handle uniqueness

  const onConnect = useCallback(
    (conn: Connection) => {
      if (!isValidConnection(conn)) return
      setEdges((eds) => addEdge(conn, eds))
    },
    [isValidConnection, setEdges]
  )

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      const raw = event.dataTransfer.getData('application/reactflow')
      if (!isNodeType(raw)) return
      const type = raw
      const position = rf.current?.screenToFlowPosition({ x: event.clientX, y: event.clientY }) || {
        x: 0,
        y: 0,
      }
      const id = nextId()
      let node: AppRFNode
      if (type === 'text') node = { id, type, position, data: { text: 'message' } }
      else if (type === 'image') node = { id, type, position, data: { imageUrl: '', caption: '' } }
      else if (type === 'button')
        node = {
          id,
          type,
          position,
          data: {
            text: 'Choose an option',
            buttons: [
              { label: 'Yes', value: 'yes' },
              { label: 'No', value: 'no' },
            ],
          },
        }
      else node = { id, type, position, data: { variable: 'answer', condition: '== "yes"' } }
      setNodes((nds) => nds.concat(node))
      setSelectedNodeId(id)
    },
    [setNodes]
  )
  //added type-guarded dnd creation with sensible defaults

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onNodeClick = useCallback((_: MouseEvent, n: AppRFNode) => {
    setSelectedNodeId(n.id)
    if (window.innerWidth <= 768) setSidebarOpen(true)
  }, [])
  const onPaneClick = useCallback(() => {
    setSelectedNodeId(undefined)
    if (window.innerWidth <= 768) setSidebarOpen(false)
  }, [])

  const updateSelectedData = useCallback(
    (updater: (node: AppRFNode) => AppRFNode) => {
      if (!selectedNodeId) return
      const current = nodes.find((n) => n.id === selectedNodeId)
      const updated = current ? updater(current) : undefined
      setNodes((nds) => nds.map((n) => (n.id === selectedNodeId ? updater(n) : n)))
      if (updated && updated.type === 'button') {
        const btnData: ButtonNodeData = updated.data
        const handles = new Set(btnData.buttons.map((b) => b.value))
        setEdges((eds) =>
          eds.filter(
            (e) =>
              !(
                e.source === selectedNodeId &&
                e.sourceHandle !== undefined &&
                !handles.has(String(e.sourceHandle))
              )
          )
        )
      }
    },
    [selectedNodeId, nodes, setNodes, setEdges]
  )
  //added immutable updater and prune edges when button options change
  const flow: Flow = useMemo(() => ({ nodes, edges }), [nodes, edges])
  const [toast, setToast] = useState<null | { type: 'success' | 'error'; message: string }>(null)
  const defaultEdgeOptions = useMemo(
    () => ({
      markerEnd: { type: MarkerType.ArrowClosed, color: '#9e9e9e', width: 18, height: 18 },
      style: { stroke: '#9e9e9e', strokeWidth: 2 },
    }),
    []
  )
  const toastTimerRef = useRef<number | null>(null)

  const notify = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ type, message })
    if (toastTimerRef.current) {
      // console.log("Clearing existing toast timer");
      window.clearTimeout(toastTimerRef.current)
    }
    toastTimerRef.current = window.setTimeout(() => setToast(null), 3000) as unknown as number
  }, [])

  const handleNewFlow = useCallback(() => {
    const fresh = defaultFlow()
    setNodes(fresh.nodes)
    setEdges(fresh.edges)
    setSelectedNodeId(undefined)
    setFlowName('Main Chatbot Flow')
    setFlowDescription('')
    setFlowId(undefined)
    notify('Started new flow', 'success')
  }, [setNodes, setEdges, notify])

  const handleDeleteCurrentFlow = useCallback(async () => {
    if (!flowId) {
      handleNewFlow()
      return
    }
    try {
      await fetch(`${apiBase}/api/flows/${encodeURIComponent(flowId)}`, {
        method: 'DELETE',
      })
    } catch {
      // ignore network errors, still reset locally
    }
    handleNewFlow()
    setFlowId(undefined)
    notify('Flow deleted', 'success')
  }, [apiBase, flowId, handleNewFlow, notify])

  const openFlowsDialog = useCallback(async () => {
    setFlowsDialogOpen(true)
    setFlowsLoading(true)
    try {
      const res = await fetch(`${apiBase}/api/flows?page=1&pageSize=50`)
      if (!res.ok) return
      const body = await res.json()
      if (body && Array.isArray(body.items)) {
        interface BackendFlowItem {
          id?: string;
          _id?: string;
          name?: string;
          description?: string;
        }
        interface FlowListItem {
          id: string;
          name: string;
          description?: string;
        }
        setFlows(
          (body.items as BackendFlowItem[]).map(
            (f: BackendFlowItem): FlowListItem => ({
              id: String(f.id || f._id),
              name: typeof f.name === 'string' ? f.name : 'Untitled flow',
              description: typeof f.description === 'string' ? f.description : undefined,
            })
          )
        )
      } else {
        setFlows([])
      }
    } catch {
      notify('Failed to load flows', 'error')
    } finally {
      setFlowsLoading(false)
    }
  }, [apiBase, notify])

  const handleOpenFlowFromList = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`${apiBase}/api/flows/${encodeURIComponent(id)}`)
        if (!res.ok) {
          notify('Failed to load flow', 'error')
          return
        }
        const data = await res.json()
        if (!data || !Array.isArray(data.nodes) || !Array.isArray(data.edges)) return
        setNodes(data.nodes)
        setEdges(data.edges)
        if (typeof data.name === 'string') setFlowName(data.name)
        if (typeof data.description === 'string') setFlowDescription(data.description)
        let max = 0
        for (const n of data.nodes as AppRFNode[]) {
          const m = /node_(\d+)$/.exec(n.id)
          if (m) {
            const num = Number(m[1])
            if (!Number.isNaN(num) && num > max) max = num
          }
        }
        idCounter = Math.max(1, max + 1)
        setFlowId(typeof data.id === 'string' ? data.id : id)
        setSelectedNodeId(undefined)
        setFlowsDialogOpen(false)
        notify('Flow loaded', 'success')
      } catch {
        notify('Failed to load flow', 'error')
      }
    },
    [apiBase, notify, setNodes, setEdges]
  )

  const handleDeleteFlowFromList = useCallback(
    async (id: string) => {
      try {
        await fetch(`${apiBase}/api/flows/${encodeURIComponent(id)}`, { method: 'DELETE' })
        setFlows((prev) => prev.filter((f) => f.id !== id))
        if (flowId === id) {
          handleNewFlow()
        }
        notify('Flow deleted', 'success')
      } catch {
        notify('Failed to delete flow', 'error')
      }
    },
    [apiBase, flowId, handleNewFlow, notify]
  )

  const handleAiRecommendations = useCallback(async () => {
    setAiLoading(true)
    try {
      const res = await fetch(`${apiBase}/api/ai/flow-recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentFlow: {
            nodes,
            edges,
            goal: flowDescription || flowName,
          },
        }),
      })
      if (!res.ok) {
        notify('Failed to get AI recommendations', 'error')
        return
      }
      const body = await res.json()
      if (body && Array.isArray(body.recommendations)) {
        setAiRecommendations(body.recommendations)
      } else {
        setAiRecommendations([])
      }
      setAiDialogOpen(true)
    } catch {
      notify('Failed to get AI recommendations', 'error')
    } finally {
      setAiLoading(false)
    }
  }, [apiBase, nodes, edges, flowDescription, flowName, notify])

  // initial flow is always in-memory; backend flows are opened via the "All flows" dialog
  return (
    <div className="fb-container">
      <div className="fb-header">
        <button
          className="menu-button"
          aria-label="Toggle sidebar"
          onClick={() => setSidebarOpen((v) => !v)}
        >
          ☰
        </button>
        <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
          <button type="button" className="btn" onClick={handleNewFlow}>
            New flow
          </button>
          <button type="button" className="btn" onClick={openFlowsDialog}>
            All flows
          </button>
          <button type="button" className="btn" onClick={handleDeleteCurrentFlow}>
            Delete flow
          </button>
        </div>
        <div style={{ flex: 1 }} />
        <div className="save-area">
          <SaveButton
            flow={flow}
            name={flowName}
            description={flowDescription}
            onSave={() => notify('Changes saved', 'success')}
            onError={(errs) => notify(errs?.[0] || 'Unable to save changes', 'error')}
          />
          <button
            type="button"
            className="btn"
            style={{ marginLeft: '8px' }}
            onClick={handleAiRecommendations}
            disabled={aiLoading}
          >
            {aiLoading ? 'Getting AI tips…' : 'AI flow tips'}
          </button>
          <button
            type="button"
            className="btn"
            style={{ marginLeft: '8px' }}
            onClick={() => setMetaDialogOpen(true)}
          >
            Edit details
          </button>
        </div>
      </div>
      {toast && (
        <div className="fb-toast-wrap">
          <div className={`alert ${toast.type === 'success' ? 'alert-success' : 'alert-error'}`}>
            {toast.message}
          </div>
        </div>
      )}
      <div className="fb-content">
        <div ref={wrapperRef} className="fb-canvas">
          <ReactFlow<AppRFNode, RFEdge>
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            isValidConnection={isValidConnection}
            nodeTypes={nodeTypes}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onInit={(inst) => (rf.current = inst)}
            defaultEdgeOptions={defaultEdgeOptions}
            connectionLineStyle={{ stroke: '#9e9e9e', strokeWidth: 2 }}
            fitView
          >
            <Background variant={BackgroundVariant.Dots} />
            <Controls />
          </ReactFlow>
        </div>
        <div className={`fb-sidebar ${sidebarOpen ? 'is-open' : ''}`}>
          <div className="sidebar-actions">
            {selectedNode ? (
              <SettingsPanel
                node={selectedNode}
                onChange={updateSelectedData}
                onBack={() => setSelectedNodeId(undefined)}
              />
            ) : (
              <NodesPanel />
            )}
          </div>
        </div>
      </div>
      <div
        className={`fb-overlay ${sidebarOpen ? 'show' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />
      {metaDialogOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
          }}
        >
          <div
            style={{
              background: '#ffffff',
              padding: '16px',
              borderRadius: '8px',
              maxWidth: '420px',
              width: '90%',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            }}
          >
            <h2 style={{ margin: '0 0 12px 0' }}>Flow details</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div className="form-label">Name</div>
                <input
                  className="input"
                  value={flowName}
                  onChange={(e) => setFlowName(e.target.value)}
                  placeholder="My chatbot flow"
                />
              </div>
              <div>
                <div className="form-label">Description</div>
                <textarea
                  className="textarea"
                  rows={3}
                  value={flowDescription}
                  onChange={(e) => setFlowDescription(e.target.value)}
                  placeholder="Optional description for this flow"
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '8px',
                  marginTop: '4px',
                }}
              >
                <button type="button" className="btn" onClick={() => setMetaDialogOpen(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setMetaDialogOpen(false)}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {aiDialogOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
          }}
        >
          <div
            style={{
              background: '#ffffff',
              padding: '16px',
              borderRadius: '8px',
              maxWidth: '520px',
              width: '90%',
              maxHeight: '70vh',
              overflowY: 'auto',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            }}
          >
            <h2 style={{ margin: '0 0 12px 0' }}>AI flow recommendations</h2>
            {aiRecommendations.length === 0 ? (
              <div className="muted">No recommendations returned for this flow.</div>
            ) : (
              <ul style={{ paddingLeft: '20px', margin: '0 0 16px 0' }}>
                {aiRecommendations.map((rec, idx) => (
                  <li key={idx} style={{ marginBottom: '6px' }}>
                    {rec}
                  </li>
                ))}
              </ul>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button type="button" className="btn" onClick={() => setAiDialogOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {flowsDialogOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
          }}
        >
          <div
            style={{
              background: '#ffffff',
              padding: '16px',
              borderRadius: '8px',
              maxWidth: '520px',
              width: '90%',
              maxHeight: '70vh',
              overflowY: 'auto',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            }}
          >
            <h2 style={{ margin: '0 0 12px 0' }}>Saved flows</h2>
            {flowsLoading ? (
              <div className="muted">Loading flows…</div>
            ) : flows.length === 0 ? (
              <div className="muted">No flows found in backend.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {flows.map((f) => (
                  <div
                    key={f.id}
                    style={{
                      border: '1px solid #e0e0e0',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>{f.name}</div>
                      {f.description && (
                        <div
                          style={{
                            fontSize: '12px',
                            color: '#666',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                          }}
                        >
                          {f.description}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        className="btn"
                        onClick={() => handleOpenFlowFromList(f.id)}
                      >
                        Open
                      </button>
                      <button
                        type="button"
                        className="btn"
                        onClick={() => handleDeleteFlowFromList(f.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button type="button" className="btn" onClick={() => setFlowsDialogOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function isNodeType(value: string): value is NodeType {
  return value === 'text' || value === 'image' || value === 'button' || value === 'conditional'
}
