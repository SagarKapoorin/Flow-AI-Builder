import type { Request, Response, NextFunction } from 'express'
import type { FlowGraph } from '../types/flow.types'
import { validateFlowGraph } from '../validation/flowValidation'
import {
  createFlow,
  listFlows,
  getFlowById,
  updateFlow,
  deleteFlow,
  FlowValidationError,
} from '../services/flow.service'


//this funciton handle create new flow api
export async function createFlowHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, description, ownerId, nodes, edges } = req.body || {}
    if (!name || typeof name !== 'string')
      return res.status(400).json({ message: 'name is required' })
 const graph: FlowGraph = { nodes: nodes || [], edges: edges || [] }
    const validation = validateFlowGraph(graph)
    if (!validation.valid) return res.status(400).json({ valid: false, errors: validation.errors })
//console.log("Flow validation passed");
        const flow = await createFlow({ name, description, ownerId, ...graph })
    return res.status(201).json(flow)
  } catch (err) {
    if (err instanceof FlowValidationError)
      return res.status(400).json({ valid: false, errors: err.errors })
    return next(err)
  }
}

export async function listFlowsHandler(req: Request, res: Response, next: NextFunction) {
  try {
                       const page = Number(req.query.page || 1)
    const pageSize = Number(req.query.pageSize || 20)
    const ownerId =
      typeof req.query.ownerId === 'string' ? (req.query.ownerId as string) : undefined

    const result = await listFlows({ page, pageSize, ownerId })
    console.log(page, pageSize);
    return res.json(result)
  } catch (err) {
    return next(err)
  }
}
//this funciton handle get flow by id api
export async function getFlowByIdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const flow = await getFlowById(id)
    if (!flow) return res.status(404).json({ message: 'Flow not found' })
    return res.json(flow)
  } catch (err) {
    return next(err)
  }
}

//this funciton handle update flow by id api
export async function updateFlowHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const { name, description, ownerId, nodes, edges } = req.body || {}
    if (!name || typeof name !== 'string')
      return res.status(400).json({ message: 'name is required' })
    const graph: FlowGraph = { nodes: nodes || [], edges: edges || [] }
    const validation = validateFlowGraph(graph)
    if (!validation.valid) return res.status(400).json({ valid: false, errors: validation.errors })

    const flow = await updateFlow(id, { name, description, ownerId, ...graph })
    if (!flow) return res.status(404).json({ message: 'Flow not found' })
    return res.json(flow)
  } catch (err) {
    if (err instanceof FlowValidationError)
      return res.status(400).json({ valid: false, errors: err.errors })
    return next(err)
  }
}

//this funciton handle delete flow by id api
export async function deleteFlowHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const ok = await deleteFlow(id)
    if (!ok) return res.status(404).json({ message: 'Flow not found' })
    return res.json({ success: true })
  } catch (err) {
    return next(err)
  }
}
