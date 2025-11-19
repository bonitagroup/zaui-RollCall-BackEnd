"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertToken = convertToken;
const location_service_1 = require("../services/location.service");
/**
 * POST /api/location/convert-token
 * Convert Zalo location token to coordinates
 */
async function convertToken(req, res) {
    try {
        const { token } = req.body;
        if (!token) {
            res.status(400).json({ error: 'token is required' });
            return;
        }
        const locationData = await (0, location_service_1.convertLocationToken)(token);
        const response = {
            latitude: parseFloat(locationData.latitude),
            longitude: parseFloat(locationData.longitude),
            provider: locationData.provider,
            timestamp: locationData.timestamp,
        };
        res.json({
            success: true,
            data: response,
        });
    }
    catch (error) {
        console.error('Convert token error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to convert location token',
        });
    }
}
//# sourceMappingURL=location.controller.js.map