import { Router } from 'express';
import { Pool } from 'mysql2/promise';
import { createUserController } from '../controllers/user.controller';

export function createUserRoutes(db: Pool): Router {
  const router = Router();
  const controller = createUserController(db);

  router.get('/me', controller.getMyProfile);
  router.put('/update', controller.updateProfile);
  router.post('/phone', controller.getPhoneNumber);
  router.delete('/:zalo_id', controller.deleteUser);

  return router;
}
