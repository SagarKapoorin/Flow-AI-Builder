import { Router } from 'express'
import {
  createFlowHandler,
  listFlowsHandler,
  getFlowByIdHandler,
  updateFlowHandler,
  deleteFlowHandler,
  validateFlowForIdHandler,
} from '../controllers/flows.controller'

const router = Router()

//this funciton define flow managment routes
router.post('/', createFlowHandler)
router.get('/', listFlowsHandler)
router.get('/:id', getFlowByIdHandler)
router.put('/:id', updateFlowHandler)
router.delete('/:id', deleteFlowHandler)
router.post('/:id/validate', validateFlowForIdHandler)

export default router
