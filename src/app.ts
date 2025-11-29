import 'dotenv/config';
import express, { Express, Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import mysql, { Pool } from 'mysql2/promise';
import { createAttendanceRoutes } from './routes/attendance.routes';
import { createLocationRoutes } from './routes/location.routes';
import { createAdminRoutes } from './routes/admin.routes';
import { createTaskRoutes } from './routes/admin.routes';
import { createLeaveRoutes } from './routes/leave.routes';
import { createUserRoutes } from './routes/user.routes';
import uploadRoutes from './routes/upload.routes';
import path from 'path';

const app: Express = express();
app.use(bodyParser.json());

const defaultAllowedOrigins = ['https://h5.zdn.vn', 'zbrowser://'];

const envAllowedOrigins: string[] = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin: string) => origin.trim())
  .filter((origin: string) => origin.length > 0);

const allowedOrigins = [...defaultAllowedOrigins, ...envAllowedOrigins];

interface CorsOptions {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) => void;
  credentials: boolean;
  allowedHeaders?: string[]; // Thêm dòng này để TypeScript không báo lỗi
}

const corsOptions: CorsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ): void => {
    // Cho phép request không có origin
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Cập nhật thêm các domain Tunnel phổ biến
    if (
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      origin.endsWith('.ngrok-free.app') ||
      origin.endsWith('.trycloudflare.com') ||
      origin.endsWith('.pinggy.link') ||
      origin.endsWith('.lhr.life')
    ) {
      return callback(null, true);
    }

    console.error(`Blocked by CORS: ${origin}`);
    callback(new Error('CORS not allowed'));
  },
  credentials: true,
  // --- QUAN TRỌNG: Thêm dòng này để fix lỗi Ngrok ---
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'ngrok-skip-browser-warning',
    'bypass-tunnel-reminder',
    'X-Requested-With',
    'access_token',
    'code',
    'secret_key',
  ],
};

app.use(cors(corsOptions as any));

const db: Pool = mysql.createPool({
  host: process.env.DB_HOST || 'db',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || process.env.MYSQL_ROOT_PASSWORD || '',
  database: process.env.DB_NAME || 'zalo_app',
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true,
});

// --- CODE CŨ CỦA BẠN (GIỮ NGUYÊN) ---
app.post('/api/user/profile', async (req: Request, res: Response): Promise<void> => {
  const { zalo_id, name, avatar_url } = req.body;
  if (!zalo_id) {
    res.status(400).json({ error: 'zalo_id is required' });
    return;
  }
  try {
    const [existing] = await db.query('SELECT id FROM users WHERE zalo_id = ?', [zalo_id]);
    if ((existing as any[]).length === 0) {
      await db.query('INSERT INTO users (zalo_id, name, avatar_url) VALUES (?, ?, ?)', [
        zalo_id,
        name || null,
        avatar_url || null,
      ]);
    } else {
      await db.query(
        'UPDATE users SET name = COALESCE(?, name), avatar_url = COALESCE(?, avatar_url) WHERE zalo_id = ?',
        [name, avatar_url, zalo_id]
      );
    }
    const [row] = await db.query('SELECT * FROM users WHERE zalo_id = ?', [zalo_id]);
    res.json({ data: (row as any[])[0] });
  } catch (err) {
    console.error('POST /api/user/profile error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/user/profile', async (req: Request, res: Response): Promise<void> => {
  const { zalo_id } = req.query;
  if (!zalo_id) {
    res.status(400).json({ error: 'zalo_id is required' });
    return;
  }
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE zalo_id = ?', [zalo_id]);
    res.json({ data: (rows as any[])[0] ?? null });
  } catch (err) {
    console.error('GET /api/user/profile error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/user/profile', async (req: Request, res: Response): Promise<void> => {
  const { zalo_id, role } = req.body;
  if (!zalo_id) {
    res.status(400).json({ error: 'zalo_id is required' });
    return;
  }
  try {
    await db.query('UPDATE users SET role = ? WHERE zalo_id = ?', [role, zalo_id]);
    const [rows] = await db.query('SELECT * FROM users WHERE zalo_id = ?', [zalo_id]);
    res.json({ data: (rows as any[])[0] ?? null });
  } catch (err) {
    console.error('PUT /api/user/profile error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use('/api/files', express.static(path.join(process.cwd(), 'uploads')));

// 2. Các API Routes
app.use('/api/attendance', createAttendanceRoutes(db));
app.use('/api/location', createLocationRoutes());
app.use('/api/admin', createAdminRoutes(db));
app.use('/api/admin/task', createTaskRoutes(db));
app.use('/api/leave-requests', createLeaveRoutes(db));
app.use('/api/users', createUserRoutes(db));

app.use('/api', uploadRoutes);

const PORT: number = parseInt(process.env.PORT || '3001', 10);
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
  console.log('📂 Serving uploads from:', path.join(process.cwd(), 'uploads'));
});
