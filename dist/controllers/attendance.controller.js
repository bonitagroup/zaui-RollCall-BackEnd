"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkIn = checkIn;
exports.checkOut = checkOut;
exports.getTodayRecords = getTodayRecords;
const location_service_1 = require("../services/location.service");
const attendance_service_1 = require("../services/attendance.service");
/**
 * POST /api/attendance/check-in
 */
async function checkIn(db) {
    return async (req, res) => {
        try {
            const { zalo_id, location_token } = req.body;
            if (!zalo_id || !location_token) {
                res.status(400).json({
                    error: 'zalo_id and location_token are required',
                });
                return;
            }
            // Convert token to coordinates
            const locationData = await (0, location_service_1.convertLocationToken)(location_token);
            const userLat = parseFloat(locationData.latitude);
            const userLon = parseFloat(locationData.longitude);
            // Validate radius
            const { isValid, distance } = (0, attendance_service_1.isWithinAllowedRadius)(userLat, userLon);
            const record = await (0, attendance_service_1.recordAttendance)(db, {
                zalo_id,
                type: 'check_in',
                latitude: locationData.latitude,
                longitude: locationData.longitude,
                distance_from_office: distance,
                status: isValid ? 'success' : 'failed',
                reason: isValid
                    ? undefined
                    : `Too far from office. Distance: ${distance.toFixed(2)}m`,
            });
            const response = {
                success: isValid,
                message: isValid
                    ? 'Check-in successful'
                    : 'Check-in failed - Outside allowed radius',
                data: {
                    ...record,
                    distance_from_office: distance.toFixed(2),
                },
            };
            res.json(response);
        }
        catch (error) {
            console.error('Check-in error:', error);
            res.status(500).json({
                success: false,
                error: 'Check-in failed',
            });
        }
    };
}
/**
 * POST /api/attendance/check-out
 */
async function checkOut(db) {
    return async (req, res) => {
        try {
            const { zalo_id, location_token } = req.body;
            if (!zalo_id || !location_token) {
                res.status(400).json({
                    error: 'zalo_id and location_token are required',
                });
                return;
            }
            // Convert token to coordinates
            const locationData = await (0, location_service_1.convertLocationToken)(location_token);
            const userLat = parseFloat(locationData.latitude);
            const userLon = parseFloat(locationData.longitude);
            // Validate radius
            const { isValid, distance } = (0, attendance_service_1.isWithinAllowedRadius)(userLat, userLon);
            const record = await (0, attendance_service_1.recordAttendance)(db, {
                zalo_id,
                type: 'check_out',
                latitude: locationData.latitude,
                longitude: locationData.longitude,
                distance_from_office: distance,
                status: isValid ? 'success' : 'failed',
                reason: isValid
                    ? undefined
                    : `Too far from office. Distance: ${distance.toFixed(2)}m`,
            });
            const response = {
                success: isValid,
                message: isValid
                    ? 'Check-out successful'
                    : 'Check-out failed - Outside allowed radius',
                data: {
                    ...record,
                    distance_from_office: distance.toFixed(2),
                },
            };
            res.json(response);
        }
        catch (error) {
            console.error('Check-out error:', error);
            res.status(500).json({
                success: false,
                error: 'Check-out failed',
            });
        }
    };
}
/**
 * GET /api/attendance/today
 */
async function getTodayRecords(db) {
    return async (req, res) => {
        try {
            const { zalo_id } = req.query;
            if (!zalo_id) {
                res.status(400).json({ error: 'zalo_id is required' });
                return;
            }
            const records = await (0, attendance_service_1.getTodayAttendance)(db, zalo_id);
            res.json({
                success: true,
                data: records,
            });
        }
        catch (error) {
            console.error('Get today records error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch records',
            });
        }
    };
}
//# sourceMappingURL=attendance.controller.js.map