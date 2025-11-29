import { Request, Response } from 'express';
import { Pool } from 'mysql2/promise';
import axios from 'axios';

export function createUserController(db: Pool) {
  const ZALO_APP_SECRET = process.env.ZALO_APP_SECRET;

  return {
    getMyProfile: async (req: Request, res: Response) => {
      const { zalo_id } = req.query;
      if (!zalo_id) {
        return res.status(400).json({ error: 'zalo_id is required' });
      }

      try {
        const [rows]: any = await db.query('SELECT * FROM users WHERE zalo_id = ?', [zalo_id]);
        res.json({ success: true, data: rows[0] ?? null });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    },

    updateProfile: async (req: Request, res: Response) => {
      try {
        const { zalo_id, real_name, phone, email, address, birthday, avatar_url, role } = req.body;

        if (!zalo_id) return res.status(400).json({ success: false, message: 'Thiếu zalo_id' });

        const formatBirth = birthday || null;

        await db.query(
          `
            UPDATE users 
            SET 
                name = COALESCE(?, name), 
                phone = COALESCE(?, phone), 
                email = COALESCE(?, email), 
                address = COALESCE(?, address), 
                birthday = COALESCE(?, birthday), 
                avatar_url = COALESCE(?, avatar_url),
                role = COALESCE(?, role)
            WHERE zalo_id = ?
        `,
          [real_name, phone, email, address, formatBirth, avatar_url, role, zalo_id]
        );

        res.json({ success: true, message: 'Cập nhật thành công' });
      } catch (error: any) {
        console.error('Update Profile Error:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    },

    deleteUser: async (req: Request, res: Response) => {
      try {
        const { zalo_id } = req.params;

        if (!zalo_id) return res.status(400).json({ success: false, message: 'Thiếu zalo_id' });

        await db.query('DELETE FROM users WHERE zalo_id = ?', [zalo_id]);

        res.json({ success: true, message: 'Đã xóa nhân viên thành công' });
      } catch (error: any) {
        console.error('Delete User Error:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    },

    getPhoneNumber: async (req: Request, res: Response) => {
      const { token, access_token } = req.body;

      if (!token || !access_token) {
        return res
          .status(400)
          .json({ success: false, message: 'Thiếu token hoặc access_token từ Frontend' });
      }

      if (!ZALO_APP_SECRET) {
        console.error('Lỗi: ZALO_APP_SECRET đang bị thiếu hoặc undefined');
        return res
          .status(500)
          .json({ success: false, message: 'Chưa cấu hình Secret Key trên Server' });
      }

      try {
        const response = await axios.get('https://graph.zalo.me/v2.0/me/info', {
          headers: {
            access_token: access_token,
            code: token,
            secret_key: ZALO_APP_SECRET,
          },
        });

        const { data } = response;

        if (data && data.data && data.data.number) {
          return res.json({
            success: true,
            phone: data.data.number,
          });
        } else {
          console.error('Zalo Graph API Error:', data);
          return res.status(400).json({
            success: false,
            message: 'Không giải mã được SĐT. Vui lòng thử lại.',
            zalo_error: data,
          });
        }
      } catch (error: any) {
        console.error('Server Error:', error.message);
        return res.status(500).json({ success: false, error: error.message });
      }
    },
  };
}
