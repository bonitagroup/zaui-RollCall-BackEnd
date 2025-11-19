import { Request, Response, Router, NextFunction } from 'express';
import { Pool } from 'mysql2/promise';

/**
 * Middleware bảo mật: Kiểm tra xem người gọi API có phải Admin không
 * Nó sẽ kiểm tra 'admin_zalo_id' được gửi kèm trong query
 */
const isAdmin = (db: Pool) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    const admin_zalo_id = req.query.admin_zalo_id as string | undefined;

    if (!admin_zalo_id) {
      return res.status(401).json({ success: false, error: 'admin_zalo_id is required' });
    }

    const [rows] = await db.query('SELECT role FROM users WHERE zalo_id = ?', [admin_zalo_id]);
    const user = (rows as any[])[0];

    if (user && user.role === 'admin') {
      next(); // Là admin, cho phép đi tiếp
    } else {
      res.status(403).json({ success: false, error: 'Forbidden: You are not an admin' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Tạo các routes cho Admin
 */
export function createAdminRoutes(db: Pool): Router {
  const router = Router();
  const checkAdmin = isAdmin(db); // Tạo middleware check Admin

  // [GET] /api/admin/users
  // Lấy tất cả user để hiển thị trong trang quản lý
  router.get('/users', checkAdmin, async (req: Request, res: Response) => {
    try {
      // Lấy tất cả user, sắp xếp theo role
      const [rows] = await db.query(
        'SELECT id, zalo_id, name, avatar_url, role FROM users ORDER BY role DESC, name ASC'
      );
      res.json({ success: true, data: rows });
    } catch (err: any) {
      console.error('GET /admin/users error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Lưu ý: API để "Set Role" chúng ta sẽ dùng lại API cũ của bạn:
  // [PUT] /api/user/profile
  // Trang Admin mới sẽ gọi API này

  return router;
}
