import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EcoService } from './eco.service';
import { EcoController } from './eco.controller';
import { UserCoins, UserCoinsSchema } from './eco.schema';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: UserCoins.name, schema: UserCoinsSchema }]),
    forwardRef(() => AuthModule),

  ],
  controllers: [EcoController],
  providers: [EcoService],
  exports: [EcoService], // ✅ make EcoService available outside

})
export class EcoModule {}
