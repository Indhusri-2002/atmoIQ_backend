import {
  Controller,
  Get,
  Query,
  Param,
  BadRequestException,
  Post,
  Body,
  Patch,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { WeatherService } from './weather.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get('city/:city')
  async getOpenWeatherData(@Param('city') city: string) {
    if (!city) {
      throw new BadRequestException('City name is required');
    }
    return this.weatherService.getOpenWeatherData(city);
  }

  // GET daily weather summary for a specific city
  @Get('daily-summary')
  async getDailySummary(@Query('city') city: string) {
    if (!city) {
      throw new BadRequestException('City name is required');
    }
    return this.weatherService.getDailySummary(city);
  }

  // GET weather history for a specific city and number of days
  @Get('history-date')
  async getWeatherHistoryByDate(
    @Query('city') city: string,
    @Query('date') date: string,
  ) {
    if (!city || !date) {
      throw new BadRequestException('City name and date are required');
    }

    return this.weatherService.getWeatherHistoryByDate(city, date);
  }

  @Get('/latest-history')
  async getLatestWeatherHistory(
    @Query('days') days: number,
    @Query('city') city?: string, // Optional city parameter
  ) {
    return this.weatherService.getLatestWeatherHistory(days, city);
  }

  // POST endpoint to create a threshold
  @UseGuards(AuthGuard('jwt'))
  @Post('threshold')
  async createThreshold(
    @Req() req,  
    @Body('city') city: string,
    @Body('temperatureThreshold') temperatureThreshold: number,
    @Body('aqiThreshold') aqiThreshold: number,
    @Body('weatherCondition') weatherCondition?: string, // Optional
  ) {
    return this.weatherService.createThreshold(
      city,
      req.user.email,
      weatherCondition,
      temperatureThreshold,
      aqiThreshold,
    );
  }

  // GET endpoint to fetch all thresholds
  @UseGuards(AuthGuard('jwt'))
  @Get('thresholds')
  async getAllThresholds(@Req() req) {
    return await this.weatherService.getAllThresholds(req.user.email);
  }

  // PATCH endpoint to update a threshold by ID
  @UseGuards(AuthGuard('jwt'))
  @Patch('threshold/:id')
  async updateThreshold(
    @Req() req,
    @Param('id') id: string,
    @Body('city') city: string,
    @Body('weatherCondition') weatherCondition?: string, // Optional
    @Body('temperatureThreshold') temperatureThreshold?: number,
    @Body('aqiThreshold') aqiThreshold?: number,
  ) {
    return await this.weatherService.updateThreshold(
      id,
      city,
      req.user.email,
      weatherCondition,
      temperatureThreshold,
      aqiThreshold
    );
  }

  // DELETE endpoint to remove a threshold by ID
  @UseGuards(AuthGuard('jwt'))
  @Delete('threshold/:id')
  async deleteThreshold(@Req() req, @Param('id') id: string) {
    return await this.weatherService.deleteThreshold(id , req.user.email);
  }
}
