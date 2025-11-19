import { Router } from 'express';
import * as locationController from '../controllers/location.controller';

export function createLocationRoutes(): Router {
  const router: Router = Router();
  router.post('/convert-token', locationController.convertToken);
  return router;
}
