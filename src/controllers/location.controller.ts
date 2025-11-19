import { Request, Response } from 'express';
import { convertLocationToken, LocationData } from '../services/location.service';

interface ConvertTokenRequest {
  token: string;
}

interface LocationResponse {
  latitude: number;
  longitude: number;
  provider: string;
  timestamp: string;
}

/**
 * POST /api/location/convert-token
 * Convert Zalo location token to coordinates
 */
export async function convertToken(req: Request, res: Response): Promise<void> {
  try {
    const { token, accessToken } = req.body;

    if (!token) {
      res.status(400).json({ error: 'token is required' });
      return;
    }

    // Truyền accessToken động vào service
    const locationData: LocationData = await convertLocationToken(token, accessToken);

    const response: LocationResponse = {
      latitude: parseFloat(locationData.latitude),
      longitude: parseFloat(locationData.longitude),
      provider: locationData.provider,
      timestamp: locationData.timestamp,
    };

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Convert token error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to convert location token',
    });
  }
}
