import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from './config/config.service';

const configService = ConfigService.getInstance();
const port = configService.get('PORT') || 3000;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // Enable CORS for cross-origin requests from the frontend
  await app.listen(port);
}
bootstrap();
