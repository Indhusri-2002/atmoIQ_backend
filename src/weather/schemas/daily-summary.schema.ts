// src/weather/schemas/daily-summary.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DailySummaryDocument = DailySummary & Document;

@Schema({ timestamps: true }) // Enable timestamps
export class DailySummary {
  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  date: string;  // Date in format YYYY-MM-DD

  @Prop({ required: true })
  avgTemp: number;

  @Prop({ required: true })
  maxTemp: number;

  @Prop({ required: true })
  minTemp: number;

  @Prop({ required: true })
  dominantCondition: string;

  @Prop({ required: true })
  avgHumidity: number;  // New field for average humidity

  @Prop({ required: true })
  avgWindSpeed: number;  // New field for average wind speed

  @Prop({ required: true })
  avgAqi: number;  // New field for average AQI

  // Index to auto-delete documents after 7 days
  @Prop({ default: Date.now, expires: 604800 }) // 604800 seconds = 7 days
  createdAt: Date;
}

export const DailySummarySchema = SchemaFactory.createForClass(DailySummary);
