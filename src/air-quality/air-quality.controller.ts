// src/air-quality/air-quality.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { AirQualityService } from './air-quality.service';

@Controller('air-quality')
export class AirQualityController {
  constructor(private readonly airQualityService: AirQualityService) {}

  @Get('current')
  async fetchAirQuality(@Query('lat') lat: number, @Query('lon') lon: number) {
    return this.airQualityService.fetchAirQuality(lat, lon);
  }
}
