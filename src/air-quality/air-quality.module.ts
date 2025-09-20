import { AirQualityService } from './air-quality.service';
import { AirQualityController } from './air-quality.controller';
import { Module } from '@nestjs/common';

@Module({
  imports: [],
  controllers: [AirQualityController],
  providers: [AirQualityService],
})
export class AirQualityModule {}
