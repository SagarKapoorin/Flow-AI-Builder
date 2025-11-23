import type { Request, Response, NextFunction } from 'express'
import mongoose from 'mongoose'
import { FlowValidationError } from '../services/flow.service'

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  console.error(err)
  if (err instanceof FlowValidationError)
    return res.status(400).json({ valid: false, errors: err.errors })
  if (err instanceof mongoose.Error.ValidationError)
    return res.status(400).json({ message: 'Validation error', details: err.message })
  return res.status(500).json({ message: 'Internal server error' })
}

