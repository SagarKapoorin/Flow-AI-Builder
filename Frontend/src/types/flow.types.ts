import type { Node, Edge } from '@xyflow/react'
export type NodeType = 'text' | 'image' | 'button' | 'conditional'
//added per node type data contracts

// differnet nod type
export type TextNodeData = { text: string }
export type ImageNodeData = { imageUrl: string; caption?: string }
export type ButtonNodeData = { text: string; buttons: Array<{ label: string; value: string }> }
export type ConditionalNodeData = { variable: string; condition: string }

export type NodeDataByType = {
  text: TextNodeData
  image: ImageNodeData
  button: ButtonNodeData
  conditional: ConditionalNodeData
}

//React Flow node variants creatinon
export type TextRFNode = Node<TextNodeData, 'text'>
export type ImageRFNode = Node<ImageNodeData, 'image'>
export type ButtonRFNode = Node<ButtonNodeData, 'button'>
export type ConditionalRFNode = Node<ConditionalNodeData, 'conditional'>

export type AppRFNode = TextRFNode | ImageRFNode | ButtonRFNode | ConditionalRFNode
//added single union consumed across the app
export type RFEdge = Edge

export type Flow = { nodes: AppRFNode[]; edges: RFEdge[] }
