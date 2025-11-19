"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const promise_1 = __importDefault(require("mysql2/promise"));
const attendance_routes_1 = require("./routes/attendance.routes");
const location_routes_1 = require("./routes/location.routes");
const app = (0, express_1.default)();
app.use(body_parser_1.default.json());
const allowed = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        if (allowed.includes(origin))
            return callback(null, true);
        callback(new Error('CORS not allowed'));
    },
    credentials: true,
};
app.use((0, cors_1.default)(corsOptions));
// Database connection pool
const db = promise_1.default.createPool({
    host: process.env.DB_HOST || 'db',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || process.env.MYSQL_ROOT_PASSWORD || '',
    database: process.env.DB_NAME || 'zalo_app',
    waitForConnections: true,
    connectionLimit: 10,
});
// --- Legacy user profile endpoints ---
app.post('/api/user/profile', async (req, res) => {
    const { zalo_id, name, avatar_url } = req.body;
    if (!zalo_id) {
        res.status(400).json({ error: 'zalo_id is required' });
        return;
    }
    try {
        const [existing] = await db.query('SELECT id FROM users WHERE zalo_id = ?', [zalo_id]);
        if (existing.length === 0) {
            await db.query('INSERT INTO users (zalo_id, name, avatar_url) VALUES (?, ?, ?)', [
                zalo_id,
                name || null,
                avatar_url || null,
            ]);
        }
        else {
            await db.query('UPDATE users SET name = COALESCE(?, name), avatar_url = COALESCE(?, avatar_url) WHERE zalo_id = ?', [name, avatar_url, zalo_id]);
        }
        const [row] = await db.query('SELECT * FROM users WHERE zalo_id = ?', [zalo_id]);
        res.json({ data: row[0] });
    }
    catch (err) {
        console.error('POST /api/user/profile error', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.get('/api/user/profile', async (req, res) => {
    const { zalo_id } = req.query;
    if (!zalo_id) {
        res.status(400).json({ error: 'zalo_id is required' });
        return;
    }
    try {
        const [rows] = await db.query('SELECT * FROM users WHERE zalo_id = ?', [zalo_id]);
        res.json({ data: rows[0] ?? null });
    }
    catch (err) {
        console.error('GET /api/user/profile error', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.put('/api/user/profile', async (req, res) => {
    const { zalo_id, role } = req.body;
    if (!zalo_id) {
        res.status(400).json({ error: 'zalo_id is required' });
        return;
    }
    try {
        await db.query('UPDATE users SET role = ? WHERE zalo_id = ?', [role, zalo_id]);
        const [rows] = await db.query('SELECT * FROM users WHERE zalo_id = ?', [zalo_id]);
        res.json({ data: rows[0] ?? null });
    }
    catch (err) {
        console.error('PUT /api/user/profile error', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// --- New attendance and location routes ---
app.use('/api/attendance', (0, attendance_routes_1.createAttendanceRoutes)(db));
app.use('/api/location', (0, location_routes_1.createLocationRoutes)());
const PORT = parseInt(process.env.PORT || '3001', 10);
app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
});
//# sourceMappingURL=app.js.map