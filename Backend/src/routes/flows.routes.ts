import { Router } from 'express'
import {
  createFlowHandler,
  listFlowsHandler,
  getFlowByIdHandler,
  updateFlowHandler,
  deleteFlowHandler,
} from '../controllers/flows.controller'

const router = Router()

router.post('/', createFlowHandler)
router.get('/', listFlowsHandler)
router.get('/:id', getFlowByIdHandler)
router.put('/:id', updateFlowHandler)
router.delete('/:id', deleteFlowHandler)

export default router
