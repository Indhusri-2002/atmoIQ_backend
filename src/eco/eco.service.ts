import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserCoins, UserCoinsDocument } from './eco.schema';
import * as moment from 'moment';
import { Cron } from '@nestjs/schedule';
import { LeaderboardResult, LeaderboardUser } from './eco.dto';

@Injectable()
export class EcoService {
  constructor(
    @InjectModel(UserCoins.name)
    private userCoinsModel: Model<UserCoinsDocument>,
  ) {}

  private getTodayDate(): string {
    return moment().format('YYYY-MM-DD');
  }

  async getTodayCoins(userId: string, username?: string) {
    const today = this.getTodayDate();

    const record = await this.userCoinsModel.findOneAndUpdate(
      { userId, date: today },
      {
        $setOnInsert: {
          balance: 100,
          actionsTaken: [],
          username: username || '', // store username if provided
        },
      },
      { new: true, upsert: true },
    );

    return record;
  }

  async getLeaderboard(currentUserId: string): Promise<LeaderboardResult> {
    const today = this.getTodayDate();

    const allUsersRaw = await this.userCoinsModel
      .find({ date: today, actionsTaken: { $ne: [] }  })
      .sort({ balance: -1 })
      .select('userId username balance')
      .lean();

    const allUsers: LeaderboardUser[] = allUsersRaw.map((u) => ({
      userId: u.userId.toString(),
      username: u.username,
      balance: u.balance,
    }));

    const top5 = allUsers.slice(0, 5);

    const position = allUsers.findIndex((u) => u.userId === currentUserId) + 1;

    const userRank =
      position <= 5 || position === 0
        ? null
        : { ...allUsers[position - 1], position };

    return { top5, userRank };
  }

  async updateAction(userId: string, action: { name: string; coins: number }) {
    const today = this.getTodayDate();
    let record = await this.getTodayCoins(userId);

    const index = record.actionsTaken.indexOf(action.name);
    if (index > -1) {
      // Deselect action
      record.actionsTaken.splice(index, 1);
      record.balance -= action.coins;
    } else {
      // Select action
      record.actionsTaken.push(action.name);
      record.balance += action.coins;
    }

    // Make sure username is up-to-date
    if (!record.username) {
      const user = await this.userCoinsModel.findById(userId);
      record.username = user?.username || '';
    }

    await record.save();
    return record;
  }

  async getWeeklyHistory(userId: string) {
    const today = moment().startOf('day');
    const weekAgo = moment().subtract(6, 'days').startOf('day');

    return this.userCoinsModel
      .find({
        userId,
        date: {
          $gte: weekAgo.format('YYYY-MM-DD'),
          $lte: today.format('YYYY-MM-DD'),
        },
        actionsTaken: { $ne: [] }, // exclude empty
        $expr: { $ne: ['$createdAt', '$updatedAt'] }, // exclude untouched
      })
      .sort({ date: 1 });
  }

  async getHistory(userId: string) {
    return this.userCoinsModel
      .find({
        userId,
        actionsTaken: { $ne: [] },
        $expr: { $ne: ['$createdAt', '$updatedAt'] },
      })
      .sort({ date: -1 });
  }

  // ------------------ CRON JOB ------------------
  // Reset all users' coins to 100 at 10 AM every day
  @Cron('0 10 * * *') // 10 AM every day
  async resetDailyCoins() {
    const today = this.getTodayDate();
    const users = await this.userCoinsModel.distinct('userId');

    for (const userId of users) {
      await this.getTodayCoins(userId.toString());
    }

    console.log(
      `[EcoService] Daily coins reset completed for ${users.length} users on ${today}`,
    );
  }
}
