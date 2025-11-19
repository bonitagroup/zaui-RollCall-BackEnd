import { Request, Response } from 'express';
import { Pool } from 'mysql2/promise';
/**
 * POST /api/attendance/check-in
 */
export declare function checkIn(db: Pool): Promise<(req: Request, res: Response) => Promise<void>>;
/**
 * POST /api/attendance/check-out
 */
export declare function checkOut(db: Pool): Promise<(req: Request, res: Response) => Promise<void>>;
/**
 * GET /api/attendance/today
 */
export declare function getTodayRecords(db: Pool): Promise<(req: Request, res: Response) => Promise<void>>;
//# sourceMappingURL=attendance.controller.d.ts.map