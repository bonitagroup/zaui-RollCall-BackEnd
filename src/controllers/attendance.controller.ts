import { Request, Response } from 'express';
import { Pool } from 'mysql2/promise';
/**
 * Lấy ngày YYYY-MM-DD an toàn theo múi giờ Việt Nam
 */
const getTodayDateString = (): string => {
  const d = new Date();
  // Dùng toLocaleString 'sv' (Thụy Điển) để có định dạng YYYY-MM-DD
  return d.toLocaleString('sv', { timeZone: 'Asia/Ho_Chi_Minh' }).slice(0, 10);
};

export function createAttendanceController(db: Pool) {
  return {
    // 1. Xử lý CHECK IN
    checkIn: async (req: Request, res: Response) => {
      try {
        const { zalo_id, shiftKey } = req.body;
        const today = getTodayDateString(); // <-- Dùng hàm mới
        const now = new Date();

        if (!zalo_id || !shiftKey) {
          return res.status(400).json({ error: 'zalo_id and shiftKey are required' });
        }

        const fieldToUpdate = shiftKey === 'morning' ? 'check_in_morning' : 'check_in_afternoon';

        const sql = `
          INSERT INTO attendance_records (zalo_id, \`date\`, ${fieldToUpdate})
          VALUES (?, ?, ?)
          ON DUPLICATE KEY UPDATE
          ${fieldToUpdate} = COALESCE(${fieldToUpdate}, VALUES(${fieldToUpdate}))
        `;

        await db.query(sql, [zalo_id, today, now]);

        const [rows] = await db.query(
          'SELECT * FROM attendance_records WHERE zalo_id = ? AND `date` = ?',
          [zalo_id, today]
        );

        res.json({ success: true, data: (rows as any[])[0] ?? null });
      } catch (err: any) {
        console.error('Check-in error:', err);
        res.status(500).json({ success: false, error: err.message });
      }
    },

    // 2. Xử lý CHECK OUT
    checkOut: async (req: Request, res: Response) => {
      try {
        const { zalo_id, shiftKey } = req.body;
        const today = getTodayDateString(); // <-- Dùng hàm mới
        const now = new Date();

        if (!zalo_id || !shiftKey) {
          return res.status(400).json({ error: 'zalo_id and shiftKey are required' });
        }

        const fieldToUpdate = shiftKey === 'morning' ? 'check_out_morning' : 'check_out_afternoon';

        const sql = `
          INSERT INTO attendance_records (zalo_id, \`date\`, ${fieldToUpdate})
          VALUES (?, ?, ?)
          ON DUPLICATE KEY UPDATE
          ${fieldToUpdate} = COALESCE(${fieldToUpdate}, VALUES(${fieldToUpdate}))
        `;

        await db.query(sql, [zalo_id, today, now]);

        const [rows] = await db.query(
          'SELECT * FROM attendance_records WHERE zalo_id = ? AND `date` = ?',
          [zalo_id, today]
        );

        res.json({ success: true, data: (rows as any[])[0] ?? null });
      } catch (err: any) {
        console.error('Check-out error:', err);
        res.status(500).json({ success: false, error: err.message });
      }
    },

    // 3. Lấy bản ghi HÔM NAY
    getToday: async (req: Request, res: Response) => {
      try {
        const { zalo_id } = req.query;
        const today = getTodayDateString(); // <-- Dùng hàm mới

        if (!zalo_id) {
          return res.status(400).json({ error: 'zalo_id is required' });
        }

        const [rows] = await db.query(
          'SELECT * FROM attendance_records WHERE zalo_id = ? AND `date` = ?',
          [String(zalo_id), today]
        );

        res.json({ success: true, data: (rows as any[])[0] ?? null });
      } catch (err: any) {
        console.error('Get today record error:', err);
        res.status(500).json({ success: false, error: err.message });
      }
    },

    // 4. Lấy TẤT CẢ LỊCH SỬ
    getHistory: async (req: Request, res: Response) => {
      try {
        const { zalo_id } = req.query;

        if (!zalo_id) {
          return res.status(400).json({ error: 'zalo_id is required' });
        }

        const [rows] = await db.query(
          'SELECT * FROM attendance_records WHERE zalo_id = ? ORDER BY `date` DESC',
          [String(zalo_id)]
        );

        res.json({ success: true, data: rows });
      } catch (err: any) {
        console.error('Get history error:', err);
        res.status(500).json({ success: false, error: err.message });
      }
    },
  };
}
