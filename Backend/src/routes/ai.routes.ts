import { Router } from 'express'
import {
  flowRecommendationsHandler,
  generateFlowFromBriefHandler,
  generateImageHandler,
  writeTextHandler,
} from '../controllers/ai.controller'
const router = Router()
router.post('/flow-recommendations', flowRecommendationsHandler)
router.post('/generate-flow-from-brief', generateFlowFromBriefHandler)
router.post('/generate-image', generateImageHandler)
router.post('/write-text', writeTextHandler)

export default router
