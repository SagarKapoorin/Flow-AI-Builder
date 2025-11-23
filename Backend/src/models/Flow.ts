import mongoose, { Schema, type Document, type Model } from 'mongoose'
import type { AppNode, AppEdge, Flow } from '../types/flow.types'

export interface FlowDocument extends Document {
  name: string
  description?: string
  ownerId?: string
  nodes: AppNode[]
  edges: AppEdge[]
  deletedAt: Date | null
  createdAt: Date
  updatedAt: Date
}





const PositionSchema = new Schema(
  {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
  },
  { _id: false }
)

const NodeDataSchema = new Schema(
  {
    text: { type: String },
    imageUrl: { type: String },
    caption: { type: String },
    variable: { type: String },
    condition: { type: String },
    buttons: [
      {
        label: { type: String },
        value: { type: String },
      },
    ],
  },
  { _id: false, strict: false }
)

const NodeSchema = new Schema<AppNode>(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ['text', 'image', 'button', 'conditional'],
    },
    position: { type: PositionSchema, required: true },
    data: { type: NodeDataSchema, required: true },
  },
  { _id: false }
)
const EdgeSchema = new Schema<AppEdge>(
  {
    id: { type: String, required: true },
    source: { type: String, required: true },
    target: { type: String, required: true },
    sourceHandle: { type: String, default: null },
    targetHandle: { type: String, default: null },
    type: { type: String, default: 'default' },
  },
  { _id: false }
)

const FlowSchema = new Schema<FlowDocument>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    ownerId: { type: String, index: true },
    nodes: { type: [NodeSchema], default: [] },
    edges: { type: [EdgeSchema], default: [] },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

FlowSchema.set('toObject', {
  versionKey: false,
  transform(_doc, ret: any) {
    ret.id = ret._id.toString()
    delete ret._id
    return ret as Flow
  },
})




export const FlowModel: Model<FlowDocument> =
  mongoose.models.Flow || mongoose.model<FlowDocument>('Flow', FlowSchema)

