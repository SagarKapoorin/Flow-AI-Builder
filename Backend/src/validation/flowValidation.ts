import type {
  AppEdge,
  FlowGraph,
  ButtonNode,
  ConditionalNode,
} from '../types/flow.types'
export interface FlowValidationResult {
  valid:boolean
  errors:string[]
}
//funciton to validate flow graph 
//like preventing cycles, invalid edges, duplicate node ids etc
export function validateFlowGraph(flow: FlowGraph): FlowValidationResult {
  const { nodes, edges }=flow
  const errors: string[]=[];
  // console.log("Validating flow graph with", nodes.length, "nodes and", edges.length, "edges");
  const nodeIds=new Set<string>()
  for (const n of nodes) {
    if (nodeIds.has(n.id))errors.push(`Duplicate node id: ${n.id}`)
    else nodeIds.add(n.id)
  }
for (const e of edges) {
    if (!nodeIds.has(e.source)) errors.push(`Edge ${e.id} has unknown source ${e.source}`)
    if (!nodeIds.has(e.target)) errors.push(`Edge ${e.id} has unknown target ${e.target}`)
  }
  const pairSet = new Set<string>()
  for (const e of edges) {
    if (e.source === e.target) errors.push(`Self-loop not allowed on node ${e.source}`)
    const key = `${e.source}->${e.target}`
    const rev = `${e.target}->${e.source}`
    if (pairSet.has(rev)) errors.push(`Bidirectional loop between ${e.source} and ${e.target}`)
    pairSet.add(key)
  }
// console.log(edges.keys());
  const handleOutCount = new Map<string, number>()
  for (const e of edges) {
    const handleId = e.sourceHandle ?? 'default'
    const key = `${e.source}::${handleId}`
    const count = (handleOutCount.get(key) || 0) + 1
    handleOutCount.set(key, count)
    if (count > 1)
      errors.push(`Source handle ${e.source}:${handleId} has more than one outgoing edge`)
  }
  const outgoingByNode = new Map<string, AppEdge[]>()
  for (const e of edges) {
    if (!outgoingByNode.has(e.source)) outgoingByNode.set(e.source, [])
    outgoingByNode.get(e.source)!.push(e)
  }
  for (const node of nodes) {
    const outEdges = outgoingByNode.get(node.id) || []
    switch (node.type) {
      case 'text':
      case 'image': {
        for (const e of outEdges) {
          if (e.sourceHandle != null)
            errors.push(`Node ${node.id} of type ${node.type} cannot use named source handles`)
        }
        if (outEdges.length > 1)
          errors.push(`Node ${node.id} of type ${node.type} can have at most one outgoing edge`)
        break
      }
      case 'button': {
        const btnNode = node as ButtonNode
        const validHandles = new Set<string>(
          (btnNode.data?.buttons || []).map((b) => String(b.value))
        )
        for (const e of outEdges) {
          if (e.sourceHandle == null)
            errors.push(`Button node ${node.id} must use a button value as sourceHandle`)
          else if (!validHandles.has(String(e.sourceHandle)))
            errors.push(
              `Button node ${node.id} has edge ${e.id} with unknown button handle ${e.sourceHandle}`
            )
        }
        break
      }
      case 'conditional': {
        const _condNode = node as ConditionalNode
        for (const e of outEdges) {
          if (e.sourceHandle !== 'true' && e.sourceHandle !== 'false')
            errors.push(
              `Conditional node ${node.id} sourceHandle must be "true" or "false", got ${String(
                e.sourceHandle
              )}`
            )
        }
        break
      }
      default:
        break
    }
  }
  const adj=new Map<string, string[]>()
  for (const n of nodes) adj.set(n.id, [])
  for (const e of edges) {
    if (!adj.has(e.source)) adj.set(e.source, [])
    adj.get(e.source)!.push(e.target)
  }
  const state = new Map<string, number>()
  let hasCycle = false
  const dfs = (id: string) => {
    if (hasCycle) return
    const s = state.get(id) || 0
    if (s === 1) {
      hasCycle = true
      return
    }
    if (s === 2) return
    state.set(id, 1)
    for (const nei of adj.get(id) || []) dfs(nei)
    state.set(id, 2)
  }
  for (const n of nodes) {
    if ((state.get(n.id) || 0) === 0) {
      dfs(n.id)
      if (hasCycle) break
    }
  }
  if (hasCycle) errors.push('Cycle detected in flow')
  if (nodes.length > 1) {
    const indegree = new Map<string, number>()
    for (const n of nodes) indegree.set(n.id, 0)
    for (const e of edges) {
      if (indegree.has(e.target))
        indegree.set(e.target, (indegree.get(e.target) || 0) + 1)
    }
    const zeroInNodes = Array.from(indegree.entries())
      .filter(([_, deg]) => deg === 0)
      .map(([id]) => id)
    if (zeroInNodes.length === 0) errors.push('Flow must have at least one entry node');
    else if (zeroInNodes.length > 1) errors.push('Flow must have exactly one entry node')
  }

  return { valid: errors.length === 0, errors }
}

