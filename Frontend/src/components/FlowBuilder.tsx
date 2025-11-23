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
//added loader to restore saved flow from localstorage
function loadInitialFlow(): Flow {
  try {
    const raw = localStorage.getItem('bitspeed.flow')
    if (!raw) return defaultFlow()
    const parsed = JSON.parse(raw)
    const nodes: AppRFNode[] = []
    const edges: RFEdge[] = []
    if (parsed && parsed.nodes && Array.isArray(parsed.nodes)) {
      for (const n of parsed.nodes) {
        if (!n || typeof n.id !== 'string' || typeof n.type !== 'string' || !n.position) continue
        const pos = n.position
        if (typeof pos.x !== 'number' || typeof pos.y !== 'number') continue
        if (n.type === 'text' && n.data && typeof n.data.text === 'string') {
          nodes.push({
            id: n.id,
            type: 'text',
            position: { x: pos.x, y: pos.y },
            data: { text: n.data.text },
          })
        } else if (n.type === 'image' && n.data && typeof n.data.imageUrl === 'string') {
          nodes.push({
            id: n.id,
            type: 'image',
            position: { x: pos.x, y: pos.y },
            data: {
              imageUrl: n.data.imageUrl,
              caption: typeof n.data.caption === 'string' ? n.data.caption : undefined,
            },
          })
        } else if (
          n.type === 'button' &&
          n.data &&
          Array.isArray(n.data.buttons) &&
          typeof n.data.text === 'string'
        ) {
          const btns = [] as { label: string; value: string }[]
          for (const b of n.data.buttons) {
            if (b && typeof b.label === 'string' && typeof b.value === 'string')
              btns.push({ label: b.label, value: b.value })
          }
          nodes.push({
            id: n.id,
            type: 'button',
            position: { x: pos.x, y: pos.y },
            data: { text: n.data.text, buttons: btns },
          })
        } else if (
          n.type === 'conditional' &&
          n.data &&
          typeof n.data.variable === 'string' &&
          typeof n.data.condition === 'string'
        ) {
          nodes.push({
            id: n.id,
            type: 'conditional',
            position: { x: pos.x, y: pos.y },
            data: { variable: n.data.variable, condition: n.data.condition },
          })
        }
      }
    }
    if (parsed && parsed.edges && Array.isArray(parsed.edges)) {
      for (const e of parsed.edges) {
        if (
          !e ||
          typeof e.id !== 'string' ||
          typeof e.source !== 'string' ||
          typeof e.target !== 'string'
        )
          continue
        const edge: RFEdge = {
          id: e.id,
          source: e.source,
          target: e.target,
          type: typeof e.type === 'string' ? e.type : 'default',
          sourceHandle: typeof e.sourceHandle === 'string' ? e.sourceHandle : undefined,
          targetHandle: typeof e.targetHandle === 'string' ? e.targetHandle : undefined,
        }
        edges.push(edge)
      }
    }
    // update counter from existing node ids
    let max = 0
    for (const n of nodes) {
      const m = /node_(\d+)$/.exec(n.id)
      if (m) {
        const num = Number(m[1])
        if (!Number.isNaN(num) && num > max) max = num
      }
    }
    idCounter = Math.max(1, max + 1)
    if (nodes.length === 0) return defaultFlow()
    return { nodes, edges }
  } catch {
    return defaultFlow()
  }
}
//added default flow when no saved data exists
function defaultFlow(): Flow {
  return {
    nodes: [
      {
        id: nextId(),
        type: 'text',
        position: { x: 100, y: 100 },
        data: { text: 'test message 1' },
      },
      {
        id: nextId(),
        type: 'text',
        position: { x: 400, y: 100 },
        data: { text: 'test message 2' },
      },
    ],
    edges: [{ id: 'e1-2', source: 'node_1', target: 'node_2', type: 'default' }],
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
const initial = useMemo(() => loadInitialFlow(), []);
  const [nodes, setNodes, onNodesChange] = useNodesState<AppRFNode>(initial.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState<RFEdge>(initial.edges)
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>()
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const rf = useRef<ReactFlowInstance<AppRFNode, RFEdge> | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
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
      window.clearTimeout(toastTimerRef.current)
    }
    toastTimerRef.current = window.setTimeout(() => setToast(null), 3000) as unknown as number
  }, [])
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
        <div style={{ flex: 1 }} />
        <div className="save-area">
          <SaveButton
            flow={flow}
            onSave={() => notify('Changes saved', 'success')}
            onError={(errs) => notify(errs?.[0] || 'Unable to save changes', 'error')}
          />
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
    </div>
  )
}

function isNodeType(value: string): value is NodeType {
  return value === 'text' || value === 'image' || value === 'button' || value === 'conditional'
}
