export type NodeType = 'text' | 'image' | 'button' | 'conditional'
export interface Position {
  x: number
  y: number
}
export interface TextNodeData {
  text: string
}
export interface ImageNodeData {
  imageUrl: string
  caption?: string
}
export interface ButtonNodeData {
  text: string
  buttons: { label: string; value: string }[]
}

export interface ConditionalNodeData {
  variable: string
  condition: string
}

export interface NodeDataByType {
  text: TextNodeData
  image: ImageNodeData
  button: ButtonNodeData
  conditional: ConditionalNodeData
}
export interface BaseNode<TType extends NodeType = NodeType, TData = unknown> {
  id: string
  type: TType
  position: Position
  data: TData
}
export type TextNode = BaseNode<'text', TextNodeData>
export type ImageNode = BaseNode<'image', ImageNodeData>
export type ButtonNode = BaseNode<'button', ButtonNodeData>
export type ConditionalNode = BaseNode<'conditional', ConditionalNodeData>
export type AppNode = TextNode | ImageNode | ButtonNode | ConditionalNode
export interface AppEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string | null
  targetHandle?: string | null
  type?: string
}
export interface FlowGraph {
  nodes: AppNode[]
  edges: AppEdge[]
}
export interface Flow extends FlowGraph {
  id?: string
  name: string
  description?: string
  ownerId?: string
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date | null
}
export interface FlowRecommendationsRequest {
  currentFlow: FlowGraph & {
    goal?: string
    targetAudience?: string
  }
}export interface FlowRecommendationsResponse {
  recommendations: string[]
  suggestedChanges?: FlowGraph
}
export interface GenerateFlowFromBriefRequest {
  brief: string
  preferences?: {
    maxDepth?: number
    style?: 'support' | 'sales' | 'faq'
  }
}



export interface GenerateFlowFromBriefResponse extends FlowGraph {}

export interface GenerateImageRequest {
  prompt: string
  size?: '1024x1024' | '1024x1536' | '1536x1024' | 'auto'
}

export interface GenerateImageResponse {
  imageUrl: string
}

export interface WriteTextRequest {
  prompt: string
  style?: 'support' | 'sales' | 'faq' | 'generic'
  length?: 'short' | 'medium' | 'long'
}

export interface WriteTextResponse {
  text: string
}
