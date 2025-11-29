import { Request, Response } from 'express';
import { Pool } from 'mysql2/promise';

export function createTaskController(db: Pool) {
  return {
    // lay danh sách kèm trạng thái Bận và rảnh
    getEmpStatus: async (req: Request, res: Response) => {
      const sql = `
            SELECT u.zalo_id, u.name, u.avatar_url, u.role,
            (SELECT COUNT(*) FROM tasks t WHERE t.assignee_id = u.zalo_id AND t.status IN ('pending', 'rework')) as active_tasks
            FROM users u
            WHERE u.role != 'admin'
        `;
      const [rows] = await db.query(sql);
      res.json({ success: true, data: rows });
    },

    //  Lấy tasks
    getTasks: async (req: Request, res: Response) => {
      const { zalo_id, type } = req.query;
      let sql = `SELECT t.*, u.name as assignee_name, u.avatar_url as assignee_avatar 
                   FROM tasks t JOIN users u ON t.assignee_id = u.zalo_id`;

      const params = [];

      if (type === 'my_tasks' && zalo_id) {
        sql += ` WHERE t.assignee_id = ?`;
        params.push(zalo_id);
      } else {
        if (zalo_id) {
          sql += ` WHERE t.assignee_id = ?`;
          params.push(zalo_id);
        }
      }

      sql += ` ORDER BY t.updated_at DESC`;
      const [rows] = await db.query(sql, params);
      res.json({ success: true, data: rows });
    },

    // Tạo task
    createTask: async (req: Request, res: Response) => {
      const { title, description, assignee_id, assigner_id, due_date, attachment_url } = req.body;
      await db.query(
        'INSERT INTO tasks (title, description, assignee_id, assigner_id, due_date, attachment_url) VALUES (?, ?, ?, ?, ?, ?)',
        [title, description, assignee_id, assigner_id, due_date, attachment_url || null]
      );
      res.json({ success: true });
    },

    // Cập nhật trạng thái
    updateStatus: async (req: Request, res: Response) => {
      try {
        const { id, status, report_content, report_image, progress } = req.body;

        let sql = 'UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP';
        const params: any[] = [status];

        if (report_content !== undefined) {
          sql += ', report_content = ?';
          params.push(report_content);
        }

        if (report_image !== undefined && report_image !== null) {
          sql += ', report_image = ?';
          params.push(report_image);
          console.log('✅ Will update report_image:', report_image);
        } else {
          console.log('⚠️ report_image is undefined or null, skipping update');
        }

        if (progress !== undefined) {
          sql += ', progress = ?';
          params.push(progress);
        }

        sql += ' WHERE id = ?';
        params.push(id);

        console.log('🛠 SQL:', sql);
        console.log('📋 Params:', params);

        const [result]: any = await db.query(sql, params);

        console.log('✅ Update Result:', result.affectedRows + ' dòng thay đổi.');
        console.log('-------------------------------------------');

        res.json({ success: true });
      } catch (err: any) {
        console.error('❌ Update Error:', err);
        res.status(500).json({ success: false, error: err.message });
      }
    },

    //  Xóa task
    deleteTask: async (req: Request, res: Response) => {
      const { id } = req.query;
      await db.query('DELETE FROM tasks WHERE id = ?', [id]);
      res.json({ success: true });
    },
  };
}
