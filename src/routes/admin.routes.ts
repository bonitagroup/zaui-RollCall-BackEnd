import { Request, Response, Router, NextFunction } from 'express';
import { Pool } from 'mysql2/promise';
import { createTaskController } from '../controllers/task.controller';
import { createSalaryController } from '../controllers/salary.controller';

const isAdmin = (db: Pool) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    const admin_zalo_id = (req.query.admin_zalo_id as string) || req.body.zalo_id;

    if (!admin_zalo_id) {
      return res.status(401).json({ success: false, error: 'admin_zalo_id is required' });
    }

    const [rows] = await db.query('SELECT role FROM users WHERE zalo_id = ?', [admin_zalo_id]);
    const user = (rows as any[])[0];

    if (user && user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ success: false, error: 'Forbidden: You are not an admin' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export function createAdminRoutes(db: Pool): Router {
  const router = Router();
  const checkAdmin = isAdmin(db);
  const salaryController = createSalaryController(db);

  // API lấy danh sách nhân sự
  router.get('/users', checkAdmin, async (req: Request, res: Response) => {
    try {
      const [rows] = await db.query(
        'SELECT id, zalo_id, name, avatar_url, role FROM users ORDER BY role DESC, name ASC'
      );
      res.json({ success: true, data: rows });
    } catch (err: any) {
      console.error('GET /admin/users error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // API Lương: Lấy bảng lương
  router.get('/salary-stats', checkAdmin, salaryController.getSalaryStats);

  // API Lương: Thêm thưởng/phạt thủ công
  router.post('/salary-adjust', checkAdmin, salaryController.addAdjustment);
  router.delete('/salary-adjust/:id', checkAdmin, salaryController.deleteAdjustment);

  return router;
}

export function createTaskRoutes(db: Pool): Router {
  const router = Router();
  const controller = createTaskController(db);

  // Các API Task
  router.get('/employees', controller.getEmpStatus);
  router.get('/list', controller.getTasks);
  router.post('/create', controller.createTask);
  router.put('/update', controller.updateStatus);
  router.delete('/delete', controller.deleteTask);

  return router;
}
