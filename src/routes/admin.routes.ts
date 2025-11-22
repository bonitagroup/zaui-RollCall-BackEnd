import { Request, Response, Router, NextFunction } from 'express';
import { Pool } from 'mysql2/promise';

const isAdmin = (db: Pool) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    const admin_zalo_id = req.query.admin_zalo_id as string | undefined;

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

  router.get('/attendance-stats', checkAdmin, async (req: Request, res: Response) => {
    try {
      const { target_zalo_id, month } = req.query;
      res.json({
        success: true,
        data: {
          summary: {
            actual_days: 18.99,
            standard_days: 24,
            late_times: 1,
            leave_days: 1.99,
          },
          daily_records: [
            {
              date: '2024-03-11',
              day_of_week: 'T6',
              shifts: [
                {
                  name: 'Khung giờ 1',
                  check_in_plan: '08:30',
                  check_in_actual: '08:25',
                  check_in_status: 'early',
                  check_out_plan: '12:00',
                  check_out_actual: '11:55',
                  check_out_status: 'early',
                },
                {
                  name: 'Khung giờ 2',
                  check_in_plan: '13:00',
                  check_in_actual: '13:00',
                  check_in_status: 'on_time',
                  check_out_plan: '18:00',
                  check_out_actual: null,
                  check_out_status: 'missing',
                },
              ],
            },
          ],
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}
