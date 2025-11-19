import { Pool, RowDataPacket } from 'mysql2/promise';
export interface AttendanceRecord extends RowDataPacket {
    id?: number;
    zalo_id: string;
    type: 'check_in' | 'check_out';
    latitude: string;
    longitude: string;
    distance_from_office: number;
    status: 'success' | 'failed';
    reason?: string | null;
    created_at?: string;
}
interface RadiusValidation {
    isValid: boolean;
    distance: number;
}
/**
 * Validate if user is within allowed radius
 */
export declare function isWithinAllowedRadius(userLat: number, userLon: number): RadiusValidation;
/**
 * Record attendance (check-in or check-out)
 */
export declare function recordAttendance(db: Pool, record: AttendanceRecord): Promise<AttendanceRecord>;
/**
 * Get today's attendance records for a user
 */
export declare function getTodayAttendance(db: Pool, zaloId: string): Promise<AttendanceRecord[]>;
export {};
//# sourceMappingURL=attendance.service.d.ts.map