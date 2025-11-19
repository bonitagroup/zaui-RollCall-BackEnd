"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertLocationToken = convertLocationToken;
const axios_1 = __importDefault(require("axios"));
const zalo_config_1 = require("../config/zalo.config");
/**
 * Convert Zalo location token to actual coordinates
 */
async function convertLocationToken(token) {
    try {
        const response = await axios_1.default.get(`${zalo_config_1.zaloConfig.graphApiUrl}/me/info`, {
            headers: {
                access_token: zalo_config_1.zaloConfig.accessToken,
                code: token,
                secret_key: zalo_config_1.zaloConfig.appSecret,
            },
        });
        if (response.data.error !== 0) {
            throw new Error(`Zalo API error: ${response.data.message}`);
        }
        return response.data.data;
    }
    catch (error) {
        console.error('Convert location token error:', error);
        throw error;
    }
}
//# sourceMappingURL=location.service.js.map