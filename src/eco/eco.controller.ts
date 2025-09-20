import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { EcoService } from './eco.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('eco')
export class EcoController {
  constructor(private readonly ecoService: EcoService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('coins')
  async getTodayCoins(@Req() req) {
    return this.ecoService.getTodayCoins(req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('action')
  async updateAction(
    @Req() req,
    @Body() body: { name: string; coins: number },
  ) {
    return this.ecoService.updateAction(req.user.userId, body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('history')
  async getHistory(@Req() req) {
    return this.ecoService.getHistory(req.user.userId);
  }

  // eco.controller.ts
  @UseGuards(AuthGuard('jwt'))
  @Get('weekly')
  async getWeekly(@Req() req) {
    return this.ecoService.getWeeklyHistory(req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('leaderboard')
  async getLeaderboard(@Req() req) {
    return this.ecoService.getLeaderboard(req.user.userId);
  }
}
