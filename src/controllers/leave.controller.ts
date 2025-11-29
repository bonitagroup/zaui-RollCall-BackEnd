import { Request, Response } from 'express';
import { Pool } from 'mysql2/promise';

export function createLeaveController(db: Pool) {
  return {
    createLeaveRequest: async (req: Request, res: Response) => {
      try {
        const { zalo_id, reason, start_date, end_date, start_session, end_session } = req.body;

        if (!zalo_id || !start_date || !end_date) {
          return res.status(400).json({ success: false, message: 'Thiếu thông tin' });
        }

        const formatDBDate = (d: string) => new Date(d).toISOString().split('T')[0];

        await db.query(
          `INSERT INTO leave_requests (zalo_id, reason, start_date, end_date, start_session, end_session, status) 
           VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
          [
            zalo_id,
            reason,
            formatDBDate(start_date),
            formatDBDate(end_date),
            start_session || 'morning',
            end_session || 'afternoon',
          ]
        );

        res.json({ success: true, message: 'Created' });
      } catch (error: any) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
      }
    },

    getAllLeaves: async (req: Request, res: Response) => {
      try {
        const [rows] = await db.query(`
          SELECT l.*, u.name, u.avatar_url 
          FROM leave_requests l
          JOIN users u ON l.zalo_id = u.zalo_id
          ORDER BY l.created_at DESC
        `);
        res.json({ success: true, data: rows });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    },

    deleteLeaveRequest: async (req: Request, res: Response) => {
      try {
        const { id } = req.params;

        if (!id) return res.status(400).json({ success: false, message: 'Thiếu ID' });

        await db.query('DELETE FROM leave_requests WHERE id = ?', [id]);

        res.json({ success: true, message: 'Đã xóa đơn' });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    },

    updateLeaveStatus: async (req: Request, res: Response) => {
      try {
        const { id, status } = req.body;

        if (!id || !['approved', 'rejected'].includes(status)) {
          return res.status(400).json({ success: false, error: 'Invalid status' });
        }

        await db.query('UPDATE leave_requests SET status = ? WHERE id = ?', [status, id]);

        res.json({ success: true });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    },

    getMyLeaves: async (req: Request, res: Response) => {
      try {
        const { zalo_id } = req.query;
        if (!zalo_id) return res.status(400).json({ error: 'Thiếu zalo_id' });

        const [rows] = await db.query(
          'SELECT * FROM leave_requests WHERE zalo_id = ? ORDER BY created_at DESC',
          [zalo_id]
        );
        res.json({ success: true, data: rows });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    },

    getMonthlyStatsWithLeaves: async (req: Request, res: Response) => {},
  };
}
