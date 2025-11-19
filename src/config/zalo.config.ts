interface ZaloConfig {
  appId: string;
  appSecret: string;
  accessToken: string;
  graphApiUrl: string;
}

interface LocationConfig {
  officeLatitude: number;
  officeLongitude: number;
  allowedRadius: number;
}

export const zaloConfig: ZaloConfig = {
  appId: process.env.ZALO_APP_ID || '',
  appSecret: process.env.ZALO_APP_SECRET || '',
  accessToken: process.env.ZALO_ACCESS_TOKEN || '',
  graphApiUrl: 'https://graph.zalo.me/v2.0',
};

export const locationConfig: LocationConfig = {
  officeLatitude: parseFloat(process.env.OFFICE_LATITUDE || '21.5863937'),
  officeLongitude: parseFloat(process.env.OFFICE_LONGITUDE || '105.8424984'),
  allowedRadius: parseFloat(process.env.ALLOWED_RADIUS || '50'),
};
