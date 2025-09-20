// src/auth/auth.service.ts
import { forwardRef, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../users/user.schema';
import { EcoService } from 'src/eco/eco.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectModel(User.name) private userModel: Model<User>,
    @Inject(forwardRef(() => EcoService)) private ecoService: EcoService,

  ) {}

async signup(email: string, password: string) {
  const hashed = await bcrypt.hash(password, 10);

  // Generate username from email
  const username = email.split('@')[0];

  const user = new this.userModel({ email, password: hashed, username });
  const saved = await user.save();

  // ✅ create today's record right away
  await this.ecoService.getTodayCoins(saved._id.toString(), saved.username);

  return saved;
}

async login(email: string, password: string) {
  const user = await this.userModel.findOne({ email });
  if (!user) throw new UnauthorizedException('Invalid credentials');

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new UnauthorizedException('Invalid credentials');

  // ✅ ensure today’s record exists
  await this.ecoService.getTodayCoins(user._id.toString());

  const payload = { sub: user._id, email: user.email };
  const accessToken = this.jwtService.sign(payload);
  return { accessToken };
}
}
