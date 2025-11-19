export interface LocationData {
    provider: string;
    latitude: string;
    longitude: string;
    timestamp: string;
}
/**
 * Convert Zalo location token to actual coordinates
 */
export declare function convertLocationToken(token: string): Promise<LocationData>;
//# sourceMappingURL=location.service.d.ts.map