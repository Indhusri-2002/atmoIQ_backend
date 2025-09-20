// src/air-quality/air-quality.service.ts
import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import { ConfigService } from '../config/config.service';

interface AirPollutionResponse {
  list: {
    main: { aqi: number };
    components: {
      co: number;
      no: number;
      no2: number;
      o3: number;
      so2: number;
      pm2_5: number;
      pm10: number;
      nh3: number;
    };
    dt: number;
  }[];
}

const configService = ConfigService.getInstance();
const openWeatherApiKey: string = configService.get('OPENWEATHER_API_KEY');
const openWeatherApiUrl: string = configService.get('OPENWEATHER_API_URL');

@Injectable()
export class AirQualityService {
  private readonly logger = new Logger(AirQualityService.name);

  // === Fetch AQI for given lat/lon ===
  async fetchAirQuality(lat: number, lon: number) {
    try {
      const response: AxiosResponse<AirPollutionResponse> = await axios.get(
        `${openWeatherApiUrl}/air_pollution`,
        {
          params: {
            lat,
            lon,
            appid: openWeatherApiKey,
          },
        },
      );

      const data = response.data.list[0];
      const airQuality = {
        lat,
        lon,
        aqi: data.main.aqi,
        components: data.components,
        timestamp: new Date(data.dt * 1000),
      };

      this.logger.log(
        `Air quality saved for (lat: ${lat}, lon: ${lon}) - AQI: ${data.main.aqi}`,
      );
      return airQuality;
    } catch (error) {
      this.logger.error(
        `Error fetching AQI for (${lat},${lon}): ${error.message}`,
      );
    }
  }
}
