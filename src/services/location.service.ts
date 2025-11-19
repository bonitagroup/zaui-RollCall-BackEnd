import axios, { AxiosResponse } from 'axios';
import { zaloConfig } from '../config/zalo.config';

export interface LocationData {
  provider: string;
  latitude: string;
  longitude: string;
  timestamp: string;
}

interface ZaloApiResponse {
  error: number;
  message: string;
  data: LocationData;
}

export async function convertLocationToken(
  token: string,
  accessToken?: string
): Promise<LocationData> {
  try {
    const response: AxiosResponse<ZaloApiResponse> = await axios.get(
      `${zaloConfig.graphApiUrl}/me/info`,
      {
        headers: {
          access_token: accessToken || zaloConfig.accessToken,
          code: token,
          secret_key: zaloConfig.appSecret,
        },
      }
    );

    if (response.data.error !== 0) {
      // Log toàn bộ response để dễ debug
      console.error('Zalo API error:', response.data);
      throw new Error(`Zalo API error: ${response.data.message || 'Unknown error'}`);
    }

    return response.data.data;
  } catch (error: any) {
    // Log lỗi chi tiết để kiểm tra nguyên nhân
    if (error.response) {
      console.error('Convert location token error (response):', error.response.data);
      throw new Error(error.response.data?.message || 'Failed to convert location token');
    }
    console.error('Convert location token error:', error);
    throw new Error('Failed to convert location token');
  }
}
