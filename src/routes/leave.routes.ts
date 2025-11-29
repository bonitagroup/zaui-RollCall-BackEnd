import { Router } from 'express';
import { Pool } from 'mysql2/promise';
import { createLeaveController } from '../controllers/leave.controller';

export function createLeaveRoutes(db: Pool): Router {
  const router = Router();
  const controller = createLeaveController(db);

  router.post('/', controller.createLeaveRequest);

  router.get('/list', controller.getAllLeaves);

  router.put('/status', controller.updateLeaveStatus);

  router.get('/mine', controller.getMyLeaves);

  router.delete('/:id', controller.deleteLeaveRequest);

  return router;
}
