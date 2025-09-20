// src/weather/weather.service.ts
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import { ConfigService } from '../config/config.service';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WeatherData, WeatherDataDocument } from './schemas/weather.schema';
import {
  DailySummary,
  DailySummaryDocument,
} from './schemas/daily-summary.schema';
import { Threshold, ThresholdDocument } from './schemas/threshold.schema';
import { EmailService } from 'src/email/email.service';
import { AirQualityService } from 'src/air-quality/air-quality.service';

interface WeatherAPIResponse {
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
  };
  wind: {
    speed: number;
  };
  weather: {
    main: string;
  }[];
  dt: number;
}

const configService = ConfigService.getInstance();
const openWeatherApiKey: string = configService.get('OPENWEATHER_API_KEY');
const openWeatherApiUrl: string = configService.get('OPENWEATHER_API_URL');

const city_coords_string: string = configService.get('CITY_COORDS');
const city_coords: Record<string, { lat: number; lon: number }> =
  JSON.parse(city_coords_string);

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);

  constructor(
    @InjectModel(WeatherData.name)
    private readonly weatherModel: Model<WeatherDataDocument>,
    @InjectModel(DailySummary.name)
    private readonly dailySummaryModel: Model<DailySummaryDocument>,
    @InjectModel(Threshold.name)
    private readonly thresholdModel: Model<ThresholdDocument>, // Inject Threshold model
    private readonly emailService: EmailService, // Import the EmailService
    private readonly airQualityService: AirQualityService,
  ) {}

  // Cron job to run every 5 minutes
  @Cron('0 */5 * * * *') // Runs every 5 minutes
  async handleWeatherDataFetch(): Promise<void> {
    this.logger.log('Fetching weather data for cities...');
    await this.fetchWeatherData();
    await this.calculateDailyAggregates();
    await this.checkThresholds(); // Check thresholds after fetching data
  }

  async getOpenWeatherData(city: string) {
    try {
      const response = await axios.get(`${openWeatherApiUrl}/weather`, {
        params: {
          q: city,
          appid: openWeatherApiKey,
        },
      });

      return response.data;
    } catch (error) {
      this.logger.error(`Error fetching data for ${city}: ${error.message}`);
    }
  }

  // Fetch weather data from OpenWeatherMap API using axios
  async fetchWeatherData(): Promise<void> {
    for (const [city, coords] of Object.entries(city_coords)) {
      try {
        const aqi = await this.airQualityService.fetchAirQuality(
          coords.lat,
          coords.lon,
        );
        const response: AxiosResponse<WeatherAPIResponse> = await axios.get(
          `${openWeatherApiUrl}/weather`,
          {
            params: {
              q: city,
              appid: openWeatherApiKey,
            },
          },
        );

        const data = response.data;
        const temperatureCelsius: number = this.kelvinToCelsius(data.main.temp);
        const feelsLikeCelsius: number = this.kelvinToCelsius(
          data.main.feels_like,
        );
        const humidity: number = data.main.humidity;
        const windSpeed: number = data.wind.speed;

        const weatherSummary: Partial<WeatherDataDocument> = {
          city,
          temperature: temperatureCelsius,
          feelsLike: feelsLikeCelsius,
          weatherCondition: data.weather[0].main,
          humidity,
          windSpeed,
          aqi,
          timestamp: new Date(data.dt * 1000),
        };

        // Save the weather data for each city
        await this.saveWeatherData(weatherSummary);
      } catch (error) {
        this.logger.error(`Error fetching data for ${city}: ${error.message}`);
      }
    }
  }

  // Convert Kelvin to Celsius
  private kelvinToCelsius(kelvin: number): number {
    return kelvin - 273.15;
  }

  // Save the weather data to MongoDB
  private async saveWeatherData(
    summary: Partial<WeatherDataDocument>,
  ): Promise<void> {
    const newWeatherData = new this.weatherModel(summary);
    await newWeatherData.save();
    this.logger.log(
      `Weather data saved for ${summary.city}: ${summary.temperature}°C`,
    );
  }

  // Calculate daily aggregates for each city
  async calculateDailyAggregates(): Promise<void> {
    for (const [city, _] of Object.entries(city_coords)) {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      const weatherData: WeatherDataDocument[] = await this.weatherModel.find({
        city,
        timestamp: { $gte: startOfDay, $lte: endOfDay },
      });

      if (weatherData.length === 0) {
        this.logger.warn(`No weather data found for ${city} today.`);
        continue;
      }

      // Calculate the daily aggregates
      const temperatures = weatherData.map((data) => data.temperature);
      const humidities = weatherData.map((data) => data.humidity);
      const windSpeeds = weatherData.map((data) => data.windSpeed);
      const maxTemp = Math.max(...temperatures);
      const minTemp = Math.min(...temperatures);
      const avgTemp =
        temperatures.reduce((sum, temp) => sum + temp, 0) / temperatures.length;
      const avgHumidity =
        humidities.reduce((sum, hum) => sum + hum, 0) / humidities.length;
      const avgWindSpeed =
        windSpeeds.reduce((sum, speed) => sum + speed, 0) / windSpeeds.length;
      const dominantCondition =
        this.calculateDominantWeatherCondition(weatherData);
      const aqiValues = weatherData
        .map((data) => data.aqi?.aqi)
        .filter((v) => v !== undefined);
      const avgAqi =
        aqiValues.length > 0
          ? aqiValues.reduce((sum, v) => sum + v, 0) / aqiValues.length
          : null;

      // Create the daily summary
      const dailySummary: Partial<DailySummaryDocument> = {
        city,
        date: new Date().toISOString().slice(0, 10), // format YYYY-MM-DD
        avgTemp,
        maxTemp,
        minTemp,
        dominantCondition,
        avgHumidity,
        avgWindSpeed,
        avgAqi,
      };

      await this.saveDailySummary(dailySummary);

      this.logger.log(
        `Daily summary for ${city} - Avg Temp: ${avgTemp}°C, Avg Humidity: ${avgHumidity}%, Avg Wind Speed: ${avgWindSpeed} m/s, Dominant Condition: ${dominantCondition}`,
      );
    }
  }

  // Save the daily summary to MongoDB
  private async saveDailySummary(
    summary: Partial<DailySummaryDocument>,
  ): Promise<void> {
    const newDailySummary = new this.dailySummaryModel(summary);
    await newDailySummary.save();
    this.logger.log(
      `Daily weather summary saved for ${summary.city}: Avg Temp: ${summary.avgTemp}°C, Avg Humidity: ${summary.avgHumidity}%`,
    );
  }

  // Calculate the dominant weather condition
  private calculateDominantWeatherCondition(
    data: WeatherDataDocument[],
  ): string {
    const conditionCount: { [key: string]: number } = {};
    data.forEach((item: WeatherDataDocument) => {
      const condition = item.weatherCondition;
      conditionCount[condition] = (conditionCount[condition] || 0) + 1;
    });
    return Object.keys(conditionCount).reduce((a, b) =>
      conditionCount[a] > conditionCount[b] ? a : b,
    );
  }

  // Get the daily summary for a specific city
  async getDailySummary(city: string): Promise<DailySummaryDocument> {
    const today = new Date().toISOString().slice(0, 10);
    const summary = await this.dailySummaryModel
      .findOne({ city, date: today })
      .sort({ createdAt: -1 }); // Sort by createdAt in descending order
    if (!summary) {
      throw new Error(`No daily summary found for city: ${city}`);
    }
    return summary;
  }

  // Get weather history for the past 'n' days for a specific city
  async getWeatherHistoryByDate(
    city: string,
    date: string,
  ): Promise<DailySummaryDocument[]> {
    // Fetch the history based on city and date, sorted by creation time (latest first)
    const history = await this.dailySummaryModel
      .find({
        city,
        date: { $eq: date },
      })
      .sort({ createdAt: -1 }); // Sort by 'createdAt' to get the latest records

    // Throw an error if no records are found
    if (history.length === 0) {
      throw new Error(
        `No weather history found for city: ${city} on date: ${date}.`,
      );
    }

    return history;
  }

  // Get weather history for the past 'n' days for a specific city latest of each day
  async getLatestWeatherHistory(days: number = 1, city?: string): Promise<any> {
    const today = new Date();
    const pastDate = new Date();
    pastDate.setDate(today.getDate() - days);

    const matchQuery: any = {
      createdAt: { $gte: pastDate },
    };

    if (city) {
      matchQuery.city = city;
    }

    this.logger.debug(
      `Fetching weather history for ${city ? city : 'all cities'} from ${pastDate.toISOString()} to ${today.toISOString()}`,
    );

    try {
      const latestWeatherHistory = await this.dailySummaryModel.aggregate([
        {
          $match: matchQuery,
        },
        {
          $sort: {
            city: 1,
            date: 1,
            createdAt: -1,
          },
        },
        {
          $group: {
            _id: {
              city: '$city',
              date: '$date',
            },
            latestRecord: { $first: '$$ROOT' },
          },
        },
        {
          $replaceRoot: {
            newRoot: '$latestRecord',
          },
        },
      ]);

      this.logger.debug(`Retrieved ${latestWeatherHistory.length} records`);
      return latestWeatherHistory;
    } catch (error) {
      this.logger.error('Error retrieving weather history', error);
      throw error; // Rethrow or handle the error as needed
    }
  }

  // Method to create threshold
  async createThreshold(
    city: string,
    userEmail: string, 
    weatherCondition?: string,
    temperatureThreshold?: number,
    aqiThreshold?: number,
  ) {
    try {
      const threshold = new this.thresholdModel({
        city,
        temperatureThreshold,
        weatherCondition,
        email: userEmail,
        aqiThreshold,
      });
      return await threshold.save();
    } catch (error) {
      if (error.code === 11000) {
        // MongoDB duplicate key error code
        throw new BadRequestException(
          `A threshold for city "${city}", temperature "${temperatureThreshold}", and email "${userEmail}" already exists.`,
        );
      }
      throw error;
    }
  }

  // Method to check for threshold breaches
  async checkThresholds() {
    const thresholds = await this.thresholdModel.find();

    for (const threshold of thresholds) {
      const latestWeather = await this.weatherModel
        .findOne({ city: threshold.city })
        .sort({ timestamp: -1 });

      if (!latestWeather) continue;

      // === Temperature Threshold ===
      if (threshold.temperatureThreshold !== undefined) {
        if (latestWeather.temperature > threshold.temperatureThreshold) {
          threshold.breachCount++;
          if (threshold.breachCount >= 2) {
            await this.triggerAlert(
              threshold.city,
              latestWeather.temperature,
              threshold.email,
              'TEMP',
            );
            threshold.breachCount = 0;
          }
        } else {
          threshold.breachCount = 0;
        }
      }

      // === AQI Threshold ===
      if (threshold.aqiThreshold !== undefined && latestWeather.aqi) {
        if (latestWeather.aqi.aqi > threshold.aqiThreshold) {
          threshold.breachCount++;
          if (threshold.breachCount >= 2) {
            await this.triggerAlert(
              threshold.city,
              latestWeather.aqi.aqi,
              threshold.email,
              'AQI',
            );
            threshold.breachCount = 0;
          }
        } else {
          threshold.breachCount = 0;
        }
      }

      await threshold.save(); // Save the updated breach count
    }
  }

  // Method to trigger alert
  private async triggerAlert(
    city: string,
    value: number,
    mailTo: string,
    type: 'TEMP' | 'AQI',
  ) {
    if (type === 'TEMP') {
      this.logger.warn(
        `ALERT! ${city} temperature has exceeded threshold: ${value}°C`,
      );
    } else {
      this.logger.warn(`ALERT! ${city} AQI has exceeded threshold: ${value}`);
    }
    // Implement email notification logic here (not included for brevity)
    return await this.emailService.sendEmailAlert(city, value, mailTo, type); // Call the email service to send alert
  }

  // Method to get all thresholds
  async getAllThresholds(userEmail: string): Promise<ThresholdDocument[]> {
    return await this.thresholdModel.find({ email: userEmail }).exec();
  }

  // Method to update a threshold by ID
  async updateThreshold(
    id: string,
    city: string,
    userEmail: string,
    weatherCondition?: string,
    temperatureThreshold?: number,
    aqiThreshold?: number,
  ): Promise<ThresholdDocument> {
    const updatedThreshold = await this.thresholdModel.findOneAndUpdate(
      { _id: id, email: userEmail },
      { city, temperatureThreshold, weatherCondition, aqiThreshold },
      { new: true }, // Return the updated document
    );
    if (!updatedThreshold) {
      throw new Error(`Threshold with ID ${id} not found.`);
    }
    return updatedThreshold;
  }

  // Method to delete a threshold by ID
 async deleteThreshold(id: string, userEmail: string): Promise<ThresholdDocument> {
   const deletedThreshold = await this.thresholdModel.findOneAndDelete({
     _id: id,
     email: userEmail,
   });
   if (!deletedThreshold) {
     throw new Error(`Threshold with ID ${id} not found or you do not have permission.`);
   }
   return deletedThreshold;
 }
}
