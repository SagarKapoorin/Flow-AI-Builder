import { FlowModel, type FlowDocument } from '../models/Flow'
import type { Flow, FlowGraph } from '../types/flow.types'
import { validateFlowGraph } from '../validation/flowValidation'

export class FlowValidationError extends Error {
  public readonly errors: string[]
  constructor(errors: string[]) {
    super('Flow validation failed')
    this.name = 'FlowValidationError'
    this.errors = errors
  }
}
export interface CreateFlowInput extends FlowGraph {
  name: string
  description?: string
  ownerId?: string
}
export interface UpdateFlowInput extends FlowGraph {
  name: string
  description?: string
  ownerId?: string
}

export interface ListFlowsOptions {
  page?: number
  pageSize?: number
  ownerId?: string
}

export interface ListFlowsResult {
  items: Flow[]
  page: number
  pageSize: number
  total: number
}

//this funciton create new flow entery
export async function createFlow(input: CreateFlowInput): Promise<Flow> {
  const validation = validateFlowGraph({ nodes: input.nodes, edges: input.edges })
  if (!validation.valid) throw new FlowValidationError(validation.errors)
    // console.log("Flow validation passed");
  const doc = await FlowModel.create({
    name: input.name,
    description: input.description,
    ownerId: input.ownerId,
    nodes: input.nodes,
    edges: input.edges,
  })
  return doc.toObject()
}

//this funciton updat stored flow entery
export async function updateFlow(id: string, input: UpdateFlowInput): Promise<Flow | null> {
  const validation = validateFlowGraph({ nodes: input.nodes, edges: input.edges })
  if (!validation.valid) throw new FlowValidationError(validation.errors)

  const doc: FlowDocument | null = await FlowModel.findOneAndUpdate(
    { _id: id, deletedAt: null },
    {
      name: input.name,
      description: input.description,
      ownerId: input.ownerId,
      nodes: input.nodes,
      edges: input.edges,
    },
    { new: true }
  )
  return doc ? doc.toObject() : null
}

//this funciton get single flow by id
export async function getFlowById(id: string): Promise<Flow | null> {
  const doc = await FlowModel.findOne({ _id: id, deletedAt: null })
  return doc ? doc.toObject() : null
}

//this funciton list many flows paginat
export async function listFlows(options: ListFlowsOptions): Promise<ListFlowsResult> {
  const page = options.page && options.page > 0 ? options.page : 1
  const pageSize = options.pageSize && options.pageSize > 0 ? options.pageSize : 20
// console.log(page, pageSize);
  const query: Record<string, unknown> = { deletedAt: null }
  if (options.ownerId) query.ownerId = options.ownerId

  const [items, total] = await Promise.all([
    FlowModel.find(query)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .exec(),
    FlowModel.countDocuments(query).exec(),
  ])
  return {
    items: items.map((d) => d.toObject()),
    page,
    pageSize,
    total,
  }
}

//this funciton soft delete flow entery
export async function deleteFlow(id: string): Promise<boolean> {
  const result = await FlowModel.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { deletedAt: new Date() },
    { new: true }
  )
  return !!result
}
