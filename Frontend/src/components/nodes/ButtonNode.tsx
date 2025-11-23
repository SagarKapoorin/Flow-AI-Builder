import { Handle, Position, type NodeProps, useReactFlow } from '@xyflow/react'
import type { ButtonRFNode } from '../../types/flow.types'
export default function ButtonNode({ data, selected, id }: NodeProps<ButtonRFNode>) {
   const { setNodes, setEdges } = useReactFlow()
  const handleDelete = () => {
    setNodes((nds) => nds.filter((n) => n.id !== id))
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id))
  }
  const buttons = data?.buttons ?? []
  return (
    <div className={`node ${selected ? 'node-selected' : ''}`}>
      <button className="node-delete" title="Delete" onClick={handleDelete}>✕</button>
      <div className="node-header node-header--button">
        <span>🔘</span>
        <span className="node-title">Quick Reply</span>
      </div>
      <div className="node-body">
        <div className="text-primary">{data?.text ?? ''}</div>
        {buttons.length === 0 ? (
          <div className="muted">No options</div>
        ) : (
          buttons.map((b, idx) => (
            <div key={(b.value || '') + '_' + idx} className="button-row">
              <div className="button-chip">{b.label || b.value}</div>
              <Handle type="source" position={Position.Right} id={b.value || String(idx)} />
            </div>
          ))
        )}
      </div>
      <Handle type="target" position={Position.Left} />
    </div>
  )
}
