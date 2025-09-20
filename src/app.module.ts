import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WeatherModule } from './weather/weather.module';
import { ConfigService } from './config/config.service';
import { ScheduleModule } from '@nestjs/schedule';
import { AirQualityModule } from './air-quality/air-quality.module';
import { AuthModule } from './auth/auth.module';
import { EcoModule } from './eco/eco.module';

const configService = ConfigService.getInstance();
const mongoURI = configService.get('MONGO_URI');

@Module({
  imports: [
    MongooseModule.forRoot(mongoURI),
    ScheduleModule.forRoot(),
    WeatherModule,
    AirQualityModule,
    AuthModule,
    EcoModule
  ],
})
export class AppModule {}
