import { Router } from 'express';
import { Pool } from 'mysql2/promise';
import { createAttendanceController } from '../controllers/attendance.controller';

export function createAttendanceRoutes(db: Pool): Router {
  const router = Router();
  const controller = createAttendanceController(db);

  // Lấy toàn bộ lịch sử của 1 người dùng
  router.get('/history', controller.getHistory);

  // Lấy bản ghi hôm nay của 1 người dùng
  router.get('/today', controller.getToday);

  // Xử lý Check-in
  router.post('/check-in', controller.checkIn);

  // Xử lý Check-out
  router.post('/check-out', controller.checkOut);

  return router;
}
