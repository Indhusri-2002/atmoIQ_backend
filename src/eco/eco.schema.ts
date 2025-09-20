import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserCoinsDocument = UserCoins & Document;

// eco.schema.ts
@Schema({ timestamps: true })
export class UserCoins {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  username: string; // NEW FIELD

  @Prop({ required: true })
  date: string; // format: YYYY-MM-DD

  @Prop({ required: true, default: 100 })
  balance: number;

  @Prop({ type: [String], default: [] })
  actionsTaken: string[];
}

export const UserCoinsSchema = SchemaFactory.createForClass(UserCoins);

// 🚨 Prevent duplicate records for a user on the same date
UserCoinsSchema.index({ userId: 1, date: 1 }, { unique: true });
