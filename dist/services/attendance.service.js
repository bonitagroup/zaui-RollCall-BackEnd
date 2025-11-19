"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isWithinAllowedRadius = isWithinAllowedRadius;
exports.recordAttendance = recordAttendance;
exports.getTodayAttendance = getTodayAttendance;
const distance_util_1 = require("../utils/distance.util");
const zalo_config_1 = require("../config/zalo.config");
/**
 * Validate if user is within allowed radius
 */
function isWithinAllowedRadius(userLat, userLon) {
    const distance = (0, distance_util_1.calculateDistance)(zalo_config_1.locationConfig.officeLatitude, zalo_config_1.locationConfig.officeLongitude, userLat, userLon);
    return {
        isValid: distance <= zalo_config_1.locationConfig.allowedRadius,
        distance,
    };
}
/**
 * Record attendance (check-in or check-out)
 */
async function recordAttendance(db, record) {
    try {
        const query = `
      INSERT INTO attendance_records 
      (zalo_id, type, latitude, longitude, distance_from_office, status, reason)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
        const values = [
            record.zalo_id,
            record.type,
            record.latitude,
            record.longitude,
            record.distance_from_office,
            record.status,
            record.reason || null,
        ];
        const [result] = (await db.query(query, values));
        const insertId = result.insertId;
        // Retrieve the inserted record
        const [rows] = (await db.query('SELECT * FROM attendance_records WHERE id = ?', [insertId]));
        return rows[0];
    }
    catch (error) {
        console.error('Record attendance error:', error);
        throw error;
    }
}
/**
 * Get today's attendance records for a user
 */
async function getTodayAttendance(db, zaloId) {
    try {
        const [rows] = (await db.query(`SELECT * FROM attendance_records 
       WHERE zalo_id = ? AND DATE(created_at) = CURDATE()
       ORDER BY created_at DESC`, [zaloId]));
        return rows;
    }
    catch (error) {
        console.error('Get today attendance error:', error);
        throw error;
    }
}
//# sourceMappingURL=attendance.service.js.map