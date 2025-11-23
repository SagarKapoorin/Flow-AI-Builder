import { Handle, Position, type NodeProps, useReactFlow } from '@xyflow/react'
import type { TextRFNode } from '../../types/flow.types'

export default function TextNode({ data, selected, id }: NodeProps<TextRFNode>) {
  const { setNodes, setEdges } = useReactFlow()
  const handleDelete = () => {
    setNodes((nds) => nds.filter((n) => n.id !== id))
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id))
  }
  return (
    <div className={`node ${selected ? 'node-selected' : ''}`}>
      <div className="node-header node-header--text">
        <span>💬</span>
        <span className="node-title">Text Message</span>
        <button className="node-delete" title="Delete" onClick={handleDelete}>✕</button>
      </div>
      <div className="node-body">{data?.text ?? ''}</div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
