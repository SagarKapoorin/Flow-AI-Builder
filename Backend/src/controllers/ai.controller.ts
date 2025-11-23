import type { Request, Response, NextFunction } from 'express'
import type {
  FlowRecommendationsRequest,
  GenerateFlowFromBriefRequest,
  GenerateImageRequest,
  WriteTextRequest,
} from '../types/flow.types'
import {
  getFlowRecommendations,
  generateFlowFromBrief,
  generateImage,
  writeText,
} from '../services/ai.service'

//this funciton handle ai flow recomend api
export async function flowRecommendationsHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const body = req.body;
    // console.log("Flow Recommendations Request Body:", body);
    if (!body || !body.currentFlow)
      return res.status(400).json({ message: 'currentFlow is required' })
    const result = await getFlowRecommendations(body)
    return res.json(result)
  } catch (err) {
    return next(err)
  }
}

//this funciton handle ai flow generate api
export async function generateFlowFromBriefHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const body = req.body as GenerateFlowFromBriefRequest
    if (!body || !body.brief) return res.status(400).json({ message: 'brief is required' })

    const result = await generateFlowFromBrief(body)
    return res.json(result)
  } catch (err: any) {
    if (err && err.name === 'AIFlowGenerationError')
      return res.status(502).json({
        message: err.message || 'Model produced an invalid flow graph',
        errors: err.validationErrors || [],
      })
    return next(err)
  }
}

//this funciton handle ai image generate api
export async function generateImageHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const body = req.body as GenerateImageRequest
    if (!body || !body.prompt) return res.status(400).json({ message: 'prompt is required' })

    const result = await generateImage(body)
    return res.json(result)
  } catch (err) {
    return next(err)
  }
}

//this funciton handle ai text write api
export async function writeTextHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as WriteTextRequest
    if (!body || !body.prompt) return res.status(400).json({ message: 'prompt is required' })

    const result = await writeText(body)
    return res.json(result)
  } catch (err) {
    return next(err)
  }
}
