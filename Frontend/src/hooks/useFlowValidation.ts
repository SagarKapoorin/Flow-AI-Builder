import { useMemo } from 'react'
import type { Flow } from '../types/flow.types'

//added pure validation for use on save
export function validateFlow(flow: Flow) {
  const errors: string[] = []
  const ids = new Set<string>()
  for (const n of flow.nodes) {
    if (ids.has(n.id)) errors.push(`Duplicate node id: ${n.id}`)
    ids.add(n.id)
  }
  const nodeIds = new Set(flow.nodes.map((n) => n.id))
  for (const e of flow.edges) {
    if (!nodeIds.has(e.source)) errors.push(`Edge ${e.id} has unknown source ${e.source}`)
    if (!nodeIds.has(e.target)) errors.push(`Edge ${e.id} has unknown target ${e.target}`)
  }
  if (flow.nodes.length > 1) {
    const indegree = new Map<string, number>()
    for (const n of flow.nodes) indegree.set(n.id, 0)
    for (const e of flow.edges) indegree.set(e.target, (indegree.get(e.target) || 0) + 1)
    const zeroIn = Array.from(indegree.values()).filter((v) => v === 0).length
    if (zeroIn > 1) errors.push('Cannot save Flow')
  }
  return { valid: errors.length === 0, errors }
}

//added hook wrapper kept for potential future use
export function useFlowValidation(flow: Flow) {
  return useMemo(() => validateFlow(flow), [flow])
}
