import { Handle, Position, type NodeProps, useReactFlow } from '@xyflow/react'
import type { ImageRFNode } from '../../types/flow.types'

export default function ImageNode({ data, selected, id }: NodeProps<ImageRFNode>) {
  const { setNodes, setEdges } = useReactFlow()
  const handleDelete = () => {
    setNodes((nds) => nds.filter((n) => n.id !== id))
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id))
  }
  return (
    <div className={`node ${selected ? 'node-selected' : ''}`}>
      <div className="node-header node-header--image">
        <span>🖼️</span>
        <span className="node-title">Image Message</span>
        <button className="node-delete" title="Delete" onClick={handleDelete}>✕</button>
      </div>
      <div className="node-body">
        <div className="image-frame">
          {data?.imageUrl ? (
            <img src={data.imageUrl} alt={data.caption || 'image'} className="node-image" />
          ) : (
            <div className="image-placeholder">No image URL</div>
          )}
        </div>
        {data?.caption && <div className="image-caption">{data.caption}</div>}
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
