"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.locationConfig = exports.zaloConfig = void 0;
exports.zaloConfig = {
    appId: process.env.ZALO_APP_ID || '',
    appSecret: process.env.ZALO_APP_SECRET || '',
    accessToken: process.env.ZALO_ACCESS_TOKEN || '',
    graphApiUrl: 'https://graph.zalo.me/v2.0',
};
exports.locationConfig = {
    officeLatitude: parseFloat(process.env.OFFICE_LATITUDE || '21.5863937'),
    officeLongitude: parseFloat(process.env.OFFICE_LONGITUDE || '105.8424984'),
    allowedRadius: parseFloat(process.env.ALLOWED_RADIUS || '50'),
};
//# sourceMappingURL=zalo.config.js.map