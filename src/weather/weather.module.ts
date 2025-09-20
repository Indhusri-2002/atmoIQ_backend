// src/weather/weather.module.ts

import { Module } from '@nestjs/common';
import { WeatherController } from './weather.controller';
import { WeatherService } from './weather.service';
import { MongooseModule } from '@nestjs/mongoose';
import { WeatherData, WeatherDataSchema } from './schemas/weather.schema';
import { DailySummary, DailySummarySchema } from './schemas/daily-summary.schema';
import { EmailService } from '../email/email.service';
import { Threshold, ThresholdSchema } from './schemas/threshold.schema';
import { AirQualityService } from 'src/air-quality/air-quality.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WeatherData.name, schema: WeatherDataSchema },
      { name: DailySummary.name, schema: DailySummarySchema },
      { name: Threshold.name, schema: ThresholdSchema },
    ]),
  ],
  controllers: [WeatherController],
  providers: [WeatherService,EmailService,AirQualityService],
})
export class WeatherModule {}
